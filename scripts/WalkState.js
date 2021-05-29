import { State } from './State';

class WalkState extends State {

  constructor(parent) {
    super(parent);
  }

  get name() {
    return 'walk';
  }

  enter(previousState) {
    const currentAction = this.parent.proxy.animations['walk'].action;
    if(previousState){
      const previousAction = this.parent.proxy.animations[previousState.name].action;

      currentAction.enabled = true;

      if (previousState.name === 'run') {
        const ratio = currentAction.getClip().duration / previousAction.getClip().duration;
        currentAction.time = previousAction.time * ratio;
      } else {
        currentAction.time = 0.0;
        currentAction.setEffectiveTimeScale(1.0);
        currentAction.setEffectiveWeight(1.0);
      }
      currentAction.crossFadeFrom(previousAction, 0.5, true);
    }
    currentAction.play();
  }

  exit() {}

  update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.shift) {
        this.parent.setState('run');
      }
      return;
    }
    this.parent.setState('idle');
  }
}

export { WalkState };
