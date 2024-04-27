import { extname as path_extname } from "@std/path";
import { convertToRealPath, getSafePathParts, joinVirtualPath } from "../utils/path_convert.ts";
import { MEDIA_EXT, MediaFile, MediaTypeEnum } from "./media_file.ts";

interface FolderMediaArguement {
    mediaType?: MediaTypeEnum;
}
export class Folder {
    name: string;
    path: string;
    constructor(pathString: string) {
        const pathParts = getSafePathParts(pathString);
        this.name = pathParts.at(-1) ? pathParts.at(-1)! : "";
        this.path = pathParts.join("/");
    }

    async folder() {
        const dirs = [] as Array<Folder>;
        const pathParts = getSafePathParts(this.path);
        try {
            const realPath = convertToRealPath(this.path);
            for await (const item of Deno.readDir(realPath)) {
                if (item.isDirectory) {
                    const virtualPath = joinVirtualPath(...pathParts, item.name);
                    dirs.push(new Folder(virtualPath));
                }
            }
        } catch {
            // ignore errors
        }
        return dirs;
    }

    async media(args: FolderMediaArguement) {
        if (typeof args.mediaType !== "string") {
            args.mediaType = "ANY";
        }
        const files = [] as Array<MediaFile>;
        const pathParts = getSafePathParts(this.path);
        try {
            const realPath = convertToRealPath(this.path);
            for await (const item of Deno.readDir(realPath)) {
                const ext = path_extname(item.name).toLocaleLowerCase();
                if (item.isFile && MEDIA_EXT.includes(ext)) {
                    const virtualPath = joinVirtualPath(...pathParts, item.name);
                    const mediaFile = new MediaFile(virtualPath);
                    if (args.mediaType === "ANY" || args.mediaType === mediaFile.mediaType()) {
                        files.push(mediaFile);
                    }
                }
            }
        } catch {
            // ignore errors
        }
        return files;
    }
}

interface GetFolderArguement {
    path?: string;
}
export const getFolder = async (args: GetFolderArguement) => {
    if (typeof args.path !== "string") {
        args.path = "";
    }
    const dir = new Folder(args.path);
    try {
        const realPath = convertToRealPath(dir.path);
        const info = await Deno.stat(realPath);
        if (info.isDirectory) {
            return dir;
        }
    } catch {
        // ignore error
    }
    return undefined;
};
