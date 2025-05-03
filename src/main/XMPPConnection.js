// @ts-check
import { client, xml } from "@xmpp/client"
import id from "@xmpp/id";
import debug from "@xmpp/debug"
import { EventEmitter } from "./AbstractEventEmitter.js"
import { JID } from "@xmpp/jid";

class XmppConnectionConfig {
    /**
     * @param {Object} options
     * @param {string} options.service
     * @param {string} options.domain
     * @param {string} options.resource
     * @param {string} options.username
     * @param {string} options.password
     * @param {boolean} options.debug
     */
    constructor({ service, domain, resource, username, password, debug }) {
        this.service = service;
        this.domain = domain;
        this.resource = resource;
        this.username = username;
        this.password = password;
        this.debug = debug;
    }

    /**
     * 
     * @returns {XmppConnectionConfigBuilder}
     */
    static builder() {
        return new XmppConnectionConfigBuilder();
    }
}

class XmppConnectionConfigBuilder {
    constructor() {
        this.service = "";
        this.domain = "";
        this.resource = "";
        this.username = "";
        this.password = "";
        this.debug = false;
    }
    /**
     *  (Required) Set the service.
     * @param {string} service 
     * @returns {XmppConnectionConfigBuilder}
     */
    setService(service) {
        this.service = service;
        return this;
    }
    /**
     * (Required) Set the domain.
     * @param {string} domain 
     * @returns {XmppConnectionConfigBuilder}
     */
    setDomain(domain) {
        this.domain = domain;
        return this;
    }
    /**
     * (Optional) Set the resource. Automatically set if none is provided.
     * @param {string} resource 
     * @returns {XmppConnectionConfigBuilder}
     */
    setResource(resource) {
        this.resource = resource;
        return this;
    }
    /**
     * (Required) Set the username.
     * @param {string} username 
     * @returns {XmppConnectionConfigBuilder}
     */
    setUsername(username) {
        this.username = username;
        return this;
    }
    /**
     * (Required) Set the password.
     * @param {string} password 
     * @returns {XmppConnectionConfigBuilder}
     */
    setPassword(password) {
        this.password = password;
        return this;
    }
    /**
     * (Optional) Enable debug output. Default is off.
     * @returns {XmppConnectionConfigBuilder}
     */
    enableDebug() {
        this.debug = true;
        return this;
    }
    /**
     * Checks for configuration error.
     * @returns {void}
     */
    validate() {

        if (!this.service) {
            throw new Error("A service must be provided.")
        }
        if (!this.domain) {
            throw new Error("A domain must be provided.")
        }
        if (!this.username) {
            throw new Error("A username must be provided.")
        }
        if (!this.password) {
            throw new Error("A password must be provided.")
        }

        if (!this.resource) {
            this.resource = id();
        }

    }

    /**
     * Builds a new XmppConnectionConfig given the supplied configuration.
     * @returns {XmppConnectionConfig}
     */
    build() {
        this.validate()
        return new XmppConnectionConfig({
            service: this.service,
            domain: this.domain,
            resource: this.resource,
            username: this.username,
            password: this.password,
            debug: this.debug,
        });
    }
}

class XmppConnection extends EventEmitter {
    /**
     * 
     * @param {XmppConnectionConfig} connectionConfig 
     */
    constructor(connectionConfig) {
        super();
        /**
         * @type { string[] }
         */
        this.allowedEvents = [
            "error",
            "offline",
            "online",
            "stanza",
            "connecting",
            "connect",
            "opening",
            "open",
            "closing",
            "close",
            "disconnecting",
            "disconnect"
        ];
        /** 
         * @type {Map<any, any>}
        */
        this.managerMap = new Map();

        if (!(connectionConfig instanceof XmppConnectionConfig)) {
            throw new Error("Only XmppConnectionConfig can be supplied to XmppConnection.");
        }

        /**
         * @type {import("@xmpp/client").Client}
         */
        this.connection = client({
            service: connectionConfig.service,
            domain: connectionConfig.domain,
            resource: connectionConfig.resource,
            username: connectionConfig.username,
            password: connectionConfig.password,
        });

        debug(this.connection, connectionConfig.debug);
    }
    /**
     * Return the Client JID.
     * @returns {JID | undefined}
     */
    getClientConnectionJid() {
        return this.entityFullJID;
    }
    /**
     * 
     * @param {any} managerClass 
     * @returns {any}
     */
    getInstanceForManager(managerClass) {
        const isManagerCreated = this.managerMap.has(managerClass);
        if (isManagerCreated) {
            return this.managerMap.get(managerClass);
        }
        const newManagerInstance = new managerClass(this);
        this.managerMap.set(managerClass, newManagerInstance);
        return newManagerInstance;
    }
    /**
     * Send a stanza to the domain.
     * @param {XMLElement} stanza 
     */
    async send(stanza) {
        await this.connection.send(stanza);
    }
    /**
     * Connect to the domain.
     * @return {Promise<void>}
     */
    async start() {

        this.connection.on('stanza', (/** @type{XMLElement}*/ message) => {
            this.notifyAll('stanza', message);
        })
        /**
         * @type {JID}
         */
        this.entityFullJID = await this.connection.start();
        await this.send(xml("presence"));
    }

}

export { XmppConnection, XmppConnectionConfig, XmppConnectionConfigBuilder };
