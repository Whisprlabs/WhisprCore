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

    /**
     * 
     * @param {XMLElement} stanza
     * @param {string} feature
     * @returns {boolean}
     */
    static hasFeature(stanza, feature) {
        const stanzaFeatures = stanza?.getChild('query')?.getChildren('feature');
        if (!stanzaFeatures) {
            return false;
        }
        const mucFeature = stanzaFeatures.filter((element) => {
            return element.attrs.var.endsWith(feature)
        });
        return mucFeature.length !== 0;
    }

    /**
     * 
     * @param {XMLElement} message 
     * @return {{ affiliation: string, role: string}}
     */
    static getRolesAndAffiliation(message) {
        const userMetaData = message
            ?.getChild('x', 'http://jabber.org/protocol/muc#user')
            ?.getChild("item");
        return {
            affiliation: userMetaData?.attrs.affiliation || "",
            role: userMetaData?.attrs.role || ""
        };

    }
}

export { stanzaParser }