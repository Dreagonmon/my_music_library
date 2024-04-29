import * as path from "@std/path";
import { bundle } from "@deno/emit";

const walkDirFixTypes = async (dirPath: string) => {
    for await (const item of Deno.readDir(dirPath)) {
        const itemPath = path.join(dirPath, item.name);
        if (item.isFile) {
            if (item.name.endsWith(".js") || item.name.endsWith(".d.ts")) {
                // keep file
                if (item.name.endsWith(".js")) {
                    // process dts files
                    const content = new TextDecoder().decode(await Deno.readFile(itemPath));
                    const newContent = content.replaceAll("process.env.NODE_ENV", "\'\'");
                    await Deno.writeFile(itemPath, new TextEncoder().encode(newContent));
                } else if (item.name.endsWith(".d.ts")) {
                    // process dts files
                    const content = new TextDecoder().decode(await Deno.readFile(itemPath));
                    const newContent = content.replaceAll(".js", ".d.ts");
                    await Deno.writeFile(itemPath, new TextEncoder().encode(newContent));
                }
            } else {
                await Deno.remove(itemPath);
            }
        } else if (item.isDirectory) {
            await walkDirFixTypes(itemPath);
        }
    }
};

const bundleSource = async (nanostoresDir: string) => {
    const { code, map } = await bundle(
        path.join(nanostoresDir, "index.js"),
        {
            minify: true,
            type: "module",
        },
    );
    await Deno.writeFile(
        path.join(nanostoresDir, "index.js"),
        new TextEncoder().encode(code),
    );
};

const walkDirDeleteOthers = async (nanostoresDir: string, dirPath: string) => {
    let dirFiles = 0;
    for await (const item of Deno.readDir(dirPath)) {
        const itemPath = path.join(dirPath, item.name);
        if (item.isFile) {
            if (item.name.endsWith(".js")) {
                if (nanostoresDir !== dirPath || item.name !== "index.js") {
                    await Deno.remove(itemPath);
                } else {
                    // keep index.js
                    dirFiles += 1;
                }
            } else if (item.name.endsWith(".d.ts")) {
                // keep type files
                dirFiles += 1;
            } else {
                await Deno.remove(itemPath);
            }
        } else if (item.isDirectory) {
            await walkDirDeleteOthers(nanostoresDir, itemPath);
        }
    }
    if (dirFiles <= 0) {
        await Deno.remove(dirPath);
    }
};

const __main__ = async () => {
    const nanostoresDir = Deno.args[0];
    console.log(nanostoresDir);
    await walkDirFixTypes(nanostoresDir);
    await bundleSource(nanostoresDir);
    await walkDirDeleteOthers(nanostoresDir, nanostoresDir);
};

if (import.meta.main) {
    __main__();
}
