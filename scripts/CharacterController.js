import * as THREE from 'THREE';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CharacterControllerInput } from './CharacterControllerInput';
import { CharacterControllerProxy } from './CharacterControllerProxy';
import { CharacterFSM } from './CharacterFSM';

class CharacterController {

  constructor(params){
    this.init(params);
  }

  init(params) {
    this.params = params;
    
    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this.acceleration = new THREE.Vector3(1.5, 0.25, 50.0);
    this.velocity = new THREE.Vector3(0,0,0);

    this.animations = {}
    
    this.input = new CharacterControllerInput();

    this.stateMachine = new CharacterFSM(new CharacterControllerProxy(this.animations));
    
    this.loadModels();
  }

  loadModels(){
    const fbxLoader = new FBXLoader();
    const rootPath = '../assets/battle-droid-force-pushed/';
    fbxLoader.setPath(rootPath+'source/');
    fbxLoader.load('droid.fbx', (fbx) => {
      fbx.scale.setScalar(0.02);
      fbx.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      this.target = fbx;

      this.params.scene.add(this.target);
      this.mixer = new THREE.AnimationMixer(this.target);

      this.manager = new THREE.LoadingManager();
      this.manager.onLoad = () => {
        this.stateMachine.setState('idle');
      }

      const onLoad = (animationName, anim) => {
        const clip = anim.animations[0];
        const action = this.mixer.clipAction(clip);
  
        this.animations[animationName] = {
          clip,
          action
        }
      }
      const fbxLoader = new FBXLoader(this.manager);
      fbxLoader.setPath(rootPath+'animations/');
      fbxLoader.load('Idle.fbx', (a) => { onLoad('idle', a); });
      fbxLoader.load('Walking.fbx', (a) => { onLoad('walk', a); });
      fbxLoader.load('Running.fbx', (a) => { onLoad('run', a); });
      fbxLoader.load('Dance.fbx', (a) => { onLoad('dance', a); });
    });
  }

  update(timeInSeconds) {
    if (!this.target) {
      return;
    }
    this.stateMachine.update(timeInSeconds, this.input);
    
    const velocity = this.velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this.decceleration.x,
      velocity.y * this.decceleration.y,
      velocity.z * this.decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this.target;
    const Q = new THREE.Quaternion();
    const A = new THREE.Vector3();
    const R = controlObject.quaternion.clone();

    const acc = this.acceleration.clone();
    if (this.input.keys.shift) {
      acc.multiplyScalar(2.0);
    }
    if (this.stateMachine.currentState?.name === 'dance') {
      acc.multiplyScalar(0.0);
    }

    if (this.input.keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this.input.keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }


    if (this.input.keys.left) {
      A.set(0,1,0);
      Q.setFromAxisAngle(A, 4.0 * Math.PI * timeInSeconds * this.acceleration.y);
      R.multiply(Q);
    }
    if (this.input.keys.right) {
      A.set(0,1,0);
      Q.setFromAxisAngle(A, 4.0 * -Math.PI * timeInSeconds * this.acceleration.y);
      R.multiply(Q);
    }

    controlObject.quaternion.copy(R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    forward.multiplyScalar(velocity.z * timeInSeconds);
    sideways.multiplyScalar(velocity.x * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);

    if (this.mixer) {
      this.mixer.update(timeInSeconds);
    }
  }

}

export { CharacterController };
