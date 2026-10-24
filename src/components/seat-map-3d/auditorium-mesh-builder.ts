import * as THREE from "three";
import type { Auditorium, Seat } from "@/lib/domain/types";
import {
  calculateRowElevation,
  type Auditorium3DBounds,
} from "@/lib/domain/geometry-3d";

/**
 * Creates reusable shared materials for the cinema auditorium.
 * Tuned with balanced exposure, specular highlights, and clear visual hierarchy.
 */
export function createAuditoriumMaterials() {
  return {
    // Cinema screen (glowing warm-white cinema projection surface)
    screen: new THREE.MeshStandardMaterial({
      color: 0xfbf8f1,
      emissive: 0xfff6e5,
      emissiveIntensity: 0.48,
      roughness: 0.7,
      metalness: 0.05,
    }),
    screenFrame: new THREE.MeshStandardMaterial({
      color: 0x18181d,
      roughness: 0.7,
      metalness: 0.3,
    }),
    screenBezelTrim: new THREE.MeshStandardMaterial({
      color: 0xc4a159,
      roughness: 0.35,
      metalness: 0.75,
    }),
    // Stepped floor / platforms: visible dark slate carpet
    carpet: new THREE.MeshStandardMaterial({
      color: 0x222329,
      roughness: 0.88,
      metalness: 0.08,
    }),
    riserFace: new THREE.MeshStandardMaterial({
      color: 0x16171b,
      roughness: 0.9,
      metalness: 0.1,
    }),
    // Acoustic side walls with vertical wood slat accents
    wall: new THREE.MeshStandardMaterial({
      color: 0x1b1c21,
      roughness: 0.82,
      metalness: 0.12,
    }),
    woodSlat: new THREE.MeshStandardMaterial({
      color: 0x423321,
      roughness: 0.55,
      metalness: 0.25,
    }),
    // Step lighting tread strips: warm amber gold glow
    stepLight: new THREE.MeshStandardMaterial({
      color: 0xffe29d,
      emissive: 0xd4a853,
      emissiveIntensity: 0.95,
      roughness: 0.3,
    }),
    // Sconce light fixture
    sconceTrim: new THREE.MeshStandardMaterial({
      color: 0xd1b076,
      roughness: 0.25,
      metalness: 0.8,
    }),
    sconceGlow: new THREE.MeshBasicMaterial({
      color: 0xffe8ba,
    }),
    // Seat base and metal legs
    seatFrame: new THREE.MeshStandardMaterial({
      color: 0x25262c,
      roughness: 0.5,
      metalness: 0.65,
    }),
    // Seat cushion materials
    standardSeat: new THREE.MeshStandardMaterial({
      color: 0x3e414c, // clearly readable charcoal-slate with specular definition
      roughness: 0.62,
      metalness: 0.1,
    }),
    premiumSeat: new THREE.MeshStandardMaterial({
      color: 0x764b22, // rich warm cognac/amber leather
      roughness: 0.48,
      metalness: 0.18,
    }),
    selectedSeat: new THREE.MeshStandardMaterial({
      color: 0xf0ce84, // radiant champagne gold
      emissive: 0xb88836,
      emissiveIntensity: 0.68,
      roughness: 0.32,
      metalness: 0.28,
    }),
    recommendedSeat: new THREE.MeshStandardMaterial({
      color: 0xb07e2c, // vivid warm amber
      emissive: 0xbf8122,
      emissiveIntensity: 0.52,
      roughness: 0.42,
      metalness: 0.2,
    }),
    unavailableSeat: new THREE.MeshStandardMaterial({
      color: 0x1d1e23,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
    }),
    wheelchairSeat: new THREE.MeshStandardMaterial({
      color: 0x1a4659, // distinct petrol teal
      roughness: 0.52,
      metalness: 0.22,
    }),
    armrestGold: new THREE.MeshStandardMaterial({
      color: 0xc4a159,
      roughness: 0.3,
      metalness: 0.7,
    }),
  };
}

export type AuditoriumMaterials = ReturnType<typeof createAuditoriumMaterials>;

/**
 * Creates a detailed 3D cinema screen (gently curved horizontally for natural optics).
 */
