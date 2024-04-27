import { extname as path_extname } from "@std/path";
import { encodeBase64 } from "@std/encoding/base64";
import { convertToRealPath, getSafePathParts } from "../utils/path_convert.ts";

export const MEDIA_AUDIO_EXT = [
    // audio
    ".mp3",
    ".ogg",
    ".wav",
    ".flac",
    ".ape",
];
export const MEDIA_IMAGE_EXT = [
    // image
    ".gif",
    ".bmp",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
];
export const MEDIA_VIDEO_EXT = [
    // video
    ".mp4",
    ".avi",
    ".mkv",
    ".wmv",
    ".rmvb",
    ".webm",
    ".3gp",
];
export const MEDIA_EXT = [...MEDIA_AUDIO_EXT, ...MEDIA_IMAGE_EXT, ...MEDIA_VIDEO_EXT];
export type MediaTypeEnum = "OTHER" | "AUDIO" | "IMAGE" | "VIDEO";
interface MediaFileContentArguement {
    offset?: number;
    length?: number;
}

export class MediaFile {
    name: string;
    path: string;
    ext: string;
    constructor(pathString: string) {
        const pathParts = getSafePathParts(pathString);
        const basename = pathParts.at(-1) ? pathParts.at(-1)! : "";
        this.path = pathParts.join("/");
        this.ext = path_extname(this.path).toLocaleLowerCase();
        this.name = basename.substring(0, basename.length - this.ext.length);
    }

    async size() {
        try {
            const realPath = convertToRealPath(this.path);
            const info = await Deno.stat(realPath);
            return info.size;
        } catch {
            return -1;
        }
    }
    mediaType(): MediaTypeEnum {
        if (MEDIA_AUDIO_EXT.includes(this.ext)) {
            return "AUDIO";
        }
        if (MEDIA_IMAGE_EXT.includes(this.ext)) {
            return "IMAGE";
        }
        if (MEDIA_VIDEO_EXT.includes(this.ext)) {
            return "VIDEO";
        }
        return "OTHER";
    }
    async contentBase64(args: MediaFileContentArguement) {
        if (typeof args.offset !== "number") {
            args.offset = 0;
        }
        if (typeof args.length !== "number") {
            args.length = 4096;
        }
        if (args.length <= 0) {
            return undefined;
        } else if (args.length > 1048576) {
            args.length = 1048576; // limit length to 1M
        }
        let file: Deno.FsFile | undefined = undefined;
        try {
            const realPath = convertToRealPath(this.path);
            file = await Deno.open(realPath);
            await file.seek(args.offset, Deno.SeekMode.Start);
            const buf = new Uint8Array(args.length);
            const readBytes = await file.read(buf);
            if (readBytes != null && readBytes > 0) {
                const data = buf.subarray(0, readBytes);
                return encodeBase64(data);
            }
        } catch {
            // ignore error
        } finally {
            if (file != undefined) {
                file.close();
            }
        }
        return undefined;
    }
}

interface GetMediaFileArguement {
    path?: string;
}
export const getMediaFile = async (args: GetMediaFileArguement) => {
    if (typeof args.path !== "string") {
        return undefined;
    }
    const file = new MediaFile(args.path);
    if (file.mediaType() === "OTHER") {
        return undefined;
    }
    try {
        const realPath = convertToRealPath(file.path);
        const info = await Deno.stat(realPath);
        if (info.isFile) {
            return file;
        }
    } catch {
        // ignore error
    }
    return undefined;
};
