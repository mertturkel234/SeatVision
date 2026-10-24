import * as THREE from "three";
import type { Auditorium, Seat } from "@/lib/domain/types";
import {
  get3DSeatCoordinates,
  getAuditorium3DBounds,
  calculateRowElevation,
  SCREEN_ELEVATION_Y_M,
  type Auditorium3DBounds,
} from "@/lib/domain/geometry-3d";

/**
 * Creates reusable shared materials for the cinema auditorium.
 */
export function createAuditoriumMaterials() {
  return {
    // Screen material (subtle glowing white/ivory cinema fabric)
    screen: new THREE.MeshStandardMaterial({
      color: 0xf5eedc,
      emissive: 0xfff3db,
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0.05,
    }),
    screenFrame: new THREE.MeshStandardMaterial({
      color: 0x0e0e10,
      roughness: 0.9,
      metalness: 0.1,
    }),
    // Stepped floor / platforms
    carpet: new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.95,
      metalness: 0.05,
    }),
    // Acoustic side walls with vertical wood slat accents
    wall: new THREE.MeshStandardMaterial({
      color: 0x1a1a1d,
      roughness: 0.85,
      metalness: 0.1,
    }),
    woodSlat: new THREE.MeshStandardMaterial({
      color: 0x2e251a,
      roughness: 0.6,
      metalness: 0.2,
    }),
    // Step lighting tread strips
    stepLight: new THREE.MeshBasicMaterial({
      color: 0xd1b076,
    }),
    // Seat base and metal legs
    seatFrame: new THREE.MeshStandardMaterial({
      color: 0x1c1c1f,
      roughness: 0.6,
      metalness: 0.5,
    }),
    // Seat cushion materials
    standardSeat: new THREE.MeshStandardMaterial({
      color: 0x27272b, // dark charcoal
      roughness: 0.75,
      metalness: 0.1,
    }),
    premiumSeat: new THREE.MeshStandardMaterial({
      color: 0x3d2d14, // warm amber/leather tone
      roughness: 0.55,
      metalness: 0.2,
    }),
    selectedSeat: new THREE.MeshStandardMaterial({
      color: 0xd1b076, // champagne gold
      emissive: 0x8f7142,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.3,
    }),
    recommendedSeat: new THREE.MeshStandardMaterial({
      color: 0x78581e,
      emissive: 0xb8955a,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    }),
    unavailableSeat: new THREE.MeshStandardMaterial({
      color: 0x18181a,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.35,
    }),
    wheelchairSeat: new THREE.MeshStandardMaterial({
      color: 0x0d2b38,
      roughness: 0.6,
      metalness: 0.2,
    }),
    armrestGold: new THREE.MeshStandardMaterial({
      color: 0x8f7142,
      roughness: 0.3,
      metalness: 0.6,
    }),
  };
}

export type AuditoriumMaterials = ReturnType<typeof createAuditoriumMaterials>;

/**
 * Creates a detailed 3D cinema screen (slightly curved horizontally for natural optics).
 */
export function buildScreenMesh(bounds: Auditorium3DBounds, materials: AuditoriumMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = "cinema-screen";

  const width = bounds.screenWidthM;
  const height = bounds.screenHeightM;
  const segments = 24;
  const curveDepth = 0.4; // slight horizontal inward curvature

  // Screen surface geometry
  const screenGeom = new THREE.PlaneGeometry(width, height, segments, 1);
  const pos = screenGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // Curve z backwards away from the center
    const zOffset = (1 - (x / (width / 2)) ** 2) * -curveDepth;
    pos.setZ(i, zOffset);
  }
  screenGeom.computeVertexNormals();

  const screenMesh = new THREE.Mesh(screenGeom, materials.screen);
  screenMesh.position.set(0, bounds.screenCenter.y, 0);
  group.add(screenMesh);

  // Screen frame border
  const borderThickness = 0.25;
  const frameGeom = new THREE.BoxGeometry(width + borderThickness * 2, height + borderThickness * 2, 0.2);
  const frameMesh = new THREE.Mesh(frameGeom, materials.screenFrame);
  frameMesh.position.set(0, bounds.screenCenter.y, 0.15);
  group.add(frameMesh);

  // Stage dais below screen
  const stageWidth = width + 4;
  const stageDepth = 3;
  const stageHeight = 0.5;
  const stageGeom = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
  const stageMesh = new THREE.Mesh(stageGeom, materials.carpet);
  stageMesh.position.set(0, stageHeight / 2, stageDepth / 2 - 1);
  group.add(stageMesh);

  // Soft glow light emanating from the screen into the auditorium
  const screenLight = new THREE.PointLight(0xffeedd, 1.2, bounds.length * 1.2, 1.2);
  screenLight.position.set(0, bounds.screenCenter.y, 2.5);
  group.add(screenLight);

  return group;
}

