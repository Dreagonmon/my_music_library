import * as path from "@std/path";

interface GlobalConfig {
    access_token: string;
    library_path: string;
    data_dir: string;
    host: string;
    port: string;
}
type GlobalConfigAttribute = keyof GlobalConfig;
export const DEFAULTL_CONFIG_FILE = "mmlconfig.json";
const DEFAULT_CONFIG: GlobalConfig = {
    access_token: "",
    library_path: "",
    data_dir: "data",
    host: "0.0.0.0",
    port: "8080",
};

let cfg: GlobalConfig = DEFAULT_CONFIG;

export const load_config = async () => {
    let data: GlobalConfig = { ...DEFAULT_CONFIG };
    // read from env
    for (const eattr in DEFAULT_CONFIG) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, eattr)) {
            continue;
        }
        const env_name = "MML_" + eattr.toUpperCase();
        if ((await Deno.permissions.request({ name: "env", variable: env_name })).state == "granted") {
            const env_var = Deno.env.get(env_name);
            if (env_var != undefined) {
                data[eattr as GlobalConfigAttribute] = env_var;
            }
        }
    }
    // read from file
    try {
        const decoder = new TextDecoder("utf-8");
        const config_file_path = path.resolve(data.data_dir, DEFAULTL_CONFIG_FILE);
        const data_json = decoder.decode(await Deno.readFile(config_file_path));
        data = { ...data, ...JSON.parse(data_json) };
    } catch {
        // ignore
    }
    cfg = data;
    return data;
};

export const get_config = () => {
    return cfg;
};

export const get_accessed_env_list = () => {
    const list = [];
    for (const eattr in DEFAULT_CONFIG) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, eattr)) {
            continue;
        }
        const env_name = "MML_" + eattr.toUpperCase();
        list.push(env_name);
    }
    return list;
};

export const get_default_config_file_path = () => {
    const data: GlobalConfig = { ...DEFAULT_CONFIG };
    // read from env
    for (const eattr in ["data_dir"]) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, eattr)) {
            continue;
        }
        const env_name = "MML_" + eattr.toUpperCase();
        if ((Deno.permissions.requestSync({ name: "env", variable: env_name })).state == "granted") {
            const env_var = Deno.env.get(env_name);
            if (env_var != undefined) {
                data[eattr as GlobalConfigAttribute] = env_var;
            }
        }
    }
    return path.join(data.data_dir, DEFAULTL_CONFIG_FILE);
};
