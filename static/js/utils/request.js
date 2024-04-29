import { requestGraphQLEndpointAtom, requestGraphQLWebSocketEndpointAtom, requestTokenAtom } from "../store/request.js";
import jsSHA from "../libs/jsSHA/index.js";

let token = "";
let gqlEndpoint = "";
let gqlWebSocketEndpoint = "";
requestTokenAtom.subscribe((val) => {
    token = val;
});
requestGraphQLEndpointAtom.subscribe((val) => {
    gqlEndpoint = val;
});
requestGraphQLWebSocketEndpointAtom.subscribe((val) => {
    gqlWebSocketEndpoint = val;
});

/**
 * @typedef GraphQLResponse
 * @property {any | undefined} data
 * @property {Array<any> | undefined} errors
 * @property {string | undefined} requestId
 */

/**
 * Generate HMAC-SHA512 sign
 * @param {string} token
 * @param {string} unixSecs
 * @param {string} content
 */
const generateSign = (token, unixSecs, content) => {
    const encoder = new TextEncoder();
    const keyBinary = encoder.encode(token);
    const contentBinary = encoder.encode(content + unixSecs);
    const shaObj = new jsSHA("SHA-512", "UINT8ARRAY", {
        hmacKey: { value: keyBinary, format: "UINT8ARRAY" },
    });
    shaObj.update(contentBinary);
    return shaObj.getHash("HEX").toUpperCase();
};

/**
 * GraphQL HTTP GET
 * @param {string} query
 * @param {Record<string, any>} [variables={}]
 * @returns {Promise<GraphQLResponse>}
 */
export const requestGraphQLGet = async (query, variables = {}) => {
    const url = new URL(gqlEndpoint, globalThis.location.toString());
    url.searchParams.set("query", query);
    url.searchParams.set("variables", JSON.stringify(variables));
    const timeSecs = Math.floor(Date.now() / 1000).toString();
    const sign = generateSign(token, timeSecs, url.search);
    const resp = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "Timestamp": timeSecs,
            "Sign": sign,
        },
    });
    if (resp.status !== 200) {
        throw resp;
    }
    return await resp.json();
};

/**
 * GraphQL HTTP POST
 * @param {string} query
 * @param {Record<string, any>} [variables={}]
 * @returns {Promise<GraphQLResponse>}
 */
export const requestGraphQLPost = async (query, variables = {}) => {
    const url = new URL(gqlEndpoint, globalThis.location.toString());
    const requestBody = JSON.stringify({
        query,
        variables,
    });
    const timeSecs = Math.floor(Date.now() / 1000).toString();
    const sign = generateSign(token, timeSecs, requestBody);
    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Timestamp": timeSecs,
            "Sign": sign,
            "Content-Type": "application/json",
        },
        body: requestBody,
    });
    if (resp.status !== 200) {
        throw resp;
    }
    return await resp.json();
};

const RANDOM_CHARS_PROVIDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const getRandomInt = (min, max) => {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // 不包含最大值，包含最小值
};
/** Unsafe random content generator */
const getRandomContent = () => {
    const chars = [];
    while (chars.length < 8) {
        const charIndex = getRandomInt(0, RANDOM_CHARS_PROVIDER.length);
        chars.push(RANDOM_CHARS_PROVIDER[charIndex]);
    }
    return chars.join("");
};

export class GraphQLSocket {
    constructor() {
        /** @type {Map<string, (resp: GraphQLResponse) => void} */
        this.waitingMap = new Map();
        /** @type {Map<string, (error: any) => void} */
        this.rejectMap = new Map();
        /** @type {number} */
        this.nextRequestId = 0;
        /** @type {boolean} */
        this.isReady = false;
        /** @type {WebSocket | null} */
        this.ws = null;
        /** @type {Promise<void> | null} */
        this.waitOpenPromise = null;
    }

    open() {
        // init socket
        const url = new URL(gqlWebSocketEndpoint, globalThis.location.toString());
        if (globalThis.location.protocol.toLocaleLowerCase().startsWith("https")) {
            url.protocol = "wss:";
        } else {
            url.protocol = "ws";
        }
        const timeSecs = Math.floor(Date.now() / 1000).toString();
        const content = getRandomContent();
        const sign = generateSign(token, timeSecs, content);
        url.searchParams.set("Timestamp", timeSecs);
        url.searchParams.set("Content", content);
        url.searchParams.set("Sign", sign);
        /** @type {Promise<void>} */
        this.waitOpenPromise = new Promise((rs) => {
            this.ws = new WebSocket(url);
            this.ws.binaryType = "arraybuffer";
            this.ws.onopen = () => {
                this.isReady = true;
                rs();
                this.waitOpenPromise = null;
            };
            this.ws.onmessage = (e) => this.onResponMessage(e);
            this.ws.onclose = () => {
                this.closeAll(null);
                this.isReady = false;
                this.ws = null;
            };
            this.ws.onerror = (e) => {
                this.closeAll(e);
                this.ws.close();
            };
        });
        return this.waitOpenPromise;
    }

    async waitOpen() {
        if (this.waitOpenPromise != null) {
            await this.waitOpenPromise;
        }
    }

    /**
     * @param {MessageEvent} e
     */
    onResponMessage(e) {
        const data = e.data;
        if (typeof data === "string") {
            /** @type {GraphQLResponse} */
            const resp = JSON.parse(data);
            const rid = resp.requestId || "";
            if (this.waitingMap.has(rid)) {
                this.waitingMap.get(rid)(resp);
                this.waitingMap.delete(rid);
                this.rejectMap.delete(rid);
            }
        }
    }

    closeAll(e) {
        this.rejectMap.forEach((rj) => {
            rj(e);
        });
        this.rejectMap.clear();
        this.waitingMap.clear();
    }

    /**
     * @param {string} query
     * @param {Record<string, any>} [variables={}]
     * @returns {Promise<GraphQLResponse | undefined>}
     */
    async request(query, variables = {}) {
        if (this.ws === null) {
            await this.open();
        }
        const rid = this.nextRequestId.toString();
        this.nextRequestId++;
        const requestBody = JSON.stringify({
            query,
            variables,
            requestId: rid,
        });
        const request = new Promise((rs, rj) => {
            this.waitingMap.set(rid, rs);
            this.rejectMap.set(rid, rj);
            this.ws.send(requestBody);
        });
        const timeout = (new Promise((res) => setTimeout(res, 1000))).then(() => undefined);
        return await Promise.race([request, timeout]);
    }

    /** @returns {Promise<boolean>} */
    async ping() {
        const resp = await this.request("query { ping }", {});
        return resp && resp.data && resp.data.ping === "pong";
    }
}