/**
 * Creates stepped floor risers for each row of seats.
 */
export function buildSteppedFloorMesh(
  auditorium: Auditorium,
  bounds: Auditorium3DBounds,
  materials: AuditoriumMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = "auditorium-floor";

  const rowOrder = auditorium.geometry.rowOrder;
  const floorWidth = bounds.width + 2;

  // Base floor slab
  const baseFloorGeom = new THREE.BoxGeometry(floorWidth, 0.1, bounds.length + 4);
  const baseFloor = new THREE.Mesh(baseFloorGeom, materials.carpet);
  baseFloor.position.set(0, -0.05, bounds.center.z);
  group.add(baseFloor);

  // Stepped platforms for each row
  rowOrder.forEach((rowLabel, i) => {
    const elevation = calculateRowElevation(i);
    const rowSeats = auditorium.seats.filter((s) => s.row === rowLabel);
    if (rowSeats.length === 0) return;

    const avgZ = rowSeats.reduce((acc, s) => acc + (s.position?.y ?? 0), 0) / rowSeats.length;
    const riserDepth = 1.15;

    const riserGeom = new THREE.BoxGeometry(floorWidth, elevation, riserDepth);
    const riserMesh = new THREE.Mesh(riserGeom, materials.carpet);
    riserMesh.position.set(0, elevation / 2, avgZ);
    group.add(riserMesh);

    // Warm LED step-edge light along the front nose of each riser
    const lightBarGeom = new THREE.BoxGeometry(floorWidth, 0.03, 0.04);
    const lightBar = new THREE.Mesh(lightBarGeom, materials.stepLight);
    lightBar.position.set(0, elevation, avgZ - riserDepth / 2);
    group.add(lightBar);
  });

  return group;
}

/**
 * Creates architectural side walls and subtle acoustic wood paneling.
 */
export function buildEnclosureMesh(
  bounds: Auditorium3DBounds,
  materials: AuditoriumMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = "auditorium-enclosure";

  const wallHeight = bounds.height + 2;
  const wallLength = bounds.length + 4;
  const wallThickness = 0.4;
  const halfWidth = bounds.width / 2 + 1;

  // Left Wall
  const leftWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
  const leftWall = new THREE.Mesh(leftWallGeom, materials.wall);
  leftWall.position.set(-halfWidth, wallHeight / 2, bounds.center.z);
  group.add(leftWall);

  // Right Wall
  const rightWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
  const rightWall = new THREE.Mesh(rightWallGeom, materials.wall);
  rightWall.position.set(halfWidth, wallHeight / 2, bounds.center.z);
  group.add(rightWall);

  // Back Wall
  const backWallGeom = new THREE.BoxGeometry(bounds.width + 2, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backWallGeom, materials.wall);
  backWall.position.set(0, wallHeight / 2, bounds.maxZ + 2);
  group.add(backWall);

  // Vertical decorative wood acoustic slats along both side walls
  const numSlats = 16;
  const slatSpacing = wallLength / (numSlats + 1);
  const slatGeom = new THREE.BoxGeometry(0.08, wallHeight * 0.7, 0.15);

  for (let i = 1; i <= numSlats; i++) {
    const z = bounds.minZ + i * slatSpacing;

    const leftSlat = new THREE.Mesh(slatGeom, materials.woodSlat);
    leftSlat.position.set(-halfWidth + wallThickness / 2 + 0.04, wallHeight / 2, z);
    group.add(leftSlat);

    const rightSlat = new THREE.Mesh(slatGeom, materials.woodSlat);
    rightSlat.position.set(halfWidth - wallThickness / 2 - 0.04, wallHeight / 2, z);
    group.add(rightSlat);
  }

  return group;
}

/**
 * Generates an individual, recognizable 3D cinema seat model.
 */
