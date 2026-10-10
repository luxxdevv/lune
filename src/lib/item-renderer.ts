import * as THREE from 'three';
import { createItemModel, disposeItemModel, type ItemModelName, type ItemModelOptions } from './item-models';

type View = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; scene: THREE.Scene; model?: THREE.Group; phase: number; motion: ItemModelOptions['motion']; facing: ItemModelOptions['facing']; glint: boolean; visible: boolean; dirty: boolean; hovered: boolean; ready: () => void };
let shared: ReturnType<typeof createRenderer> | undefined;

function createRenderer() {
  // One GPU context serves every icon, including the basket and comparison table.
  // Each rendered view is copied immediately into its own small 2D canvas.
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0, 0);
  const camera = new THREE.OrthographicCamera(-1.18, 1.18, 1.18, -1.18, .1, 20);
  camera.position.z = 5;
  const views = new Map<HTMLCanvasElement, View>();
  const models = new Map<string, Promise<THREE.Group>>();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = 0, clock = 0, stopped = false, lost = false;
  const motionPaused = () => media.matches || !!document.querySelector('.storefront.motion-paused');

  function request() { if (!frame && !stopped && !lost && !document.hidden) frame = requestAnimationFrame(draw); }
  function invalidate() { views.forEach(view => { view.dirty = true; }); request(); }
  function draw(now: number) {
    frame = 0;
    if (stopped || lost || document.hidden) { last = 0; return; }
    if (last && now - last < 1000 / 30) { request(); return; }
    const paused = motionPaused();
    if (!paused) clock += Math.min(last ? now - last : 0, 80) / 1000;
    last = now;
    let animated = false;
    for (const view of views.values()) {
      if (!view.visible || !view.model) continue;
      if (!view.dirty && (paused || (view.motion === 'still' && !view.glint))) continue;
      const size = Math.min(320, Math.max(1, Math.round(view.canvas.clientWidth * Math.min(devicePixelRatio, 2))));
      if (!view.canvas.clientWidth) continue;
      if (view.canvas.width !== size) { view.canvas.width = size; view.canvas.height = size; }
      // Stationary items hold a readable three-quarter view, including on hover.
      const angle = view.motion === 'still' ? -.3 : view.motion === 'sway' ? -.3 + Math.sin(clock * .65 + view.phase) * .2 : -((clock * .45 + view.phase * .5) % (Math.PI * 2));
      const direction = view.facing === 'right' ? -1 : 1;
      // Items get the usual tilt; the player model only leans back a touch and never rolls.
      if (view.model.userData.player) view.model.rotation.set(-.05, angle, 0);
      else if (view.model.userData.block) view.model.rotation.set(.35, view.motion === 'still' ? -.62 : angle - .32, 0);
      // Decorative heads use the same restrained turn as the other menu icons.
      else if (view.model.userData.head) view.model.rotation.set(.2, view.motion === 'still' ? -.62 : angle - .32, 0);
      else view.model.rotation.set(.16, angle, -.1);
      view.model.rotation.y *= direction;
      view.model.traverse(object => {
        if (object.userData.limb) {
          // Walk cycle: opposite arm and leg swing together, arms a little less than legs.
          const step = view.motion === 'still' ? 0 : Math.sin(clock * 3 + view.phase) * (view.motion === 'sway' ? .35 : 1);
          const arm = String(object.userData.limb).endsWith('Arm');
          const sign = object.userData.limb === 'leftArm' || object.userData.limb === 'rightLeg' ? -1 : 1;
          object.rotation.x = step * (arm ? .5 : .7) * sign;
          return;
        }
        if (!object.userData.glint || !(object instanceof THREE.Mesh)) return;
        const map = (object.material as THREE.MeshBasicMaterial).map;
        if (map) map.offset.set((clock * .11) % 1, (-clock * .17) % 1);
      });
      view.model.position.y = paused || view.motion === 'still' || view.model.userData.head ? 0 : Math.sin(clock * 1.4 + view.phase) * .025;
      view.scene.scale.setScalar(1);
      renderer.setSize(size, size, false);
      renderer.render(view.scene, camera);
      view.context.clearRect(0, 0, size, size);
      view.context.drawImage(renderer.domElement, 0, 0);
      view.canvas.dataset.rotation = view.model.rotation.y.toFixed(4);
      view.canvas.dataset.motion = paused ? 'paused' : view.motion === 'still' ? 'still' : 'playing';
      if (view.dirty) view.ready();
      view.dirty = false;
      if (!paused && (view.motion !== 'still' || view.glint)) animated = true;
    }
    if (animated) request(); else last = 0;
  }
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const view = views.get(entry.target as HTMLCanvasElement);
      if (view) { view.visible = entry.isIntersecting; view.dirty = true; }
    }
    request();
  });
  const resize = new ResizeObserver(invalidate);
  const mutation = new MutationObserver(invalidate);
  const storefront = document.querySelector('.storefront');
  if (storefront) mutation.observe(storefront, { attributes: true, attributeFilter: ['class'] });
  media.addEventListener('change', invalidate);
  document.addEventListener('visibilitychange', invalidate);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    views.forEach(view => { view.canvas.closest('.item-model')?.classList.remove('model-ready'); });
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; invalidate(); });

  return {
    add(canvas: HTMLCanvasElement, name: ItemModelName, phase: number, ready: () => void, options: ItemModelOptions = {}) {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight('#ffffff', '#a4a0b0', 2.5));
      const key = new THREE.DirectionalLight('#fff7e6', 3.2); key.position.set(-3, 5, 6); scene.add(key);
      const rim = new THREE.DirectionalLight('#cedcff', 1.2); rim.position.set(4, 1, -4); scene.add(rim);
      const view: View = { canvas, context, scene, phase, motion: options.motion || 'still', facing: options.facing || 'left', glint: !!options.glint, visible: false, dirty: true, hovered: false, ready };
      views.set(canvas, view); intersection.observe(canvas); resize.observe(canvas);
      const modelKey = `${name}:${options.skinUrl || ''}:${options.tint || ''}:${options.glint || ''}`;
      if (!models.has(modelKey)) models.set(modelKey, createItemModel(name, options));
      models.get(modelKey)!.then(template => {
        if (!views.has(canvas) || stopped) return;
        view.model = template.clone(true);
        scene.add(view.model);
        const bounds = new THREE.Box3().setFromObject(view.model).getSize(new THREE.Vector3());
        canvas.dataset.depth = bounds.z.toFixed(3);
        view.dirty = true; request();
      }).catch(() => { /* The static 3D render stays visible when a model cannot load. */ });
      const target = canvas.closest('button, a') || canvas;
      const enter = () => { view.hovered = true; view.dirty = true; request(); };
      const leave = () => { view.hovered = false; view.dirty = true; request(); };
      target.addEventListener('pointerenter', enter); target.addEventListener('pointerleave', leave);
      return () => {
        intersection.unobserve(canvas); resize.unobserve(canvas); views.delete(canvas);
        target.removeEventListener('pointerenter', enter); target.removeEventListener('pointerleave', leave);
        if (views.size) return;
        stopped = true; cancelAnimationFrame(frame);
        intersection.disconnect(); resize.disconnect(); mutation.disconnect();
        media.removeEventListener('change', invalidate); document.removeEventListener('visibilitychange', invalidate);
        models.forEach(model => { void model.then(disposeItemModel).catch(() => {}); });
        renderer.dispose(); renderer.forceContextLoss(); shared = undefined;
      };
    },
  };
}

export function registerItem(canvas: HTMLCanvasElement, name: ItemModelName, phase: number, ready: () => void, options: ItemModelOptions = {}) {
  shared ??= createRenderer();
  return shared.add(canvas, name, phase, ready, options);
}
