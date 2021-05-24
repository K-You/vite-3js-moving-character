import * as dat from 'dat.gui';
import * as THREE from 'THREE';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky';
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
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.setZ(30);
camera.position.x = 10;

renderer.render(scene, camera);

// Object
const geometry = new THREE.PlaneGeometry(1000, 1000);
const material = new THREE.MeshStandardMaterial({
  color: 0x87b375,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI/2;
scene.add(plane);

// Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

// Helper
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Sky

function initSky (){
  const sky = new Sky();
  sky.scale.setScalar(450000)
  scene.add(sky);

  const sun = new THREE.Vector3();

  /// GUI

  const effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
  };

  function guiChanged() {

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

  const gui = new dat.GUI();

  gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

  guiChanged();

}
initSky();

// Animation
function animate(){
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
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