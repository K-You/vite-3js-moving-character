import * as THREE from 'THREE';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Sky } from 'three/examples/jsm/objects/Sky';
import '../style.css';

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

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(10, 10, 30);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.generateEnvironment();


    // Trooper 
    // Array of animations mixers
    this.mixers = [];

    this.trooper = null;
    this.loadStormtrooper();
    this.tie = null;
    this.loadTieFighter();

    window.addEventListener('resize', () => {
      this.onWindowResize();
    }, false);

    this.totalTimeElapsed = 0;
    this.previousRAF = null;
    this.animate();
  }

  loadStormtrooper() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('../assets/dancing_stormtrooper/scene.gltf', (trooper) => {
      trooper.scene.traverse(c => {
        c.castShadow = true;
      });

      const mixer = new THREE.AnimationMixer(trooper.scene);
      this.mixers.push(mixer);
      const start = mixer.clipAction(trooper.animations[0]);
      start.play();

      this.scene.add(trooper.scene);
      this.trooper = trooper.scene;
    });
  }

  loadTieFighter() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('../assets/star_wars_tie_fighter/scene.gltf', (tie) => {
      tie.scene.traverse(c => {
        c.castShadow = true;
      });
      
      this.tie = tie.scene;
      this.tie.scale.set(2,2,2);
    });
  }
  
  animateTieFighter() {
    this.scene.add(this.tie);
    this.tie.position.set(0, 20, -4000);
  }

  animate() {
    requestAnimationFrame((t) => {
      this.controls.update();

      this.renderer.render(this.scene, this.camera);
      if(this.previousRAF === null){
        this.previousRAF = t;
      }

      this.animate();

      if (this.tieFighter) {
        let speed = 1;
        if(this.tie.position.z < -1000) {
          speed = 200;
        }
        if(this.tie.position.z < -500) {
          speed = 25;
        }
        if(this.tie.position.z > 500) {
          speed = 60;
        }
        if(this.tie.position.z > 1000) {
          speed = 90;
        }
        if(this.tie.position.z > 2000) {
          this.tieFighter = false;
        }
        this.tie.position.z += speed;        
      }

      const timeElapsed = (t-this.previousRAF) * 0.001;
      this.totalTimeElapsed += timeElapsed;

      if(this.totalTimeElapsed > 5 && !this.tieFighter) {
        this.tieFighter = true;
        this.animateTieFighter();
      }

      if(this.mixers){
        this.mixers.map(m => {
          m.update(timeElapsed)
        })
      }
      this.previousRAF = t;
    });
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
    const geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
    const material = new THREE.MeshLambertMaterial({
      // color: 0x7c966c,
      color: 0xffffff
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
    this.scene.add(dlight);

    this.generateSky();
  }

}

export default MovingCharacter;
