/**
 * Get variables from simple CSSStyleSheet object
 * @param {CSSStyleSheet} cssStyleSheet
 * @returns
 */
export const getGlobalVariables = (cssStyleSheet) => {
    /** @type {Map<string, string>} */
    const variableList = new Map();
    const rules = cssStyleSheet.cssRules;
    for (let i = 0; i < rules.length; i++) {
        /** @type {CSSStyleRule} */
        const rule = rules.item(i);
        if (rule instanceof CSSStyleRule && rule.selectorText === "*") {
            for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style.item(k);
                if (prop.startsWith("--")) {
                    variableList.set(prop, rule.style.getPropertyValue(prop));
                }
            }
        }
    }
    return variableList;
};

/**
 * Merge variables from document CSSStyleSheet object
 * @param {CSSStyleSheet} cssStyleSheet
 * @returns
 */
export const mergeGlobalVariablesFromDocument = (cssStyleSheet) => {
    // this style
    /** @type {Map<string, string>} */
    const variableList = new Map();
    /** @type {CSSStyleRule | undefined} */
    let targetCssRule = undefined;
    {
        const rules = cssStyleSheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
            /** @type {CSSStyleRule | CSSRule } */
            const rule = rules.item(i);
            if (rule instanceof CSSStyleRule && rule.selectorText === "*") {
                for (let k = 0; k < rule.style.length; k++) {
                    const prop = rule.style.item(k);
                    if (prop.startsWith("--")) {
                        variableList.set(prop, rule.style.getPropertyValue(prop));
                    }
                }
                targetCssRule = rule;
                break;
            }
        }
    }
    if (!(targetCssRule instanceof CSSStyleRule)) {
        return; // no target rule
    }
    // global styles
    const sheets = document.styleSheets;
    for (let sid = 0; sid < sheets.length; sid++) {
        const rules = sheets.item(sid).cssRules;
        for (let i = 0; i < rules.length; i++) {
            /** @type {CSSStyleRule} */
            const rule = rules.item(i);
            if (rule instanceof CSSStyleRule && rule.selectorText === "*") {
                for (let k = 0; k < rule.style.length; k++) {
                    const prop = rule.style.item(k);
                    if (variableList.has(prop)) {
                        // merge props
                        targetCssRule.style.setProperty(prop, rule.style.getPropertyValue(prop));
                    }
                }
            }
        }
    }
};
