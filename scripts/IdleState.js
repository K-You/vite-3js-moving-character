import { State } from './State';

class IdleState extends State {

  constructor(parent) {
    super(parent);
  }

  get name() {
    return 'idle';
  }

  enter(previousState) {
    const idleAction = this.parent.proxy.animations['idle'].action;
    if(previousState){
      const previousAction = this.parent.proxy.animations[previousState.name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(previousAction, 0.5, true);
    }
    idleAction.play();
  }

  exit() {}

  update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      this.parent.setState('walk');
    } else if (input.keys.space) {
      this.parent.setState('dance');
    }
  }

}

export { IdleState };
