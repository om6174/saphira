const eventBus = {
  listeners: new Map(),

  $on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  },

  $off(event, callback) {
    if (this.listeners.has(event)) {
      const listenersForEvent = this.listeners.get(event);
      const index = listenersForEvent.indexOf(callback);
      if (index > -1) {
        listenersForEvent.splice(index, 1);
      }
    }
  },

  $emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(payload));
    }
  },
};

export default eventBus;
