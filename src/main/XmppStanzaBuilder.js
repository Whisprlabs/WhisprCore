import { xml } from "@xmpp/client";
import id from "@xmpp/id";
class XmppStanza {

    static MUCDiscover(to, from) {
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