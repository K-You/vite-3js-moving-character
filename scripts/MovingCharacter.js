import * as THREE from 'THREE';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Sky } from 'three/examples/jsm/objects/Sky';
import '../style.css';
import { CharacterController } from './CharacterController.js';

class MovingCharacter {
  constructor(props) {
    this.init(props.domElement || 'canvas');
  }

  init(domElement){
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById(domElement),
      antialias: true
    });

    window.addEventListener('resize', () => {
      this.onWindowResize();
    }, false);

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 10000);
    // this.camera.position.set(-70, 160, 280);
    this.camera.position.set(10, 10, 30);

    new OrbitControls(this.camera, this.renderer.domElement);
    this.generateEnvironment();

    this.tie = null;
    this.loadTieFighter();
    this.destroyer = null;
    this.loadStarDestroyer();

    // Array of animations mixers
    this.mixers = [];

    this.totalTimeElapsed = 0;
    this.previousRAF = null;
    this.loadAnimatedCharacter();
    this.animate();

    document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
  }

  onKeyDown(event) {
    if(event.keyCode === 84) { // t
      this.animateStarDestroyer();
    }
    if(event.keyCode === 82) { // r
      this.resetStarDestroyer();
    }
  }

  loadAnimatedCharacter() {
    const params = {
      camera: this.camera,
      scene: this.scene
    }
    this.controls = new CharacterController(params);
  }

  animate() {
    requestAnimationFrame((t) => {

      if(this.previousRAF === null){
        this.previousRAF = t;
      }

      // this.sunlight.position.y += -1;
      // if(this.sunlight.position.y < 0){
      //   this.sunlight.position.y = 800;
      // }

      this.animate();
      this.renderer.render(this.scene, this.camera);

      this.step(t - this.previousRAF);

      
      this.previousRAF = t;
    });
  }

  step(timeElapsedMs) {
    const timeElapsedSeconds = timeElapsedMs * 0.001;

    if(this.mixers){
      this.mixers.map(m => {
        m.update(timeElapsedSeconds)
      })
    }

    this.tieStep(timeElapsedSeconds);
    this.destroyerStep(timeElapsedSeconds);

    if (this.controls) {
      this.controls.update(timeElapsedSeconds);
    }
   
  }

  loadTieFighter() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('../assets/star_wars_tie_fighter/scene.gltf', (tie) => {
      tie.scene.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      
      this.tie = tie.scene;
      this.tie.scale.set(2,2,2);
    });
  }

  loadStarDestroyer(){
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('../assets/star_destroyer/scene.gltf', (destroyer) => {
      destroyer.scene.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      
      this.destroyer = destroyer.scene;
      destroyer.scene.scale.set(50,50,50);
      destroyer.scene.rotation.y = -Math.PI/2;
    });
  }
  
  animateTieFighter() {
    this.tie.position.set(0, 20, -4000);
    this.scene.add(this.tie);
  }

  animateStarDestroyer() {
    this.destroyerToggle = true;
    this.destroyer.position.set(60, 150, -8000);
    this.scene.add(this.destroyer);
  }

  resetStarDestroyer() {
    this.destroyerToggle = false;
    this.scene.remove(this.destroyer);
  }

  tieStep(timeElapsedSeconds) {
    this.totalTimeElapsed += timeElapsedSeconds;
    if (this.tieToggle) {
      let speed = 1;
      if(this.tie.position.z < -1000) {
        speed = 200;
      }
      else if(this.tie.position.z < -500) {
        speed = 25;
      }
      else if(this.tie.position.z > 500) {
        speed = 60;
      }
      else if(this.tie.position.z > 1000) {
        speed = 90;
      }
      else if(this.tie.position.z > 2000) {
        this.tieToggle = false;
      }
      this.tie.position.z += speed;        
    }
    if(this.totalTimeElapsed > 5 && !this.tieToggle) {
      this.tieToggle = true;
      this.animateTieFighter();
    }
  }

  destroyerStep(timeElapsedSeconds) {
    if(this.destroyer && this.destroyerToggle){
      this.totalTimeElapsed += timeElapsedSeconds;
      let speed = 400;
      
      if(this.destroyer.position.z > -1000) {
        speed = 0;
      }
      this.destroyer.position.z += speed;
    }
  }

  // Window resizing
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Sky
  generateSky (){
    const sky = new Sky();
    sky.scale.setScalar(450000)
    this.scene.add(sky);

    const sun = new THREE.Vector3();
    const effectController = {
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
      elevation: 2,
      azimuth: 180,
      exposure: this.renderer.toneMappingExposure
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

    this.renderer.toneMappingExposure = effectController.exposure;
  }
  

  generateEnvironment() {
    const geometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    const material = new THREE.MeshLambertMaterial({
      color: 0x7c966c,
      // color: 0xffffff
    });
    material.color.setHSL( 0.095, 1, 0.75 );

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI/2;
    plane.receiveShadow = true;

    this.scene.add(plane);

    this.scene.background = new THREE.Color(1,0,0).setHSL(0.6, 0, 1);
    this.scene.fog = new THREE.Fog(this.scene.background, 1, 1000);

    // Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dlight = new THREE.DirectionalLight(0xFFFFFF,5);
    dlight.position.set(0,550,-4000);
    dlight.target.position.set(0,0,0);
    dlight.castShadow = true;
    dlight.shadow.bias = -0.0001;
    dlight.shadow.mapSize.width=2048
    dlight.shadow.mapSize.height=2048;
    dlight.shadow.camera.near=100;
    dlight.shadow.camera.far=10000;
    dlight.shadow.camera.left=400;
    dlight.shadow.camera.right=-400;
    dlight.shadow.camera.top=400;
    dlight.shadow.camera.bottom=-400;
    this.scene.add(dlight);
    // this.sunlight = dlight;

    // const cameraHelper = new THREE.DirectionalLightHelper(dlight);
    // this.scene.add(cameraHelper);

    // const ambient = new THREE.AmbientLight(0xFFFFFF, 1);
    // this.scene.add(ambient);

    this.generateSky();
  }

}

export default MovingCharacter;
