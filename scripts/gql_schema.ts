import { printSchema } from "graphql";
import { schema } from "../src/gql/schema.ts";

interface ResolveFolderContentArgument {
    path?: string;
}

if (import.meta.main) {
    const schemaText = printSchema(schema);
    console.log(schemaText);
}

