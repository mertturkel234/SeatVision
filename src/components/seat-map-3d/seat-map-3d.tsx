"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Auditorium, ScreeningAvailability, ScreeningPricing, Seat } from "@/lib/domain/types";
import {
  get3DSeatCoordinates,
  getAuditorium3DBounds,
  getViewFromSeatCamera,
  calculateRowElevation,
  type Vector3D,
} from "@/lib/domain/geometry-3d";
import {
  createAuditoriumMaterials,
  buildScreenMesh,
  buildSteppedFloorMesh,
  buildEnclosureMesh,
  buildSeatMesh,
  createRowLabelSprite,
} from "./auditorium-mesh-builder";
import { seatPrice, formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  RotateCcw,
  Compass,
  Eye,
  Maximize2,
  Grid3X3,
  Sparkles,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface SeatMap3DProps {
  auditorium: Auditorium;
  availability: ScreeningAvailability | null;
  pricing: ScreeningPricing | null;
  selectedSeatIds: string[];
  focusedSeatId?: string | null;
  highlightedSeatIds?: string[];
  onSelectSeat: (seatId: string) => void;
  onHoverSeat?: (seat: Seat | null) => void;
  onRequestViewFromSeat?: (seat: Seat) => void;
}

type CameraPreset = "overview" | "topdown" | "screen" | "seatView";

export function SeatMap3D({
  auditorium,
  availability,
  pricing,
  selectedSeatIds,
  focusedSeatId,
  highlightedSeatIds = [],
  onSelectSeat,
  onHoverSeat,
  onRequestViewFromSeat,
}: SeatMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hover state for tooltip overlay
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Active camera view mode
  const [cameraMode, setCameraMode] = useState<CameraPreset>("overview");
  const [viewingSeat, setViewingSeat] = useState<Seat | null>(null);

  // Three.js instances stored in refs to avoid re-initializing on simple state changes
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const seatsGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<ReturnType<typeof createAuditoriumMaterials> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Camera transition animation state
  const isTransitioningRef = useRef(false);
  const camStartPosRef = useRef(new THREE.Vector3());
  const camEndPosRef = useRef(new THREE.Vector3());
  const camStartTargetRef = useRef(new THREE.Vector3());
  const camEndTargetRef = useRef(new THREE.Vector3());
  const transitionStartRef = useRef(0);
  const transitionDurationRef = useRef(900); // ms

  // Calculate auditorium bounds
  const bounds = useMemo(() => getAuditorium3DBounds(auditorium), [auditorium]);

  // Default camera positions
  const defaultCameraSettings = useMemo(() => {
    return {
      overview: {
        position: new THREE.Vector3(0, bounds.height * 1.6, bounds.maxZ + bounds.length * 0.45),
        target: new THREE.Vector3(0, bounds.screenCenter.y * 0.6, bounds.center.z * 0.7),
      },
      topdown: {
        position: new THREE.Vector3(0, bounds.height * 2.8, bounds.center.z),
        target: new THREE.Vector3(0, 0, bounds.center.z),
      },
      screen: {
        position: new THREE.Vector3(0, bounds.screenCenter.y + 1, -1),
        target: new THREE.Vector3(0, calculateRowElevation(5) + 1, bounds.center.z),
      },
    };
  }, [bounds]);

  // Smooth camera animator function
  const animateCameraTo = useCallback((newPos: THREE.Vector3, newTarget: THREE.Vector3, duration = 850) => {
    if (!cameraRef.current || !controlsRef.current) return;
    camStartPosRef.current.copy(cameraRef.current.position);
    camEndPosRef.current.copy(newPos);
    camStartTargetRef.current.copy(controlsRef.current.target);
    camEndTargetRef.current.copy(newTarget);
    transitionStartRef.current = performance.now();
    transitionDurationRef.current = duration;
    isTransitioningRef.current = true;
    controlsRef.current.enabled = false;
  }, []);

  // Preset handlers
  const handleSetPreset = useCallback(
    (preset: "overview" | "topdown" | "screen") => {
      setCameraMode(preset);
      setViewingSeat(null);
      const settings = defaultCameraSettings[preset];
      animateCameraTo(settings.position, settings.target, 750);
    },
    [defaultCameraSettings, animateCameraTo]
  );

  // Transition into "View From Seat"
  const handleEnterViewFromSeat = useCallback(
    (seat: Seat) => {
      setViewingSeat(seat);
      setCameraMode("seatView");
      const cam = getViewFromSeatCamera(auditorium, seat);
      const pos = new THREE.Vector3(cam.position.x, cam.position.y, cam.position.z);
      const target = new THREE.Vector3(cam.target.x, cam.target.y, cam.target.z);
      animateCameraTo(pos, target, 950);
      onRequestViewFromSeat?.(seat);
    },
    [auditorium, animateCameraTo, onRequestViewFromSeat]
  );

  const handleExitViewFromSeat = useCallback(() => {
    handleSetPreset("overview");
  }, [handleSetPreset]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0b); // deep charcoal background
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 200);
    camera.position.copy(defaultCameraSettings.overview.position);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(defaultCameraSettings.overview.target);
    controls.minDistance = 3;
    controls.maxDistance = 55;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = 1.48; // Prevent camera from slipping under the floor!
    controlsRef.current = controls;

    // 5. Materials
    const materials = createAuditoriumMaterials();
    materialsRef.current = materials;

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0x38342c, 1.3);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff3db, 0x161618, 0.8);
    scene.add(hemiLight);

    // Ceiling warm spotlight washing center seating
    const ceilingSpot = new THREE.DirectionalLight(0xe8d5b5, 0.8);
    ceilingSpot.position.set(0, bounds.height + 4, bounds.center.z);
    ceilingSpot.target.position.set(0, 0, bounds.center.z);
    scene.add(ceilingSpot);
    scene.add(ceilingSpot.target);

    // 7. Architectural Geometry
    const screenMesh = buildScreenMesh(bounds, materials);
    scene.add(screenMesh);

    const floorMesh = buildSteppedFloorMesh(auditorium, bounds, materials);
    scene.add(floorMesh);

    const enclosureMesh = buildEnclosureMesh(bounds, materials);
    scene.add(enclosureMesh);

    // 8. Row Labels along the side walls
    auditorium.geometry.rowOrder.forEach((rowLabel, i) => {
      const elevation = calculateRowElevation(i);
      const rowSeats = auditorium.seats.filter((s) => s.row === rowLabel);
      if (rowSeats.length === 0) return;
      const avgZ = rowSeats.reduce((acc, s) => acc + (s.position?.y ?? 0), 0) / rowSeats.length;

      const leftLabel = createRowLabelSprite(rowLabel);
      leftLabel.position.set(-bounds.width / 2 - 0.5, elevation + 0.6, avgZ);
      scene.add(leftLabel);

      const rightLabel = createRowLabelSprite(rowLabel);
      rightLabel.position.set(bounds.width / 2 + 0.5, elevation + 0.6, avgZ);
      scene.add(rightLabel);
    });

    // 9. Seats Group
    const seatsGroup = new THREE.Group();
    seatsGroup.name = "seats-group";
    scene.add(seatsGroup);
    seatsGroupRef.current = seatsGroup;

    // 10. Animation Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Handle smooth camera interpolation
      if (isTransitioningRef.current) {
        const now = performance.now();
        const elapsed = now - transitionStartRef.current;
        const progress = Math.min(1, elapsed / transitionDurationRef.current);
        // Smooth easeInOutCubic
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(camStartPosRef.current, camEndPosRef.current, ease);
        controls.target.lerpVectors(camStartTargetRef.current, camEndTargetRef.current, ease);

        if (progress >= 1) {
          isTransitioningRef.current = false;
          controls.enabled = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 11. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      // Dispose materials
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [auditorium, bounds, defaultCameraSettings]);

  // Re-build or update 3D Seat instances when selection or availability changes
  useEffect(() => {
    const seatsGroup = seatsGroupRef.current;
    const materials = materialsRef.current;
    if (!seatsGroup || !materials) return;

    // Clear existing seats
    while (seatsGroup.children.length > 0) {
      const child = seatsGroup.children[0];
      seatsGroup.remove(child);
    }

    // Build seats from auditorium dataset
    auditorium.seats.forEach((seat) => {
      const coords = get3DSeatCoordinates(auditorium, seat);
      const isSelected = selectedSeatIds.includes(seat.id);
      const isHighlighted = highlightedSeatIds.includes(seat.id);
      const status = availability?.statuses[seat.id] ?? "available";
      const isUnavailable = status !== "available";

      const seatMesh = buildSeatMesh(seat, materials, {
        isSelected,
        isHighlighted,
        isUnavailable,
      });

      seatMesh.position.set(coords.position.x, coords.position.y, coords.position.z);
      seatMesh.rotation.y = coords.rotationY;

      seatsGroup.add(seatMesh);
    });
  }, [auditorium, availability, selectedSeatIds, highlightedSeatIds]);

  // Raycaster for mouse clicks and hover
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  const getSeatFromPointer = useCallback(
    (clientX: number, clientY: number): Seat | null => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      const seatsGroup = seatsGroupRef.current;
      if (!canvas || !camera || !seatsGroup) return null;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(seatsGroup.children, true);

      if (intersects.length > 0) {
        // Find ancestor with userData.seat
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.seat && obj !== seatsGroup) {
          obj = obj.parent;
        }
        if (obj?.userData?.seat) {
          return obj.userData.seat as Seat;
        }
      }
      return null;
    },
    [raycaster, mouse]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const seat = getSeatFromPointer(e.clientX, e.clientY);
    if (seat) {
      setHoveredSeat(seat);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setHoverPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      onHoverSeat?.(seat);
    } else {
      setHoveredSeat(null);
      setHoverPosition(null);
      onHoverSeat?.(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only handle primary left click
    if (e.button !== 0) return;
    const seat = getSeatFromPointer(e.clientX, e.clientY);
    if (seat) {
      const status = availability?.statuses[seat.id] ?? "available";
      if (status === "available") {
        onSelectSeat(seat.id);
      }
    }
  };

  // Currently focused / previewed seat detail
  const activeSeat = auditorium.seats.find((s) => s.id === focusedSeatId) ?? hoveredSeat;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-ink-950 border border-ink-800 select-none shadow-2xl flex flex-col justify-between"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className={cn(
          "absolute inset-0 w-full h-full outline-none",
          hoveredSeat ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
        )}
      />

      {/* Top Controls Overlay */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        <div className="flex items-center gap-2 pointer-events-auto bg-ink-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-ink-800 text-xs text-ivory-200 shadow-md">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="font-semibold text-ivory-100 font-mono">3D Spatial View</span>
          <span className="text-ivory-500">|</span>
          <span className="text-[11px] text-ivory-400">Orbit with drag · Scroll to zoom</span>
        </div>

        {/* Camera Preset Toolbar */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-ink-900/90 backdrop-blur-md p-1 rounded-xl border border-ink-800 shadow-md">
          <button
            onClick={() => handleSetPreset("overview")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              cameraMode === "overview"
                ? "bg-gold-500 text-ink-950 font-bold"
                : "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800"
            )}
            title="Overview isometric view"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleSetPreset("topdown")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              cameraMode === "topdown"
                ? "bg-gold-500 text-ink-950 font-bold"
                : "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800"
            )}
            title="Top-down architectural plan"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Top-Down</span>
          </button>

          <button
            onClick={() => handleSetPreset("screen")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              cameraMode === "screen"
                ? "bg-gold-500 text-ink-950 font-bold"
                : "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800"
            )}
            title="Facing toward the screen"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Screen-Facing</span>
          </button>
        </div>
      </div>

      {/* Special "View From Seat" Mode HUD Banner */}
      {cameraMode === "seatView" && viewingSeat && (
        <div className="relative z-10 mx-4 mb-2 p-3 rounded-xl bg-ink-900/95 backdrop-blur-md border border-gold-500/40 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500 text-ink-950 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gold-400 font-mono font-bold flex items-center gap-1.5">
                <span>EYE-LEVEL SIGHTLINE SIMULATION</span>
                <Badge variant="gold" className="text-[10px]">
                  Simulated
                </Badge>
              </div>
              <div className="text-sm font-bold text-ivory-50">
                Viewing Screen from Seat {viewingSeat.label} · Row {viewingSeat.row}
              </div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={handleExitViewFromSeat}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Exit Seat View
          </Button>
        </div>
      )}

      {/* Floating 3D Hover Tooltip */}
      {hoveredSeat && hoverPosition && cameraMode !== "seatView" && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in duration-150"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
          }}
        >
          <div className="bg-ink-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-gold-500/40 shadow-2xl text-xs space-y-1 text-center min-w-[140px]">
            <div className="font-bold text-ivory-50 text-sm font-mono flex items-center justify-center gap-1.5">
              <span>Seat {hoveredSeat.label}</span>
              <Badge
                variant={
                  hoveredSeat.category?.value === "premium"
                    ? "gold"
                    : hoveredSeat.kind === "wheelchair-space"
                    ? "secondary"
                    : "default"
                }
                className="text-[9px]"
              >
                {hoveredSeat.category?.value === "premium" ? "Premium" : "Standard"}
              </Badge>
            </div>

            <div className="text-gold-300 font-mono font-semibold text-[11px]">
              {formatMoneyOrUnknown(seatPrice(hoveredSeat, pricing))}
            </div>

            <div className="text-[10px] text-ivory-400">
              {availability?.statuses[hoveredSeat.id] === "available" ? (
                <span className="text-sage-400 font-medium">Available · Click to select</span>
              ) : (
                <span className="text-rose-400 font-medium">Sold / Blocked</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Action Bar: "Bu Koltuktan Gör" */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
        {activeSeat && cameraMode !== "seatView" ? (
          <div className="pointer-events-auto bg-ink-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-ink-800 shadow-xl flex items-center gap-3">
            <span className="text-xs text-ivory-300 font-medium font-mono">
              Seat <strong className="text-ivory-50">{activeSeat.label}</strong>
            </span>

            <Button
              variant="gold"
              size="sm"
              onClick={() => handleEnterViewFromSeat(activeSeat)}
              className="text-xs py-1"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Bu Koltuktan Gör (Eye-Level)
            </Button>
          </div>
        ) : (
          <div />
        )}

        {/* Reset Camera button */}
        <button
          onClick={() => handleSetPreset("overview")}
          className="pointer-events-auto bg-ink-900/90 hover:bg-ink-800 text-ivory-300 hover:text-ivory-100 p-2 rounded-xl border border-ink-800 transition-colors shadow-md text-xs flex items-center gap-1.5"
          title="Reset camera framing"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}
