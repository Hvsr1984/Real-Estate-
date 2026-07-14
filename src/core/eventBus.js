/* js/core/eventBus.js - Decoupled PubSub Event Broker */

class EventBus {
    constructor() {
        this.listeners = {};
    }

    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    once(event, callback) {
        const tempCallback = (data) => {
            callback(data);
            this.off(event, tempCallback);
        };
        return this.on(event, tempCallback);
    }

    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`Error executing listener for event "${event}":`, e);
            }
        });
    }
}

export default EventBus;
export const eventBus = EventBus.getInstance();
