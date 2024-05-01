import { doWithLoadingDialog, installDialogs, showAlertDialog } from "./components/vdialog.js";
import { gqlSocket } from "./utils/request.js";
import { MediaFile } from "./model/media_file.js";
import { Folder } from "./model/folder.js";

const testGraphQLSocket = async () => {
    const _task = async (i) => {
        const alive = await gqlSocket.ping();
        if (!alive) {
            console.log("not alive", i);
        }
    };
    const pms = [];
    const nums = 100;
    for (let i = 0; i < nums; i++) {
        pms.push(_task(i));
    }
    const label = `${nums}条ping请求并发`;
    console.time(label);
    await Promise.all(pms);
    console.timeEnd(label);
    window["ws"] = gqlSocket;
};

const testMediaFileAndFolder = async () => {
    // media file
    const media = new MediaFile("Albums/Splitting the Arrow/Adriel Fair - Lord of Dance.ogg");
    const label = `Read Media File`;
    console.log("Media Type:", await media.getMediaType());
    console.log("Media Size:", await media.getSize());
    console.time(label);
    const content = await media.getContent();
    console.timeEnd(label);
    console.log("Media Content Length", content.length);
    // folder
    const root = new Folder(""); // list root dir
    console.log("Sub Folder:", await root.getFolder());
    console.log("Sub Media:", await (await media.getFolder()).getMedia());
};

const audio = async () => {
    const actx = new AudioContext({
        latencyHint: "playback",
    });
    const media = new MediaFile("Albums/Splitting the Arrow/Adriel Fair - Lord of Dance.ogg");
    const audioData = await actx.decodeAudioData((await media.getContent()).buffer);
    const source = actx.createBufferSource();
    source.buffer = audioData;
    source.connect(actx.destination);
    source.start();
    // navigator.getAutoplayPolicy("audiocontext")
};

globalThis.addEventListener("load", async () => {
    installDialogs();
    doWithLoadingDialog(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await showAlertDialog("Start AudioContext Test");
        await audio();
    });
    // await testGraphQLSocket();
    await testMediaFileAndFolder();
});
