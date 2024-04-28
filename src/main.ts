import { graphql } from "graphql";
import { serveDir } from "@std/http";
import { load_config } from "./global_cfg.ts";
import { root, schema } from "./gql/schema.ts";

let server: Deno.HttpServer | null = null;

const handler: Deno.ServeHandler = async (req, _info) => {
    const url = new URL(req.url);
    // websocket
    if (url.pathname === "/gql_ws") {
        const { socket, response } = Deno.upgradeWebSocket(req);
        // TODO: register handler to ws.
        return response;
    } else if (url.pathname === "/gql") {
        //
    }
    // static server
    if (url.pathname.startsWith("/static")) {
        return serveDir(req, {
            fsRoot: "./static",
            urlRoot: "static",
        });
    } else if (url.pathname === "/") {
        return new Response("", { status: 301, headers: { "Location": "/static/index.html" } })
    }
    // fallback
    return new Response("Bad Request", { status: 400 });
};

const __main__ = async () => {
    // init config
    const cfg = await load_config();
    // start server
    server = Deno.serve({ hostname: cfg.host, port: Number.parseInt(cfg.port) }, handler);
};

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    await __main__();
}
