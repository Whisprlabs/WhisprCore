// @ts-check

import { XmppConnection } from "./XMPPConnection.js"
import { XmppStanza } from "./XmppStanzaBuilder.js"
import { stanzaParser } from "./XmppStanzaParser.js";

class MultiUserChatManager {
    /**
     * 
     * @param {XmppConnection} connection 
     */
    constructor(connection) {
        /**
         * @type {XmppConnection}
         */
        this.connection = connection;
        this.clientJID = this.connection.getClientConnectionJid();

        /**
         * @type {Map<string, { resolve: (value: XMLElement) => void, reject: (reason?: any) => void }>}
         */
        this.messageQueue = new Map();
        this.connection.onEventRegistry("stanza", (/** @type {XMLElement} */message) => {
            if (message.is('iq')) {
                const messageId = message.attrs.id;
                if (this.messageQueue.has(messageId)) {
                    const stanzaFromId = this.messageQueue.get(messageId);
                    stanzaFromId?.resolve(message)
                    this.messageQueue.delete(messageId);
                }
            }
        })
    }
    /**
     * Get the MultiUserChatManager for the connection.
     * @param {XmppConnection} connection 
     * @returns {MultiUserChatManager}
     */
    static getInstanceFor(connection) {
        if (!(connection instanceof XmppConnection)) {
            throw new Error("Argument of MultiUserManager getInstanceFor must be of type XmppConnection");
        }
        return connection.getInstanceForManager(this);

    }

    /**
     * 
     * @param {{ stanzaId: string, stanza: XMLElement }} message 
     * @returns {Promise<XMLElement>}
     */
    createStanzaPromise(message) {
        return new Promise(async (resolve, reject) => {
            await this.connection.send(message.stanza);
            this.messageQueue.set(message.stanzaId, { resolve, reject });
            setTimeout(resolve, 5000);
        });
    }

    /**
     * Disco item discovery, should only be called internally.
     * @param {string} jid 
     * @returns {Promise<XMLElement>}
     */
    async _discoItems(jid) {
        const message = XmppStanza.DiscoItemDiscovery(jid, this.connection.getClientConnectionJid())
        return this.createStanzaPromise(message);
    }

    /**
     * Disco item discovery, should only be called internally.
     * @param {string} jid 
     * @returns {Promise<XMLElement>}
     */
    async _discoInfo(jid) {
        const message = XmppStanza.DiscoItemInfo(jid, this.connection.getClientConnectionJid())
        return this.createStanzaPromise(message);
    }

    /**
     * Get all rooms associated with the specified JID.
     * @param {string} jid 
     * @returns {Promise<Array<{jid: string, name?: string}>>}
     */
    async getRoomsHostedBy(jid) {
        const result = await this._discoItems(jid);
        return stanzaParser.extractItems(result);

    }
    /**
     * Get all domain services available from the Domain server.
     * @returns {Promise<Array<{jid: string, name?: string}>>}
     */
    async getDomainServices() {
        const jid = this.connection?.getClientConnectionJid()?.domain
        const result = await this._discoItems(jid !== undefined ? jid : "");
        return stanzaParser.extractItems(result);
    }
    /**
     * Discover all hosted items on the domain.
     * @returns {Promise<Array<{jid: string, name?: string}>>}
     */
    async discoverHostedItems() {
        const result = await this.getDomainServices();

        const hostedItems = await Promise.all(result.map(async (discoItem) => {
            return await this.getRoomsHostedBy(discoItem.jid);
        }))
        return hostedItems.flat();
    }

    /**
     * Get all muc services.
     * @returns {Promise<string[]>}
     */
    async getMucServices() {
        const result = await this.getDomainServices();

        const hostedItems = await Promise.all(result.map(async (discoItem) => {
            const info = await this._discoInfo(discoItem.jid);
            return stanzaParser.isMuc(info) === true ? discoItem.jid : "";
        }))
        return hostedItems.filter((jid) => jid.length > 0);
    }
}

export { MultiUserChatManager }