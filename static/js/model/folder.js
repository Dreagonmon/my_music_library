import { gqlSocket } from "../utils/request.js";
import { AsyncData } from "../utils/async_data.js";
import { MediaFile } from "./media_file.js";

/**
 * @typedef {import("./media_file.js").MediaTypeEnum} MediaTypeEnum
 */
/**
 * @typedef FolderInfo
 * @property {string} name
 * @property {Array<MediaFile>} media
 * @property {Array<Folder>} folder
 */

const GQL_GET_FOLDER_INFO = /* GraphQL */ `query ($folderPath: String) {
    getFolder(path: $folderPath) {
        name
        media {
            path
        }
        folder {
            path
        }
    }
}`;

export class Folder {
    /** @type {string} */
    #path;
    /** @type {AsyncData<FolderInfo>} */
    #info;
    /**
     * @param {string} [path=""]
     */
    constructor(path = "") {
        this.#path = path;
        this.#info = new AsyncData(async () => {
            const resp = await gqlSocket.request(
                GQL_GET_FOLDER_INFO,
                {
                    folderPath: this.#path,
                },
            );
            return {
                name: resp.data.getFolder.name,
                media: resp.data.getFolder.media.map((media) => new MediaFile(media.path)),
                folder: resp.data.getFolder.folder.map((folder) => new Folder(folder.path)),
            };
        });
    }

    async getPath() {
        return await Promise.resolve(this.#path);
    }

    async getName() {
        return (await this.#info.getData())?.name ?? "";
    }

    async getFolder() {
        return (await this.#info.getData())?.folder ?? [];
    }
    
    async getMedia() {
        return (await this.#info.getData())?.media ?? [];
    }
}
