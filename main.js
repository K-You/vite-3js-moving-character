import * as THREE from 'THREE';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Sky } from 'three/examples/jsm/objects/Sky';
import './style.css';

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(10, 10, 30);

renderer.render(scene, camera);

// Object

const geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const material = new THREE.MeshLambertMaterial({
  color: 0x7c966c,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI/2;
plane.receiveShadow = true;

scene.add(plane);

scene.background = new THREE.Color(1,0,0).setHSL(0.6, 0, 1);
scene.fog = new THREE.Fog(scene.background, 1, 1000);

// Light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dlight = new THREE.DirectionalLight(0xFFFFFF,10);
dlight.position.set(0,150,-4000);
dlight.target.position.set(0,0,0);
dlight.castShadow = true;
dlight.shadow.bias = -0.000001;
dlight.shadow.mapSize.width=2048
dlight.shadow.mapSize.height=2048;
dlight.shadow.camera.near=100;
dlight.shadow.camera.far=10000;
dlight.shadow.camera.left=200;
dlight.shadow.camera.right=-200;
dlight.shadow.camera.top=200;
dlight.shadow.camera.bottom=-200;
scene.add(dlight);
// scene.add(new THREE.CameraHelper(dlight.shadow.camera))

// Helper
// const lightHelper = new THREE.DirectionalLightHelper(dlight);
// scene.add(lightHelper);
const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Sky
function initSky (){
  const sky = new Sky();
  sky.scale.setScalar(450000)
  scene.add(sky);

  const sun = new THREE.Vector3();
  const effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
  };
  const uniforms = sky.material.uniforms;
  uniforms[ 'turbidity' ].value = effectController.turbidity;
  uniforms[ 'rayleigh' ].value = effectController.rayleigh;
  uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
  uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

  const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
  const theta = THREE.MathUtils.degToRad( effectController.azimuth );

  sun.setFromSphericalCoords( 1, phi, theta );

  uniforms[ 'sunPosition' ].value.copy( sun );

  renderer.toneMappingExposure = effectController.exposure;
  renderer.render( scene, camera );
}
initSky();

// Trooper 
// Array of animations mixers
const mixers = [];

const gltfLoader = new GLTFLoader();
gltfLoader.load('assets/dancing_stormtrooper/scene.gltf', (trooper) => {
  trooper.scene.traverse(c => {
    c.castShadow = true;
  });

  const mixer = new THREE.AnimationMixer(trooper.scene);
  mixers.push(mixer);
  const start = mixer.clipAction(trooper.animations[0]);
  start.play();

  scene.add(trooper.scene);
});

// Animation
let previousRAF = null;
function animate(t){
  requestAnimationFrame(animate);

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