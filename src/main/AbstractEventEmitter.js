class EventEmitter {

    allowedEvents = [];

    eventRegistry = new Map();

    onEventRegistry(eventName, callback) {
        if (typeof (eventName) !== "string") {
            console.warn("Event must be of type string");
            return;
        }
        if (!this.allowedEvents.find((allowedEvent) => allowedEvent === eventName)) {
            console.warn(`${eventName.toString()} is not a valid event.`);
            return;
        }
        if (typeof (callback) !== "function") {
            console.warn(`invalid callback function.`);
            return;
        }

        if (!this.eventRegistry.has(eventName)) {
            this.eventRegistry.set(eventName, [callback]);
        }
        this.eventRegistry.get(eventName).push(callback);
    }

    notifyAll(eventName, ...args) {
        const eventCallbacksExist = this.eventRegistry.has(eventName);

        if (!eventCallbacksExist) {
            return;
        }

        for (const cb of this.eventRegistry.get(eventName)) {
            try {
                cb(...args);
            } catch {
                console.error(`Error in callback: ${cb.name} during event: ${eventName} given arguments: ${args}`)
            }
        }
    }
}

export { EventEmitter };