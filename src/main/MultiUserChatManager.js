import { XmppConnection } from "./XMPPConnection.js"
import { XmppStanza } from "./XmppStanzaBuilder.js"

class MultiUserChatManager {

    constructor(connection) {
        this.connection = connection;
        this.clientJID = this.connection.getClientConnectionJid();
        this.messageQueue = new Map();
        this.connection.onEventRegistry("stanza", (message) => {
            if (message.is('iq')) {
                const messageId = message.attrs.id;
                if (this.messageQueue.has(messageId)) {
                    const stanzaFromId = this.messageQueue.get(messageId);
                    stanzaFromId.resolve(message)
                    this.messageQueue.delete(messageId);
                }
            }
        })
    }

    static getInstanceFor(connection) {
        if (!(connection instanceof XmppConnection)) {
            console.warn("Argument of MultiUserManager getInstanceFor must be of type XmppConnection");
            return undefined;
        }
        return connection.getInstanceForManager(this);

    }

    async _discoItems(jid = this.clientJID.getDomain()) {
        const message = XmppStanza.MUCDiscover(jid, this.clientJID.toString())

        let result = await new Promise(async (resolve, reject) => {
            await this.connection.send(message.stanza);
            this.messageQueue.set(message.stanzaId, { resolve, reject });
            setTimeout(resolve, 5000);
        });

        let domains = result.getChild("query")?.getChildren("item");
        if (!domains) {
            return [];
        }
        return domains.map((item) => {
            return (
                {
                    jid: item.attrs.jid,
                    name: item.attrs.name
                }
            )
        });
    }

    async getRooms(jid) {
        return await this._discoItems(jid);
    }

    async getDomainServices() {
        return await this._discoItems();
    }


}

export { MultiUserChatManager }