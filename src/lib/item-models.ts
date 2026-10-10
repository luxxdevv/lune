import * as THREE from 'three';

export type ItemModelName = 'grass_block' | 'enchanted_book' | 'emerald' | 'diamond_sword' | 'nether_star' | 'diamond' | 'tripwire_hook' | 'spawner'
  | 'iron_ingot' | 'gold_ingot' | 'iron_nugget' | 'prismarine_crystals' | 'blaze_rod' | 'magma_cream' | 'money' | 'coin' | 'hero_skin' | 'classic_skin' | 'demo_skin'
  | 'support_head' | 'discord_head' | 'telegram_head' | 'owner_head' | 'team_head' | 'showcase_skin' | 'player_skin';
// tint recolours the texture (legacy), glint adds the game's enchantment shimmer in that colour.
export interface ItemModelOptions { tint?: string; glint?: string; motion?: 'spin' | 'sway' | 'still'; facing?: 'left' | 'right'; skinUrl?: string }

// Player models: the full character built from a 64x64 skin (all six boxes plus the overlay layers).
const SKINS: Partial<Record<ItemModelName,string>> = { demo_skin:'/assets/skins/demo.svg',showcase_skin:'/assets/skins/showcase.svg',classic_skin:'/assets/skins/classic.svg',hero_skin:'/assets/skins/hero.svg' };
const HEADS: Partial<Record<ItemModelName,string>> = { support_head:'/assets/skins/support_head.svg',discord_head:'/assets/skins/discord_head.svg',telegram_head:'/assets/skins/telegram_head.svg',owner_head:'/assets/skins/owner_head.svg',team_head:'/assets/skins/team_head.svg' };
let glintTexture: Promise<THREE.Texture> | undefined;

async function loadImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
function readPixels(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Texture sampling unavailable');
  context.drawImage(image, 0, 0);
  return { width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data };
}
function loadGlint() {
  glintTexture ??= new THREE.TextureLoader().loadAsync('/assets/fx/glint.svg').then(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(1.5, 1.5);
    return texture;
  });
  return glintTexture;
}

async function extrudedItem(name: ItemModelName, options: ItemModelOptions) {
  const { width, height, pixels } = readPixels(await loadImage(`/assets/items/${name}.svg`));
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && pixels[(y * width + x) * 4 + 3] > 127;
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [];
  const depth = Math.max(1, Math.round(width / 16));
  const keyColor = options.tint && /^#[0-9a-f]{6}$/i.test(options.tint) ? new THREE.Color(options.tint) : null;
  function face(points: number[][], color: THREE.Color) {
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const [x, y] = points[index];
      positions.push(...points[index]); colors.push(color.r, color.g, color.b);
      uvs.push((x + width / 2) / width, (y + height / 2) / height);
    }
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!solid(x, y)) continue;
    const index = (y * width + x) * 4;
    const color = new THREE.Color().setRGB(pixels[index] / 255, pixels[index + 1] / 255, pixels[index + 2] / 255, THREE.SRGBColorSpace);
    if (keyColor) {
      const shade = .25 + ((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 765) * .75;
      color.copy(keyColor).multiplyScalar(shade);
    }
    const x0 = x - width / 2, x1 = x0 + 1, y1 = height / 2 - y, y0 = y1 - 1, z = depth / 2;
    // Closed geometry, including back and exposed side walls. No billboard planes.
    face([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]], color);
    face([[x1,y0,-z],[x0,y0,-z],[x0,y1,-z],[x1,y1,-z]], color);
    if (!solid(x - 1, y)) face([[x0,y0,-z],[x0,y0,z],[x0,y1,z],[x0,y1,-z]], color);
    if (!solid(x + 1, y)) face([[x1,y0,z],[x1,y0,-z],[x1,y1,-z],[x1,y1,z]], color);
    if (!solid(x, y - 1)) face([[x0,y1,z],[x1,y1,z],[x1,y1,-z],[x0,y1,-z]], color);
    if (!solid(x, y + 1)) face([[x0,y0,-z],[x1,y0,-z],[x1,y0,z],[x0,y0,z]], color);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals(); geometry.center();
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .65, metalness: .08 })));
  if (options.glint && /^#[0-9a-f]{6}$/i.test(options.glint)) {
    // Same shape drawn again with the scrolling glint texture, additive, like the in-game enchantment overlay.
    const map = (await loadGlint()).clone();
    map.needsUpdate = true;
    const shimmer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map, color: new THREE.Color(options.glint), transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
    shimmer.scale.setScalar(1.015);
    shimmer.userData.glint = true;
    group.add(shimmer);
  }
  return group;
}

