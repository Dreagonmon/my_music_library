import { graphql } from "graphql";
import { load_config } from "./global_cfg.ts";
import { root, schema } from "./gql/schema.ts";

const __main__ = async () => {
    // init config
    await load_config();
    //
};

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    await __main__();
}
