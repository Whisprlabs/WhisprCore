// @ts-check
import { xml } from "@xmpp/client";
import id from "@xmpp/id";
import { JID } from "@xmpp/jid";

const messageType = Object.freeze({
    GROUPCHAT: "groupchat",

})

class XmppStanza {
    /**
     * Create a Disco item discovery stanza
     * @param {string} to 
     * @param {JID | undefined} from 
     * @returns {{ stanzaId: string, stanza: XMLElement }}
     */
    static DiscoItemDiscovery(to, from) {
        const stanzaId = id();
        const stanza = xml(
            'iq',
            {
                from: from,
                to: to,
                id: stanzaId,
                type: 'get'
            },
            xml('query', { xmlns: 'http://jabber.org/protocol/disco#items' })
        );
        return { stanzaId, stanza };
    }

    /**
     * Create a Disco item discovery stanza
     * @param {string} to 
     * @param {JID | undefined} from 
     * @returns {{ stanzaId: string, stanza: XMLElement }}
     */
    static DiscoItemInfo(to, from) {
        const stanzaId = id();
        const stanza = xml(
            'iq',
            {
                from: from,
                to: to,
                id: stanzaId,
                type: 'get'
            },
            xml('query', { xmlns: 'http://jabber.org/protocol/disco#info' })
        );
        return { stanzaId, stanza };
    }
    /**
     * 
     * @param {string} jid 
     * @param {string} from 
     * @param {string} nickname 
     * @returns 
     */
    static JoinRoomStanza(jid, from, nickname) {
        const stanzaId = id();
        const stanza = xml(
            'presence',
            {
                from: from,
                id: stanzaId,
                to: `${jid}/${nickname}`,
                type: 'get'
            },
            xml('x', { xmlns: 'http://jabber.org/protocol/muc' })
        );
        return { stanzaId, stanza };
    }

    /**
     * 
     * @param {string} from 
     * @param {string} to 
     * @param {string} type 
     * @param {string} body 
     * @return {XMLElement}
     */
    static createMessage(from, to, type, body) {

        const stanza = xml(
            'message',
            {
                from: from,
                id: id(),
                to: to,
                type: type,
            },
            xml('body', {}, body)
        );
        return stanza;
    }
}

export { XmppStanza, messageType }