type Part = { u: number; v: number; w: number; h: number; d: number };
// Six textures for one skin box, Minecraft layout: right | front | left | back on one row, top and bottom above.
// Three.js BoxGeometry order: +x (viewer's right = the model's left side), -x, +y, -y, +z (front), -z (back).
function boxMaterials(image: HTMLImageElement, part: Part, overlay: boolean) {
  const scale = image.naturalWidth / 64;
  function face(sx: number, sy: number, w: number, h: number, flip = false) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Skin sampling unavailable');
    context.imageSmoothingEnabled = false;
    if (flip) { context.translate(0, h); context.scale(1, -1); }
    context.drawImage(image, sx * scale, sy * scale, w * scale, h * scale, 0, 0, w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: texture, roughness: .8, metalness: 0, ...(overlay ? { transparent: true, alphaTest: .5, side: THREE.DoubleSide } : {}) });
  }
  const { u, v, w, h, d } = part;
  return [face(u + d + w, v + d, d, h), face(u, v + d, d, h), face(u + d, v, w, d), face(u + d + w, v, w, d, true), face(u + d, v + d, w, h), face(u + 2 * d + w, v + d, w, h)];
}
async function playerModel(src: string) {
  const image = await loadImage(src);
  const { width, height, pixels } = readPixels(image);
  const scale = width / 64;
  const legacy = height === 32 * scale;
  // Slim (Alex) skins leave the last column of the right-arm strip transparent.
  const slim = !legacy && pixels[((22 * scale) * width + 55 * scale) * 4 + 3] === 0;
  const arm = slim ? 3 : 4;
  const group = new THREE.Group();
  // [name, box size, joint position, texture origin (base), texture origin (overlay)]
  const parts: [string, [number, number, number], [number, number, number], [number, number], [number, number] | null][] = [
    ['head', [8, 8, 8], [0, 24, 0], [0, 0], [32, 0]],
    ['body', [8, 12, 4], [0, 18, 0], [16, 16], legacy ? null : [16, 32]],
    ['rightArm', [arm, 12, 4], [-(4 + arm / 2), 24, 0], [40, 16], legacy ? null : [40, 32]],
    ['leftArm', [arm, 12, 4], [4 + arm / 2, 24, 0], legacy ? [40, 16] : [32, 48], legacy ? null : [48, 48]],
    ['rightLeg', [4, 12, 4], [-2, 12, 0], [0, 16], legacy ? null : [0, 32]],
    ['leftLeg', [4, 12, 4], [2, 12, 0], legacy ? [0, 16] : [16, 48], legacy ? null : [0, 48]],
  ];
  for (const [name, [w, h, d], [x, y, z], base, overlay] of parts) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    // Limbs hang from their joint so the walk cycle swings them from the shoulder / hip.
    const offset = name === 'head' ? h / 2 : name === 'body' ? 0 : -h / 2;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMaterials(image, { u: base[0], v: base[1], w, h, d }, false));
    inner.position.y = offset; pivot.add(inner);
    if (overlay) {
      const outer = new THREE.Mesh(new THREE.BoxGeometry(w + 1, h + 1, d + 1), boxMaterials(image, { u: overlay[0], v: overlay[1], w, h, d }, true));
      outer.position.y = offset; pivot.add(outer);
    }
    if (name !== 'head' && name !== 'body') pivot.userData.limb = name;
    group.add(pivot);
  }
  group.position.y = -16;
  const wrapper = new THREE.Group();
  wrapper.userData.player = true;
  wrapper.add(group);
  return wrapper;
}

async function headModel(src: string) {
  const image = await loadImage(src);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), boxMaterials(image, { u: 0, v: 0, w: 8, h: 8, d: 8 }, false)));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(9, 9, 9), boxMaterials(image, { u: 32, v: 0, w: 8, h: 8, d: 8 }, true)));
  group.userData.head = true;
  return group;
}

async function grassBlockModel() {
  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(['grass_block_side', 'grass_block_top', 'dirt', 'grass_block_side_overlay'].map(name => loader.loadAsync(`/assets/blocks/${name}.svg`)));
  for (const texture of textures) {
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  const [side, top, dirt, overlay] = textures;
  const sideMaterial = new THREE.MeshStandardMaterial({ map: side, roughness: 1 });
  const topMaterial = new THREE.MeshStandardMaterial({ map: top, color: '#91bd59', roughness: 1 });
  const bottomMaterial = new THREE.MeshStandardMaterial({ map: dirt, roughness: 1 });
  const grassMaterial = new THREE.MeshStandardMaterial({ map: overlay, color: '#91bd59', transparent: true, alphaTest: .5, roughness: 1 });
  const emptyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const group = new THREE.Group();
  group.userData.block = true;
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [sideMaterial, sideMaterial, topMaterial, bottomMaterial, sideMaterial, sideMaterial]));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1.002, 1.002, 1.002), [grassMaterial, grassMaterial, emptyMaterial, emptyMaterial, grassMaterial, grassMaterial]));
  return group;
}

export async function createItemModel(name: ItemModelName, options: ItemModelOptions = {}) {
  const skin = options.skinUrl || SKINS[name], head = HEADS[name];
  const group = name === 'grass_block' ? await grassBlockModel() : skin ? await playerModel(skin) : head ? await headModel(head) : await extrudedItem(name, options);
  const bounds = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  group.scale.setScalar((skin ? 2.25 : head || name === 'grass_block' ? 1.55 : 1.7) / Math.max(bounds.x, bounds.y, bounds.z));
  return group;
}

export function disposeItemModel(group: THREE.Group) {
  group.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) { material.map?.dispose(); material.dispose(); }
    }
  });
}
