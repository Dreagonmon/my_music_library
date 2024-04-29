import { persistentAtom } from "../libs/nanostores-persistent/index.js";

/** @type {import("../libs/nanostores/index.d.ts").WritableAtom<string>} */
export const requestTokenAtom = persistentAtom("requestToken", "");
/** @type {import("../libs/nanostores/index.d.ts").WritableAtom<string>} */
export const requestGraphQLEndpointAtom = persistentAtom("requestGraphQLEndpoint", "/graphql");
/** @type {import("../libs/nanostores/index.d.ts").WritableAtom<string>} */
export const requestGraphQLWebSocketEndpointAtom = persistentAtom("requestGraphQLWebSocketEndpointAtom", "/graphql_ws");