export function buildScreenMesh(bounds: Auditorium3DBounds, materials: AuditoriumMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = "cinema-screen";

  const width = bounds.screenWidthM;
  const height = bounds.screenHeightM;
  const segments = 32;
  const curveDepth = 0.45; // gentle horizontal curvature

  // Screen surface geometry
  const screenGeom = new THREE.PlaneGeometry(width, height, segments, 1);
  const pos = screenGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const zOffset = (1 - (x / (width / 2)) ** 2) * -curveDepth;
    pos.setZ(i, zOffset);
  }
  screenGeom.computeVertexNormals();

  const screenMesh = new THREE.Mesh(screenGeom, materials.screen);
  screenMesh.position.set(0, bounds.screenCenter.y, 0);
  group.add(screenMesh);

  // Outer screen bezel
  const borderThickness = 0.28;
  const frameGeom = new THREE.BoxGeometry(width + borderThickness * 2, height + borderThickness * 2, 0.22);
  const frameMesh = new THREE.Mesh(frameGeom, materials.screenFrame);
  frameMesh.position.set(0, bounds.screenCenter.y, 0.12);
  group.add(frameMesh);

  // Gold trim accent rim around screen edge
  const trimGeom = new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.04);
  const trimMesh = new THREE.Mesh(trimGeom, materials.screenBezelTrim);
  trimMesh.position.set(0, bounds.screenCenter.y, 0.02);
  group.add(trimMesh);

  // Stage dais below screen
  const stageWidth = width + 4.5;
  const stageDepth = 3.2;
  const stageHeight = 0.55;
  const stageGeom = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
  const stageMesh = new THREE.Mesh(stageGeom, materials.carpet);
  stageMesh.position.set(0, stageHeight / 2, stageDepth / 2 - 1);
  group.add(stageMesh);

  // Soft glow light emanating from the screen into the auditorium
  const screenLight = new THREE.PointLight(0xfff2dc, 1.8, bounds.length * 1.35, 1.1);
  screenLight.position.set(0, bounds.screenCenter.y, 2.2);
  group.add(screenLight);

  return group;
}

/**
 * Creates stepped floor risers for each row of seats with illuminated step edges.
 */
export function buildSteppedFloorMesh(
  auditorium: Auditorium,
  bounds: Auditorium3DBounds,
  materials: AuditoriumMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = "auditorium-floor";

  const rowOrder = auditorium.geometry.rowOrder;
  const floorWidth = bounds.width + 2.4;

  // Base floor slab
  const baseFloorGeom = new THREE.BoxGeometry(floorWidth, 0.12, bounds.length + 4);
  const baseFloor = new THREE.Mesh(baseFloorGeom, materials.carpet);
  baseFloor.position.set(0, -0.06, bounds.center.z);
  group.add(baseFloor);

  // Stepped platforms for each row
  rowOrder.forEach((rowLabel, i) => {
    const elevation = calculateRowElevation(i);
    const rowSeats = auditorium.seats.filter((s) => s.row === rowLabel);
    if (rowSeats.length === 0) return;

    const avgZ = rowSeats.reduce((acc, s) => acc + (s.position?.y ?? 0), 0) / rowSeats.length;
    const riserDepth = 1.18;

    // Platform top slab
    const riserGeom = new THREE.BoxGeometry(floorWidth, elevation, riserDepth);
    const riserMesh = new THREE.Mesh(riserGeom, materials.carpet);
    riserMesh.position.set(0, elevation / 2, avgZ);
    group.add(riserMesh);

    // Front kickplate face (darker contrast for clear tier definition)
    const kickplateGeom = new THREE.BoxGeometry(floorWidth, elevation, 0.02);
    const kickplateMesh = new THREE.Mesh(kickplateGeom, materials.riserFace);
    kickplateMesh.position.set(0, elevation / 2, avgZ - riserDepth / 2);
    group.add(kickplateMesh);

    // Warm gold LED step-edge light along the front nose of each riser
    const lightBarGeom = new THREE.BoxGeometry(floorWidth, 0.035, 0.05);
    const lightBar = new THREE.Mesh(lightBarGeom, materials.stepLight);
    lightBar.position.set(0, elevation + 0.015, avgZ - riserDepth / 2);
    group.add(lightBar);
  });

  return group;
}

/**
 * Creates architectural side walls, decorative wood acoustic slats, and wall sconces.
 */
