import * as THREE from 'THREE';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './style.css';

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(30);
camera.position.x = -3;

renderer.render(scene, camera);

// Object
const geometry = new THREE.TorusGeometry(8,3,16,100);
const material = new THREE.MeshStandardMaterial({
  color: 0xFF6347,
  wireframe: true
});
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// Light
const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(5,0,0);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(pointLight, ambientLight);

// Helper
// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);


// Moon
const moonTexture = new THREE.TextureLoader().load('assets/moon.jpg');
const normalTexture = new THREE.TextureLoader().load('assets/normal.jpg');
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture
  })
)
scene.add(moon);

moon.position.z = 30;
moon.position.x = -10;

// Stormtrooper + dat.GUI
// const gui = new dat.GUI();

// Array of animations mixers
const mixers = [];

const gltfLoader = new GLTFLoader();
let stormtrooper = null;
gltfLoader.load('assets/dancing_stormtrooper/scene.gltf', (trooper) => {
  trooper.scene.position.set(7, -1, -9);

  // gui.add(trooper.scene.position, 'x', -20, 20, 1);
  // gui.add(trooper.scene.position, 'y', -20, 20, 1);
  // gui.add(trooper.scene.position, 'z', -20, 20, 1);

  const mixer = new THREE.AnimationMixer(trooper.scene);
  mixers.push(mixer);
  const start = mixer.clipAction(trooper.animations[0]);
  start.play();

  stormtrooper = trooper.scene;
  scene.add(trooper.scene);
});



// Scroll animation
function moveCamera(){
  let t = document.body.getBoundingClientRect().top;
  if(t>0){
    t = -t;
  }
  camera.position.z = t * -0.01;
  camera.position.y = t * -0.0002;
  camera.position.x = t * -0.0002;

  if(stormtrooper){
    stormtrooper.position.y = t * -0.02;
  }
  
}

document.body.onscroll = moveCamera;
moveCamera();

//Animation
let previousRAF = null;
function animate(t){
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.x += 0.01;

  moon.rotation.y += 0.005;

  controls.update();

  renderer.render(scene, camera);
  if(previousRAF === null){
    previousRAF = t;
  }

  const timeElapsed = (t-previousRAF) * 0.001;
  if(mixers){
    mixers.map(m => {m.update(timeElapsed)})
  }
  previousRAF = t;
}

// Add Stars
function addStars(stars_count){
  Array(stars_count).fill().forEach(addStar);
}

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25);
  const material = new THREE.MeshStandardMaterial({color: 0xffffff});
  const star = new THREE.Mesh(geometry, material);

  const [x,y,z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  
  star.position.set(x,y,z);
  scene.add(star);
}
addStars(200);

// Background 
const spaceTexture = new THREE.TextureLoader().load('assets/space.jpg');
scene.background = spaceTexture;

// Window resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', () => {
  onWindowResize();
}, false);

animate();