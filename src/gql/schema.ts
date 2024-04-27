import { buildSchema } from "graphql";
import { getFolder } from "./folder.ts";
import { getMediaFile } from "./media_file.ts";

export const schema = buildSchema(
    /* GraphQL */ `
schema {
    query: Query
}

type Query {
    getFolder(path: String = ""): FolderType
    getMediaFile(path: String!): MediaFileType
}

enum MediaTypeEnum { 
  OTHER
  AUDIO
  IMAGE
  VIDEO
}

type MediaFileType {
    name: String
    path: String
    ext: String
    size: Int
    mediaType: MediaTypeEnum
    contentBase64(offset: Int = 0, length: Int = 4096): String
}

type FolderType {
    name: String
    path: String
    media: [MediaFileType]
    folder: [FolderType]
}
`,
    {
        assumeValidSDL: true,
    },
);

export const root = {
    getFolder,
    getMediaFile,
};
