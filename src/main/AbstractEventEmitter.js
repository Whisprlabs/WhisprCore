class EventEmitter {
    /** @type {string[]} */
    allowedEvents = [];
    /** @type {Map<string, Array<(...args: any[]) => void>>} */
    eventRegistry = new Map();
    /**
     * Register an a callback on an event name.
     * @param {string} eventName 
     * @param {(...args: any[]) => void} callback 
     * @returns {void}
     */
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
    /**
     * Notify all callbacks subscribing to an event.
     * @param {string} eventName 
     * @param  {...any} args 
     * @returns {void}
     */
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