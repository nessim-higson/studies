import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { LensDistortionShader } from './lensPass.js';

const app = document.getElementById('app');

// ---- renderer ----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
app.appendChild(renderer.domElement);

// ---- scene / camera ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.6, 8);

// HDR-ish reflections without loading a file (matches RoomEnvironment in the original)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---- lights ----
const key = new THREE.PointLight(0xffffff, 60, 0, 2);
key.position.set(4, 5, 6);
scene.add(key);
scene.add(new THREE.AmbientLight(0x404060, 0.6));

// ---- the ring of instanced shapes ----
const RING_RADIUS = 3;
const geo = new THREE.ConeGeometry(0.42, 0.95, 4); // 4-sided cone = pyramid
const mat = new THREE.MeshStandardMaterial({
  color: 0xdfe6ff, metalness: 0.85, roughness: 0.18,
  emissive: new THREE.Color(0x5577ff), emissiveIntensity: 2.2,
});

let inst = null;
const dummy = new THREE.Object3D();
function buildRing(count) {
  if (inst) { scene.remove(inst); inst.dispose?.(); }
  inst = new THREE.InstancedMesh(geo, mat, count);
  layout(count, 0);
  scene.add(inst);
}
function layout(count, t) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * RING_RADIUS, Math.sin(a * 2 + t) * 0.25, Math.sin(a) * RING_RADIUS);
    dummy.rotation.set(Math.PI, -a + Math.PI / 2, 0); // point outward, tips toward center axis
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
}

// glowing core ring (the "ring" in Ring Engine)
const torus = new THREE.Mesh(
  new THREE.TorusGeometry(RING_RADIUS, 0.035, 24, 200),
  new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x88aaff, emissiveIntensity: 3 })
);
torus.rotation.x = Math.PI / 2;
scene.add(torus);

// ---- post-processing ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.6, 0.2);
composer.addPass(bloom);
const lens = new ShaderPass(LensDistortionShader);
composer.addPass(lens);

// ---- controls (Ring Engine: static-by-default + opt-in motion) ----
const params = { motion: false, speed: 0.5, count: 28 };
const bind = (id, fn) => {
  const el = document.getElementById(id);
  const out = document.getElementById(id + '-v');
  const upd = () => { fn(parseFloat(el.value)); if (out) out.textContent = (+el.value).toFixed(2); };
  el.addEventListener('input', upd); upd();
};
bind('aberration', v => lens.uniforms.uAberration.value = v);
bind('distortion', v => lens.uniforms.uDistortion.value = v);
bind('bloom', v => bloom.strength = v);
bind('emissive', v => { mat.emissiveIntensity = v; });
bind('speed', v => params.speed = v);
bind('count', v => { params.count = v | 0; buildRing(params.count); });
document.getElementById('motion').addEventListener('change', e => params.motion = e.target.checked);

buildRing(params.count);

// ---- resize ----
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---- loop ----
const clock = new THREE.Clock();
let theta = 0;
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (params.motion) {
    theta += dt * params.speed;
    inst.rotation.y = theta;
    torus.rotation.z = theta * 0.5;
    layout(params.count, theta * 2);
  }
  composer.render();
});
