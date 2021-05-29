import { State } from './State';

class RunState extends State {

  constructor(parent) {
    super(parent);
  }

  get name() {
    return 'run';
  }

  enter(previousState) {
    const currentAction = this.parent.proxy.animations['run'].action;
    if(previousState){
      const previousAction = this.parent.proxy.animations[previousState.name].action;

      currentAction.enabled = true;

      if (previousState.name === 'walk') {
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
      if (!input.keys.shift) {
        this.parent.setState('walk');
      }
      return;
    }
    this.parent.setState('idle');
  }
}

export { RunState };