export function buildEnclosureMesh(
  bounds: Auditorium3DBounds,
  materials: AuditoriumMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = "auditorium-enclosure";

  const wallHeight = bounds.height + 2.5;
  const wallLength = bounds.length + 4.5;
  const wallThickness = 0.45;
  const halfWidth = bounds.width / 2 + 1.2;

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
  const backWallGeom = new THREE.BoxGeometry(bounds.width + 2.4, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backWallGeom, materials.wall);
  backWall.position.set(0, wallHeight / 2, bounds.maxZ + 2.2);
  group.add(backWall);

  // Vertical decorative wood acoustic slats along both side walls
  const numSlats = 16;
  const slatSpacing = wallLength / (numSlats + 1);
  const slatGeom = new THREE.BoxGeometry(0.09, wallHeight * 0.72, 0.16);

  for (let i = 1; i <= numSlats; i++) {
    const z = bounds.minZ + i * slatSpacing;

    const leftSlat = new THREE.Mesh(slatGeom, materials.woodSlat);
    leftSlat.position.set(-halfWidth + wallThickness / 2 + 0.045, wallHeight / 2, z);
    group.add(leftSlat);

    const rightSlat = new THREE.Mesh(slatGeom, materials.woodSlat);
    rightSlat.position.set(halfWidth - wallThickness / 2 - 0.045, wallHeight / 2, z);
    group.add(rightSlat);

    // Add wall sconce every 4 slats for warm architectural illumination
    if (i % 4 === 2) {
      const sconceY = wallHeight * 0.58;

      // Left sconce
      const leftSconce = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 8),
        materials.sconceTrim
      );
      leftSconce.position.set(-halfWidth + wallThickness / 2 + 0.1, sconceY, z);
      group.add(leftSconce);

      const leftPointLight = new THREE.PointLight(0xd1b076, 0.75, 6, 1.5);
      leftPointLight.position.set(-halfWidth + wallThickness / 2 + 0.2, sconceY, z);
      group.add(leftPointLight);

      // Right sconce
      const rightSconce = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 8),
        materials.sconceTrim
      );
      rightSconce.position.set(halfWidth - wallThickness / 2 - 0.1, sconceY, z);
      group.add(rightSconce);

      const rightPointLight = new THREE.PointLight(0xd1b076, 0.75, 6, 1.5);
      rightPointLight.position.set(halfWidth - wallThickness / 2 - 0.2, sconceY, z);
      group.add(rightPointLight);
    }
  }

  return group;
}

/**
 * Generates an individual, recognizable 3D cinema seat model with cushions,
 * reclined seat back, headrest, armrests, cup holder, and clicking hitbox.
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

  // Select cushion material according to state
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

  const width = isPremium ? 0.78 : 0.54;
  const depth = isPremium ? 0.6 : 0.48;

  // 1. Pedestal / Legs
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
  const leg = new THREE.Mesh(legGeom, materials.seatFrame);
  leg.position.set(0, 0.14, 0);
  seatGroup.add(leg);

  // 2. Seat Cushion (comfortable plump box)
  const cushionGeom = new THREE.BoxGeometry(width, 0.13, depth);
  const cushion = new THREE.Mesh(cushionGeom, cushionMat);
  cushion.position.set(0, 0.28, 0);
  seatGroup.add(cushion);

  // 3. Ergonomic Reclined Seat Back
  const backHeight = isPremium ? 0.66 : 0.55;
  const backGeom = new THREE.BoxGeometry(width, backHeight, 0.11);
  const seatBack = new THREE.Mesh(backGeom, cushionMat);
  seatBack.position.set(0, 0.34 + backHeight / 2, depth / 2 - 0.02);
  seatBack.rotation.x = 0.12; // ~7 degrees comfortable recline
  seatGroup.add(seatBack);

  // 4. Headrest / Upper Cushion
  const headrestGeom = new THREE.BoxGeometry(width * 0.86, 0.16, 0.13);
  const headrest = new THREE.Mesh(headrestGeom, cushionMat);
  headrest.position.set(0, 0.32 + backHeight, depth / 2 + 0.04);
  headrest.rotation.x = 0.14;
  seatGroup.add(headrest);

  // 5. Armrests (Left & Right)
  const armWidth = 0.08;
  const armLength = depth * 0.88;
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

  // Generous invisible bounding hitbox for effortless, comfortable clicking
  const hitboxGeom = new THREE.BoxGeometry(width + 0.12, backHeight + 0.55, depth + 0.18);
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
    ctx.fillStyle = "rgba(18, 18, 22, 0.92)";
    ctx.roundRect?.(4, 4, 120, 56, 14);
    ctx.fill();
    ctx.strokeStyle = "#d1b076";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#faf6ed";
    ctx.font = "bold 28px monospace";
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
