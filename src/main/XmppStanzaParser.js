// @ts-check
class stanzaParser {
    /**
     * 
     * @param {XMLElement} stanza 
     * @returns {Array<{jid: string, name: string}>}
     */
    static extractItems(stanza) {
        let DiscoItems = stanza.getChild("query")?.getChildren("item");
        if (!DiscoItems) {
            return [];
        }

        return DiscoItems.map((/** @type {XMLElement}*/ item) => {
            return (
                {
                    jid: item.attrs.jid,
                    name: item.attrs.name
                }
            )
        });
    }
}

export { stanzaParser }