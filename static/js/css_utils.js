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

const RANDOM_CHARS_PROVIDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const getRandomInt = (min, max) => {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // 不包含最大值，包含最小值
};

/**
 * @param {string} pre
 * @param {Array<string>} strings
 * @param  {...any} keys
 */
const prefixTemplate = (pre, strings, ...keys) => {
    const strList = [];
    strList.push(strings.at(0));
    for (let i = 0; i < keys.length; i++) {
        const val = keys.at(i);
        switch (typeof val) {
            case "undefined":
                // do nothing
                break;
            case "string":
                strList.push(val);
                break;
            default:
                if (val !== null) {
                    strList.push(val.toString());
                }
                break;
        }
        strList.push(strings.at(i + 1));
    }
    return strList.join("").replaceAll("↦", pre);
};

/**
 * Get a random prefix string template tag, no unique guarantee. Used to build scoped css.
 *
 * The returned function will replace all '↦' symbol(char) with random 8 length string
 * @returns {(strings: Array<string>, ...keys: Array<any>) => string} random char string length 8
 */
export const generateRandomTemplateTag = () => {
    const chars = [];
    while (chars.length < 8) {
        const charIndex = getRandomInt(0, RANDOM_CHARS_PROVIDER.length);
        chars.push(RANDOM_CHARS_PROVIDER[charIndex]);
    }
    return prefixTemplate.bind(undefined, chars.join(""));
};

/**
 * Remove display and opacity from style list.
 * @param {CSSStyleDeclaration} style 
 */
export const removeStyleHidden = (style) => {
    for (let i = 0; i < style.length; i++) {
        const prop = style.item(i);
        if (["display", "opacity"].includes(prop)) {
            // merge props
            style.removeProperty(prop);
        }
    }
}
