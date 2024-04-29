import {
    DEFAULTL_CONFIG_FILE,
    get_accessed_env_list,
    get_default_config_file_path,
    load_config,
} from "../src/global_cfg.ts";
import * as path from "@std/path";
import { copy } from "@std/fs";

// x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu,
// x86_64-pc-windows-msvc, x86_64-apple-darwin, aarch64-apple-darwin
const DEFAULT_TARGET_PLATFORM = "x86_64-unknown-linux-gnu";
const SRC_ENTRY = path.resolve(import.meta.dirname!, "..", "src", "main.ts");
const BUILD_DIR = path.resolve(import.meta.dirname!, "..", "build");
const STATIC_SOURCE_DIR = path.resolve(import.meta.dirname!, "..", "static");
const BUILD_TARGET = path.join(BUILD_DIR, "my_music_library");
const TARGET_DATA_DIR = path.join(BUILD_DIR, "data");
const TARGET_STATIC_DIR = path.join(BUILD_DIR, "static");
const TARGET_CONFIG_FILE = path.join(TARGET_DATA_DIR, DEFAULTL_CONFIG_FILE);

const __main__ = async () => {
    // init config
    console.log("Start Build");
    const cfg = await load_config();
    const env_list = get_accessed_env_list();
    let target_platform = DEFAULT_TARGET_PLATFORM;
    if (Deno.args.length > 0) {
        target_platform = Deno.args[0];
    }
    let build_target = BUILD_TARGET;
    if (target_platform == "x86_64-pc-windows-msvc") {
        build_target += ".exe";
    }
    // command compile
    console.log("Compile Source:", SRC_ENTRY);
    await Deno.mkdir(BUILD_DIR, { recursive: true });
    const DENO_EXEC = Deno.execPath();
    const args = [
        "compile",
        "--allow-env=" + env_list.join(","),
        "--deny-env=NODE_ENV",
        "--allow-net=" + cfg.host + ":" + cfg.port,
        "--allow-read=.," + cfg.data_dir + "," + cfg.library_path,
        "--allow-write=" + cfg.data_dir,
        "--target",
        target_platform,
        "--output",
        build_target,
        SRC_ENTRY,
    ];
    const cmd = new Deno.Command(DENO_EXEC, { args });
    const proc = cmd.spawn();
    const { code } = await proc.output();
    console.assert(code === 0);
    // copy data folder
    const config_file_path = get_default_config_file_path();
    console.log("Copy Config File:", config_file_path);
    try {
        await Deno.mkdir(TARGET_DATA_DIR, { recursive: true });
        await Deno.copyFile(config_file_path, TARGET_CONFIG_FILE);
    } catch {
        console.log();
        console.error("!! Failed to Cpoy:", config_file_path);
        Deno.exit(-999);
    }
    // copy static folder
    console.log("Copy Static Files:", STATIC_SOURCE_DIR);
    try {
        await Deno.remove(TARGET_STATIC_DIR, { recursive: true });
    } catch {
        // ignore file doesn't exist
    }
    try {
        await Deno.mkdir(TARGET_STATIC_DIR, { recursive: true });
        await copy(STATIC_SOURCE_DIR, TARGET_STATIC_DIR, { overwrite: true, preserveTimestamps: true });
    } catch {
        console.log();
        console.error("!! Failed to Cpoy:", TARGET_STATIC_DIR);
        Deno.exit(-999);
    }
};

if (import.meta.main) {
    await __main__();
    console.log("Build Finished.");
    console.log();
}
