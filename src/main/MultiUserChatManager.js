// @ts-check

import { XmppConnection } from "./XMPPConnection.js"
import { XmppStanza } from "./XmppStanzaBuilder.js"
import { stanzaParser } from "./XmppStanzaParser.js";
import { MultiUserChat } from "./MultiUserChat.js";
import { JID } from "@xmpp/jid";

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
         * @type {Map<string, MultiUserChat>}
         */
        this.mucMap = new Map();
        /**
         * @type {Map<string, { resolve: (value: XMLElement) => void, reject: (reason?: any) => void }>}
         */
        this.messageQueue = new Map();
        this.connection.onEventRegistry("stanza", (/** @type {XMLElement} */message) => {
            const sender = message.attrs.from.split('/')[0]
            if (this.mucMap.has(sender)) {
                this.mucMap.get(sender)?.onMessage(message);
                return;
            }
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
     * @param {XMLElement} message 
     */
    async sendMessage(message) {
        this.connection.send(message);
    }

    /**
     * 
     * @param {{ stanzaId: string, stanza: XMLElement }} message 
     * @returns {Promise<XMLElement>}
     */
    createStanzaPromise(message) {
        return new Promise(async (resolve, reject) => {
            await this.sendMessage(message.stanza);
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
        const message = XmppStanza.DiscoItemDiscovery(jid, this.clientJID)
        return this.createStanzaPromise(message);
    }

    /**
     * Disco item discovery, should only be called internally.
     * @param {string} jid 
     * @returns {Promise<XMLElement>}
     */
    async _discoInfo(jid) {
        const message = XmppStanza.DiscoItemInfo(jid, this.clientJID)
        return this.createStanzaPromise(message);
    }

    /**
     * 
     * @returns {JID | undefined}
     */
    getClientJID() {
        return this.clientJID;
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

    /**
     * 
     * @param {string} jid 
     * @param {string} nickname
     * @returns {MultiUserChat | undefined}
     */
    getMultiUserChat(jid, nickname) {
        const mucExists = this.mucMap.has(jid);
        if (mucExists) {
            return this.mucMap.get(jid);
        }
        const newMuc = new MultiUserChat(jid, this, nickname);
        this.mucMap.set(jid, newMuc);
        return newMuc
    }
}

export { MultiUserChatManager }