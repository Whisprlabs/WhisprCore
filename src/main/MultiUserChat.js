import { MultiUserChatManager } from "./MultiUserChatManager.js";
import { XmppStanza, messageType, presenceType } from "./XmppStanzaBuilder.js";
import { stanzaParser } from "./XmppStanzaParser.js";

class MultiUserChat {
    /**
     * @constructor
     * @param {string} jid 
     * @param {MultiUserChatManager} mucManager 
     * @param {string} nickname
     */
    constructor(jid, mucManager, nickname) {
        /**
         * @type {string}
         */
        this.jid = jid;

        /**
         * @type {Array<(message: XMLElement) => void>}
         */
        this.messageListener = [];

        /**
         * @type {MultiUserChatManager>}
         */
        this.mucManager = mucManager;

        /**
         * @type {string}
         */
        this.nickname = nickname

        /**
         * @type {Map<string, { affiliation: string, role: string }>}
         */
        this.roomParticipants = new Map();
    }

    /**
     * 
     * @param {XMLElement} message 
     */
    onMessage(message) {
        this.messageListener.forEach((cb) => {
            cb(message);
        });

        if (message.is('presence')) {
            const sender = message.attrs.from;
            const userExists = this.roomParticipants.has(sender);
            if (!userExists) {
                const userData = stanzaParser.getRolesAndAffiliation(message)
                this.roomParticipants.set(sender, userData);
            }
            const getStanzaPresenceType = message.attrs.type
            if (getStanzaPresenceType === 'unavailable') {
                this.roomParticipants.delete(sender);
            }

            /** TODO STATUS CODE MUC PRESENCE STANZAS */
        }
    }
    /**
     * 
     * @param {(message: XMLElement) => void} callback 
     */
    addMessageListener(callback) {
        this.messageListener.push(callback);
    }

    async joinRoom() {
        const message = XmppStanza.JoinRoomStanza(this.jid, this.mucManager.getClientJID(), this.nickname);
        await this.mucManager.sendMessage(message.stanza);
    }


    async sendMessage(body) {
        const message = XmppStanza.createMessage(this.mucManager.getClientJID(), this.jid, messageType.GROUPCHAT, body)
        await this.mucManager.sendMessage(message);
    }

    /**
     * 
     * @type {Map<string, { affiliation: string, role: string }>}
     */
    getroomParticipants() {
        return this.roomParticipants;
    }

    async leaveRoom() {
        const message = XmppStanza.createPresence(this.mucManager.getClientJID(), this.jid, presenceType.LEAVE_CHAT);
        await this.mucManager.sendMessage(message);
    }

}

export { MultiUserChat }