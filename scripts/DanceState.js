import * as THREE from 'THREE';
import { State } from './State';
class DanceState extends State {

  constructor(parent) {
    super(parent);

    this.finishedCallback = () => {
      this.finished();
    }
  }

  get name() {
    return 'dance';
  }

  enter(previousState) {
    const currentAction = this.parent.proxy.animations['dance'].action;
    const mixer = currentAction.getMixer();
    mixer. addEventListener('finished', this.finishedCallback);

    if(previousState){
      const previousAction = this.parent.proxy.animations[previousState.name].action;

      currentAction.reset();
      currentAction.setLoop(THREE.LoopOnce, 1);
      currentAction.clampWhenFinished = true;
      currentAction.crossFadeFrom(previousAction, 0.2, true);
    }
    currentAction.play();
  }

  finished() {
    this.cleanup();
    this.parent.setState('idle');
  }

  cleanup() {
    const action = this.parent.proxy.animations['dance'].action;
    action.getMixer().removeEventListener('finished', this.cleanupCallback);
  }

  cleanupCallback(event) {
  }

  exit() {
    this.cleanup();
  }

  update(_) {
  }
}

export { DanceState };
