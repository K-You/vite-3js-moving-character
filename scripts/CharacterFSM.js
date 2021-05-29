import { DanceState } from './DanceState';
import { FiniteStateMachine } from './FiniteStateMachine';
import { IdleState } from './IdleState';
import { RunState } from './RunState';
import { WalkState } from './WalkState';

class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this.proxy = proxy;
    this.init();
  }

  init(){
    this.addState('idle', IdleState);
    this.addState('walk', WalkState);
    this.addState('run', RunState);
    this.addState('dance', DanceState);
  }
}

export { CharacterFSM };
