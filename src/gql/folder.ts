import { extname as path_extname } from "@std/path";
import { convertToRealPath, getSafePathParts, joinVirtualPath } from "../utils/path_convert.ts";
import { MediaFile, MEDIA_EXT } from "./media_file.ts";

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

    async media() {
        const files = [] as Array<MediaFile>;
        const pathParts = getSafePathParts(this.path);
        try {
            const realPath = convertToRealPath(this.path);
            for await (const item of Deno.readDir(realPath)) {
                const ext = path_extname(item.name).toLocaleLowerCase();
                if (item.isFile && MEDIA_EXT.includes(ext)) {
                    const virtualPath = joinVirtualPath(...pathParts, item.name);
                    files.push(new MediaFile(virtualPath));
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
