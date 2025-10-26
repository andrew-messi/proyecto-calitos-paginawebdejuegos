// js/app.js
// Escena Three.js modular y robusta para landing
// Autor: Adaptado para despliegue por Carlitos (2025)

const DEFAULTS = {
  threeVersion: '0.156.0',
  particleCount: 600,
  lowResBg: 'assets/images/hero_bg-low.jpg',
  highResBg: 'assets/images/hero_bg.jpg',
  modelPath: 'assets/models/model_scene.glb',
  audioPath: 'assets/audio/theme_loop.mp3'
};

let THREE, OrbitControls, GLTFLoader;
let renderer, scene, camera, controls;
let pointsField, modelRoot;
let animationId;
let isMobile = /Mobi|Android/i.test(navigator.userAgent);
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let currentQuality = 'high';
let audioEl = null;

// Esperar DOM
document.addEventListener('DOMContentLoaded', () => {
  // iniciar carga de módulos y escena
  initThree().then(init).catch(err => {
    console.error('Error inicializando Three.js:', err);
    showFallbackMessage();
  });
  wireQualityEvents();
  handleUnload();
});

async function initThree(){
  // Intenta importar como módulo desde CDN (ESM)
  try {
    const ver = DEFAULTS.threeVersion;
    const base = `https://unpkg.com/three@${ver}/build/three.module.js`;
    const module = await import(base);
    THREE = module;
    // Cargas de ejemplos (OrbitControls, GLTFLoader) también via import
    OrbitControls = (await import(`https://unpkg.com/three@${ver}/examples/jsm/controls/OrbitControls.js`)).OrbitControls;
    GLTFLoader = (await import(`https://unpkg.com/three@${ver}/examples/jsm/loaders/GLTFLoader.js`)).GLTFLoader;
    return;
  } catch (e) {
    console.warn('Error importando Three.js desde CDN:', e);
    // Fallback: intenta usar un script local three.module.js (documentado en README)
    if (window.THREE) {
      THREE = window.THREE;
      OrbitControls = window.OrbitControls;
      GLTFLoader = window.GLTFLoader;
      return;
    }
    throw e;
  }
}

function showFallbackMessage(){
  const wrap = document.getElementById('canvas-wrap');
  if(wrap){
    wrap.innerHTML = '<div style="color:#fff;padding:20px;">No se pudo cargar la librería 3D. Revisa la conexión o incluye <code>three.module.js</code> localmente. Consulta README.</div>';
  }
}

function init(){
  const canvas = document.getElementById('three-canvas');
  if(!canvas) throw new Error('Canvas no encontrado');

  // Renderer
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.02);

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 2, 6);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2;
  controls.maxDistance = 20;
  controls.screenSpacePanning = true;

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffee, 0x222233, 0.45);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xfff0ff, isMobile ? 0.8 : 1.2);
  dir.position.set(5, 10, 7);
  dir.castShadow = !isMobile;
  if (!isMobile) {
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
  }
  scene.add(dir);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200, 8, 8);
  const groundMat = new THREE.MeshStandardMaterial({color: 0x071723, metalness: 0.1, roughness: 0.7});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -1.4;
  ground.receiveShadow = true;
  scene.add(ground);

  // Particle field (points)
  createParticles();

  // Load low-res background image (CSS) -> swap to high-res later
  swapBackgroundImage(DEFAULTS.lowResBg);
  lazyLoadImage(DEFAULTS.highResBg).then(() => {
    swapBackgroundImage(DEFAULTS.highResBg);
  });

  // Load model (lazy)
  loadModelIfExists(DEFAULTS.modelPath);

  // Audio element for UI interactions (UI.js controla reproducción)
  setupAudioElement(DEFAULTS.audioPath);

  // Events
  window.addEventListener('resize', onWindowResize, {passive:true});
  window.addEventListener('setQuality', (e)=> setQuality(e.detail));

  // initial quality based on mobile
  setQuality(isMobile ? 'low' : 'high');

  // Start loop
  animate();
}

function createParticles(){
  const count = DEFAULTS.particleCount;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i*3 + 0] = (Math.random() - 0.5) * 60;
    positions[i*3 + 1] = Math.random() * 20 - 2;
    positions[i*3 + 2] = (Math.random() - 0.5) * 60;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({size: 0.12, opacity: 0.9, transparent: true});
  pointsField = new THREE.Points(geometry, material);
  scene.add(pointsField);
}

function lazyLoadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

function swapBackgroundImage(src){
  try {
    const canvas = document.getElementById('three-canvas');
    if(canvas) {
      canvas.style.backgroundImage = `url('${src}')`;
    }
  } catch(e){ console.warn('swapBackgroundImage err', e); }
}

function loadModelIfExists(path){
  // Comprueba tamaño aproximado de archivo con fetch head (opcional) - Omitido para simplicidad
  const loader = new GLTFLoader();
  loader.load(
    path,
    gltf => {
      // Añadir y ajustar
      modelRoot = gltf.scene;
      modelRoot.traverse(child => {
        if(child.isMesh){
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = true;
        }
      });
      modelRoot.scale.set(0.9, 0.9, 0.9);
      modelRoot.position.set(0, -1.3, 0);
      scene.add(modelRoot);
    },
    xhr => {
      // progreso opcional
      // console.log('Model progress', xhr.loaded, xhr.total);
    },
    err => {
      console.warn('No model loaded (no existe o error)', err);
    }
  );
}

function setupAudioElement(path){
  audioEl = new Audio();
  audioEl.src = path;
  audioEl.loop = true;
  audioEl.preload = 'auto';
  audioEl.volume = 0.18;
  // Nota: reproducción bloqueada hasta interacción del usuario
}

function setQuality(q){
  currentQuality = q;
  if(!renderer) return;
  if(q === 'low'){
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    if(pointsField) pointsField.material.size = 0.08;
  } else if(q === 'medium'){
    renderer.setPixelRatio(Math.min(pixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    if(pointsField) pointsField.material.size = 0.10;
  } else {
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = !isMobile;
    if(pointsField) pointsField.material.size = 0.12;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onWindowResize(){
  if(!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(now){
  animationId = requestAnimationFrame(animate);
  // rotate particles
  if(pointsField) pointsField.rotation.y += (currentQuality === 'low' ? 0.0006 : 0.0009);
  if(controls) controls.update();
  if(renderer && scene && camera) renderer.render(scene, camera);
}

// Utility: simple camera tween (duration ms)
function tweenCameraTo(target, duration = 700){
  const from = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
  const start = performance.now();
  function loop(t){
    const p = Math.min((t - start) / duration, 1);
    camera.position.x = from.x + (target.x - from.x) * p;
    camera.position.y = from.y + (target.y - from.y) * p;
    camera.position.z = from.z + (target.z - from.z) * p;
    camera.lookAt(0, 0, 0);
    if(p < 1) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// Expose actions to window so UI can call them:
window.gtaAnime = {
  playCameraFocus: () => tweenCameraTo({x:0, y:1.8, z:4}, 900),
  toggleAudio: (enable) => {
    if(!audioEl) return;
    if(enable) audioEl.play().catch(()=>{/* blocked */});
    else audioEl.pause();
  }
};

// Cleanup on unload (dispose geometries/materials/textures)
function cleanupScene(){
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  // Dispose particle geometry/material
  if(pointsField){
    if(pointsField.geometry) pointsField.geometry.dispose();
    if(pointsField.material) pointsField.material.dispose();
    scene.remove(pointsField);
    pointsField = null;
  }
  // Dispose model
  if(modelRoot){
    modelRoot.traverse(child => {
      if(child.isMesh){
        if(child.geometry) child.geometry.dispose();
        if(child.material){
          if(Array.isArray(child.material)){
            child.material.forEach(m => { if(m.map) m.map.dispose(); m.dispose && m.dispose(); });
          } else {
            if(child.material.map) child.material.map.dispose();
            child.material.dispose && child.material.dispose();
          }
        }
      }
    });
    scene.remove(modelRoot);
    modelRoot = null;
  }
  // Renderer dispose
  if(renderer){
    renderer.dispose();
    renderer.forceContextLoss && renderer.forceContextLoss();
    renderer.domElement && renderer.domElement.remove();
    renderer = null;
  }
  // Audio
  if(audioEl){
    audioEl.pause();
    audioEl.src = '';
    audioEl = null;
  }
}

function handleUnload(){
  window.addEventListener('beforeunload', cleanupScene);
  window.addEventListener('unload', cleanupScene);
}

// Eventos de calidad desde UI
function wireQualityEvents(){
  // si el archivo ui.js envía setQuality
  window.addEventListener('setQuality', (e)=> setQuality(e.detail));
}
