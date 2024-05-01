import { gqlSocket } from "../utils/request.js";
import { AsyncData } from "../utils/async_data.js";
import { Folder } from "./folder.js";

const CONTENT_CHUNK_SIZE = 65536 * 8; // 64k x N

/**
 * @typedef {"OTHER"|"AUDIO"|"IMAGE"|"VIDEO"|"ANY"} MediaTypeEnum
 */
/**
 * @typedef MediaFileInfo
 * @property {string} name
 * @property {string} ext
 * @property {number} size
 * @property {MediaTypeEnum} mediaType
 * @property {Folder} folder
 */
/**
 * @typedef {Uint8Array} MediaFileContent
 */

const GQL_GET_MEDIA_FILE_INFO = /* GraphQL */ `query ($mediaPath: String!) {
    getMediaFile(path: $mediaPath) {
        name
        ext
        size
        mediaType
        folder {
            path
        }
    }
}`;
const GQL_GET_MEDIA_FILE_CONTENT = /* GraphQL */ `query ($mediaPath: String!, $offset: Int, $length: Int) {
    getMediaFile(path: $mediaPath) {
        contentBase64(offset: $offset, length: $length)
    }
}`;

/**
 * @param {string} path 
 * @param {number} offset 
 * @param {number} length 
 * @returns 
 */
const getFileContentPart = async (path, offset, length) => {
    const resp = await gqlSocket.request(
        GQL_GET_MEDIA_FILE_CONTENT,
        {
            mediaPath: path,
            offset,
            length, // 256k
        },
    );
    const dataB64 = resp.data.getMediaFile.contentBase64;
    const dataString = globalThis.atob(dataB64);
    const data = new Uint8Array(dataString.length);
    for (let i = 0; i < dataString.length; i++) {
        const byte = dataString.charCodeAt(i);
        data[i] = byte;
    }
    return data;
};

export class MediaFile {
    /** @type {string} */
    #path;
    /** @type {AsyncData<MediaFileInfo>} */
    #info;
    /** @type {AsyncData<MediaFileContent>} */
    #content;
    /**
     * @param {string} path
     */
    constructor(path) {
        this.#path = path;
        this.#info = new AsyncData(async () => {
            const resp = await gqlSocket.request(
                GQL_GET_MEDIA_FILE_INFO,
                {
                    mediaPath: this.#path,
                },
            );
            return {
                name: resp.data.getMediaFile.name,
                ext: resp.data.getMediaFile.ext,
                size: resp.data.getMediaFile.size,
                mediaType: resp.data.getMediaFile.mediaType,
                folder: new Folder(resp.data.getMediaFile.folder.path),
            };
        });
        this.#content = new AsyncData(async () => {
            const size = await this.getSize();
            const data = new Uint8Array(size);
            const pms = [];
            let offset;
            for (let offset = 0; offset < size; offset += CONTENT_CHUNK_SIZE) {
                pms.push(getFileContentPart(this.#path, offset, CONTENT_CHUNK_SIZE));
            }
            offset = 0;
            for (const part of (await Promise.all(pms))) {
                data.set(part, offset);
                offset += part.length;
            }
            return data;
        });
    }

    async getPath() {
        return await Promise.resolve(this.#path);
    }

    async getName() {
        return (await this.#info.getData())?.name ?? "";
    }

    async getSize() {
        return (await this.#info.getData())?.size ?? -1;
    }

    async getFolder() {
        return (await this.#info.getData())?.folder ?? null;
    }

    /**
     * @returns {Promise<MediaTypeEnum>}
     */
    async getMediaType() {
        return (await this.#info.getData())?.mediaType ?? "ANY";
    }

    async getContent() {
        return (await this.#content.getData()) ?? new Uint8Array(0);
    }
}
