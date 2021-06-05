class FiniteStateMachine {
  constructor() {
    this.states = {};
    this.currentState = null;
  }

  addState(name, type) {
    this.states[name] = type;
  }

  setState(name) {
    const previousState = this.currentState;
    if(previousState) {
      if (previousState === name) {
        return;
      }
      previousState.exit();
    }

    const state = new this.states[name](this);
    this.currentState = state;

    state.enter(previousState);
  }

  update(timeElapsed, input) {
    if(this.currentState) {
      this.currentState.update(timeElapsed, input);
    }
  }
}

export { FiniteStateMachine };
