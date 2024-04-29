import { graphql } from "graphql";
import { get_config, load_config } from "./global_cfg.ts";
import { root, schema } from "./gql/schema.ts";
import { generateSign } from "./utils/sign.ts";
import { serveDir } from "@std/http/file-server";

interface RequestContent {
    requestId?: string;
    query?: string;
    variables?: Record<string, unknown>;
}

const checkSignAndGetRequest = async (req: Request, postBodyText: string | undefined = undefined) => {
    const cfg = get_config();
    const url = new URL(req.url);
    if (url.pathname === "/graphql_ws") {
        const tm = url.searchParams.get("Timestamp") ?? "";
        const bodyText = url.searchParams.get("Content") ?? "";
        const sign = url.searchParams.get("Sign") ?? "";
        const genSign = await generateSign(cfg.access_token, tm, bodyText);
        if (sign === genSign) {
            return { pass: true } as RequestContent;
        }
    } else if (req.method === "GET") {
        const sign = req.headers.get("Sign") ?? "";
        const tm = req.headers.get("Timestamp") ?? "";
        const genSign = await generateSign(cfg.access_token, tm, url.search);
        if (sign === genSign) {
            return {
                query: url.searchParams.get("query") ?? "{}",
                variables: JSON.parse(url.searchParams.get("variables") ?? "{}"),
            } as RequestContent;
        }
    } else if (req.method === "POST") {
        if (!postBodyText) {
            postBodyText = await req.text();
        }
        const sign = req.headers.get("Sign") ?? "";
        const tm = req.headers.get("Timestamp") ?? "";
        const genSign = await generateSign(cfg.access_token, tm, postBodyText);
        if (sign === genSign) {
            return (JSON.parse(postBodyText)) as RequestContent;
        }
    }
    return undefined;
};

const responseGraphQLResult = (responseData: unknown) => {
    return new Response(
        JSON.stringify(responseData),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
};

const processHttpGraphQLRequestNoAccess = async (requestContent: RequestContent) => {
    const response = await graphql({
        schema,
        source: requestContent?.query ?? "",
        variableValues: requestContent?.variables,
        rootValue: {}, // empty root value
    });
    return responseGraphQLResult(response);
};

const processHttpGraphQLRequest = async (requestContent: RequestContent) => {
    const response = await graphql({
        schema,
        source: requestContent?.query ?? "",
        variableValues: requestContent?.variables,
        rootValue: root,
    });
    return responseGraphQLResult({ ...response, requestId: requestContent?.requestId ?? "" });
};

const initWebSocketConnection = (socket: WebSocket) => {
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {};
    socket.onmessage = async (e) => {
        const data = e.data;
        if (typeof data === "string") {
            const requestContent = JSON.parse(data) as RequestContent;
            const response = await graphql({
                schema,
                source: requestContent?.query ?? "",
                variableValues: requestContent?.variables,
                rootValue: root,
            });
            socket.send(JSON.stringify({ ...response, requestId: requestContent?.requestId ?? "" }));
        }
    };
    socket.onclose = () => console.log("WebSocket has been closed.");
    socket.onerror = (e) => console.error("WebSocket error:", e);
    // TODO: register handler to ws.
};

const handler: Deno.ServeHandler = async (req, _info) => {
    const url = new URL(req.url);
    if (url.pathname === "/graphql_ws") {
        // websocket
        const requestContent = await checkSignAndGetRequest(req);
        if (!requestContent) {
            return new Response("Forbidden", { status: 403 });
        }
        const { socket, response } = Deno.upgradeWebSocket(req, { idleTimeout: 30 });
        // init socket
        initWebSocketConnection(socket);
        return response;
    } else if (url.pathname === "/graphql") {
        // http
        const postBodyText = await req.text();
        const requestContent = await checkSignAndGetRequest(req, postBodyText);
        if (!requestContent) {
            // allow other tools inspect graphql schema
            if (req.method === "GET") {
                const tempReq = {
                    query: url.searchParams.get("query") ?? "{}",
                    variables: JSON.parse(url.searchParams.get("variables") ?? "{}"),
                };
                return await processHttpGraphQLRequestNoAccess(tempReq);
            } else if (req.method === "POST") {
                const tempReq = JSON.parse(postBodyText);
                return await processHttpGraphQLRequestNoAccess(tempReq);
            }
            return new Response("Forbidden", { status: 403 });
        }
        return await processHttpGraphQLRequest(requestContent);
    }
    // static server
    if (url.pathname.startsWith("/static")) {
        return serveDir(req, {
            fsRoot: "./static",
            urlRoot: "static",
        });
    } else if (url.pathname === "/") {
        return new Response("", { status: 301, headers: { "Location": "/static/index.html" } });
    }
    // fallback
    return new Response("Bad Request", { status: 400 });
};

const __main__ = async () => {
    // init config
    const cfg = await load_config();
    // start server
    const server = Deno.serve({ hostname: cfg.host, port: Number.parseInt(cfg.port) }, handler);
};

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    await __main__();
}
