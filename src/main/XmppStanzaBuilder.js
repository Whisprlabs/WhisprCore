import { xml } from "@xmpp/client";
import id from "@xmpp/id";
import { JID } from "@xmpp/jid";
class XmppStanza {
    /**
     * Create a Disco item discovery stanza
     * @param {string} to 
     * @param {JID} from 
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

}

export { XmppStanza }