export function buildSeatMesh(
  seat: Seat,
  materials: AuditoriumMaterials,
  options: {
    isSelected?: boolean;
    isHighlighted?: boolean;
    isUnavailable?: boolean;
  } = {}
): THREE.Group {
  const seatGroup = new THREE.Group();
  seatGroup.name = `seat-${seat.id}`;
  seatGroup.userData = { seatId: seat.id, seat };

  const isPremium = seat.category?.value === "premium" || seat.category?.value === "recliner";
  const isWheelchair = seat.kind === "wheelchair-space";

  // Select material according to state
  let cushionMat: THREE.Material = materials.standardSeat;
  if (options.isUnavailable) {
    cushionMat = materials.unavailableSeat;
  } else if (options.isSelected) {
    cushionMat = materials.selectedSeat;
  } else if (options.isHighlighted) {
    cushionMat = materials.recommendedSeat;
  } else if (isWheelchair) {
    cushionMat = materials.wheelchairSeat;
  } else if (isPremium) {
    cushionMat = materials.premiumSeat;
  }

  const width = isPremium ? 0.78 : 0.52;
  const depth = isPremium ? 0.6 : 0.46;
  const seatHeight = isPremium ? 0.48 : 0.42;

  // 1. Pedestal / Legs
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
  const leg = new THREE.Mesh(legGeom, materials.seatFrame);
  leg.position.set(0, 0.14, 0);
  seatGroup.add(leg);

  // 2. Seat Cushion (rounded plump box)
  const cushionGeom = new THREE.BoxGeometry(width, 0.12, depth);
  const cushion = new THREE.Mesh(cushionGeom, cushionMat);
  cushion.position.set(0, 0.28, 0);
  seatGroup.add(cushion);

  // 3. Ergonomic Reclined Seat Back
  const backHeight = isPremium ? 0.65 : 0.54;
  const backGeom = new THREE.BoxGeometry(width, backHeight, 0.1);
  const seatBack = new THREE.Mesh(backGeom, cushionMat);
  // Position back at rear of cushion and tilt back slightly (recline)
  seatBack.position.set(0, 0.34 + backHeight / 2, depth / 2 - 0.02);
  seatBack.rotation.x = 0.12; // ~7 degrees recline
  seatGroup.add(seatBack);

  // 4. Headrest / Upper Cushion
  const headrestGeom = new THREE.BoxGeometry(width * 0.85, 0.16, 0.12);
  const headrest = new THREE.Mesh(headrestGeom, cushionMat);
  headrest.position.set(0, 0.32 + backHeight, depth / 2 + 0.04);
  headrest.rotation.x = 0.14;
  seatGroup.add(headrest);

  // 5. Armrests (Left & Right)
  const armWidth = 0.08;
  const armLength = depth * 0.85;
  const armHeight = 0.22;
  const armGeom = new THREE.BoxGeometry(armWidth, armHeight, armLength);

  // Left armrest
  const leftArm = new THREE.Mesh(armGeom, materials.seatFrame);
  leftArm.position.set(-width / 2 + armWidth / 2, 0.36, -0.02);
  seatGroup.add(leftArm);

  // Right armrest
  const rightArm = new THREE.Mesh(armGeom, materials.seatFrame);
  rightArm.position.set(width / 2 - armWidth / 2, 0.36, -0.02);
  seatGroup.add(rightArm);

  // Gold cup holder accent on right armrest
  const cupGeom = new THREE.CylinderGeometry(0.028, 0.024, 0.04, 12);
  const cup = new THREE.Mesh(cupGeom, materials.armrestGold);
  cup.position.set(width / 2 - armWidth / 2, 0.48, -armLength / 2 + 0.06);
  seatGroup.add(cup);

  // Raycasting invisible bounding hitbox for effortless clicking
  const hitboxGeom = new THREE.BoxGeometry(width + 0.08, backHeight + 0.5, depth + 0.15);
  const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitbox = new THREE.Mesh(hitboxGeom, hitboxMat);
  hitbox.position.set(0, 0.5, 0);
  hitbox.userData = { isHitbox: true, seatId: seat.id };
  seatGroup.add(hitbox);

  return seatGroup;
}

/**
 * Creates 3D text sprite for row labels along the side aisles.
 */
export function createRowLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
    ctx.roundRect?.(4, 4, 120, 56, 12);
    ctx.fill();
    ctx.strokeStyle = "#d1b076";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#f7f2e8";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.9, 0.45, 1);
  return sprite;
}
