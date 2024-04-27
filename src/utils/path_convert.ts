import { get_config } from "../global_cfg.ts";
import { join as path_join } from "@std/path";

export const getSafePathParts = (virtualPath: string) => {
    return virtualPath.split("/").filter((part) => {
        if (part.length <= 0 || part === ".." || part === ".") {
            return false;
        }
        return true;
    });
};

export const joinVirtualPath = (...parts: string[]) => {
    return parts.join("/");
}

export const convertToRealPath = (virtualPath: string) => {
    const cfg = get_config();
    const pathParts = getSafePathParts(virtualPath);
    return path_join(cfg.library_path, ...pathParts);
};
