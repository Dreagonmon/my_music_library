import { buildSchema } from "graphql";
import { getFolder } from "./folder.ts";
import { getMediaFile } from "./media_file.ts";

export const schema = buildSchema(
    /* GraphQL */ `
schema {
    query: Query
}

type Query {
    ping: String
    getFolder(path: String = ""): FolderType
    getMediaFile(path: String!): MediaFileType
}

enum MediaTypeEnum { 
  OTHER
  AUDIO
  IMAGE
  VIDEO
  ANY
}

type MediaFileType {
    name: String
    path: String
    ext: String
    size: Int
    mediaType: MediaTypeEnum
    contentBase64(offset: Int = 0, length: Int = 4096): String
    folder: FolderType
}

type FolderType {
    name: String
    path: String
    media(mediaType: MediaTypeEnum = ""): [MediaFileType]
    folder: [FolderType]
}

type PlayList {
    name: String
    config: String
    media: [MediaFileType]
}
`,
    {
        assumeValidSDL: true,
    },
);

export const root = {
    ping: "pong",
    getFolder,
    getMediaFile,
};
