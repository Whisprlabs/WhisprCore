import { MultiUserChatManager } from "./MultiUserChatManager.js";
import { XmppStanza, messageType } from "./XmppStanzaBuilder.js";

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
    }

    /**
     * 
     * @param {XMLElement} message 
     */
    onMessage(message) {
        this.messageListener.forEach((cb) => {
            cb(message);
        });

        /** TODO handle incoming messages */
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

}

export { MultiUserChat }