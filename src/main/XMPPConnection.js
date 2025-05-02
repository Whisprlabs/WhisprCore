import { client, xml } from "@xmpp/client"
import id from "@xmpp/id";
import debug from "@xmpp/debug"
import jid from "@xmpp/jid";
import { EventEmitter } from "./AbstractEventEmitter.js"


class XmppConnectionConfig {
    constructor({ service, domain, resource, username, password }) {
        this.service = service;
        this.domain = domain;
        this.resource = resource;
        this.username = username;
        this.password = password;
    }

    static builder() {
        return new XmppConnectionConfigBuilder();
    }
}

class XmppConnectionConfigBuilder {
    constructor() {
        this.service = null;
        this.domain = null;
        this.resource = null;
        this.username = null;
        this.password = null;
        this.debug = false;
    }

    setService(service) {
        this.service = service;
        return this;
    }

    setDomain(domain) {
        this.domain = domain;
        return this;
    }

    setResource(resource) {
        this.resource = resource;
        return this;
    }

    setUsername(username) {
        this.username = username;
        return this;
    }

    setPassword(password) {
        this.password = password;
        return this;
    }

    enableDebug() {
        this.debug = true;
        return this;
    }

    validate() {
        let error = 0;

        if (!this.service) {
            error++;
            console.error("A service must be provided.");
        }
        if (!this.domain) {
            error++;
            console.error("A domain must be provided.");
        }
        if (!this.username) {
            error++;
            console.error("A username must be provided.");
        }
        if (!this.password) {
            error++;
            console.error("A password must be provided.");
        }

        if (!this.resource) {
            this.resource = id();
        }

        return error === 0;
    }


    build() {
        if (!this.validate()) {
            return undefined;
        }

        return new XmppConnectionConfig({
            service: this.service,
            domain: this.domain,
            resource: this.resource,
            username: this.username,
            password: this.password,
        });
    }
}

class XmppConnection extends EventEmitter {
    constructor(connectionConfig) {
        super();
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
        this.managerMap = new Map();

        if (!(connectionConfig instanceof XmppConnectionConfig)) {
            throw new Error("Only XmppConnectionConfig can be supplied to XmppConnection.");
        }

        this.connection = client({
            service: connectionConfig.service,
            domain: connectionConfig.domain,
            resource: connectionConfig.resource,
            username: connectionConfig.username,
            password: connectionConfig.password,
        });

        debug(this.connection, connectionConfig.debug);
        this.entityFullJID = jid(connectionConfig.username, connectionConfig.domain, connectionConfig.resource);
    }

    getClientConnectionJid() {
        return this.entityFullJID;
    }

    getInstanceForManager(managerClass) {
        const isManagerCreated = this.managerMap.has(managerClass);
        if (isManagerCreated) {
            return this.managerMap.get(managerClass);
        }
        const newManagerInstance = new managerClass(this);
        this.managerMap.set(managerClass.name, newManagerInstance);
        return newManagerInstance;
    }

    async send(stanza) {
        await this.connection.send(stanza);
    }

    async start() {

        this.connection.on('stanza', (message) => {
            this.notifyAll('stanza', message);
        })
        await this.connection.start();
        await this.send(xml("presence"));
    }

}

export { XmppConnection, XmppConnectionConfig, XmppConnectionConfigBuilder };
