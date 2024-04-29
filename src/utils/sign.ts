import { encodeHex } from "@std/encoding/hex";
import { get_config } from "../global_cfg.ts";

/**
 * Generate HMAC-SHA512 sign
 */
export const generateSign = async (token: string, unixSecs: string, content: string) => {
    const encoder = new TextEncoder();
    const keyBinary = encoder.encode(token);
    const contentBinary = encoder.encode(content + unixSecs);
    const key = await crypto.subtle.importKey(
        "raw",
        keyBinary,
        {
            name: "HMAC",
            hash: "SHA-512",
        },
        false,
        ["sign"],
    );
    const signBuffer = await crypto.subtle.sign("HMAC", key, contentBinary);
    const signBinary = new Uint8Array(signBuffer);
    return encodeHex(signBinary).toUpperCase();
};
