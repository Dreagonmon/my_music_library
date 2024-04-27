import { graphql } from "graphql";
import { load_config } from "../src/global_cfg.ts";
import { root, schema } from "../src/gql/schema.ts";

const __main__ = async () => {
    // init config
    await load_config();
    // const cfg = await load_config();
    // console.log(cfg);

    const response = await graphql({
        schema,
        source: `
        query {
            getFolder(path: "Albums/Splitting the Arrow") {
                name
                path
                media {
                    name
                    size
                    mediaType
                }
            }
            getMediaFile(path: "Albums/Splitting the Arrow/Adriel Fair - Lord of Dance.ogg") {
                name
                contentBase64(offset: 24, length: 24)
            }
        }
        `,
        rootValue: root,
    });
    console.log(response.data);
};

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    await __main__();
}
