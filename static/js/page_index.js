import { doWithLoadingDialog, installDialogs, showAlertDialog } from "./components/vdialog.js";
import { GraphQLSocket } from "./utils/request.js";

globalThis.addEventListener("load", async () => {
    installDialogs();
    await doWithLoadingDialog(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await showAlertDialog("Start AudioContext Test");
    });
    const s = new GraphQLSocket();
    {
        const _task = async (i) => {
            const alive = await s.ping();
            if (!alive) {
                console.log("not alive", i);
            }
        };
        const pms = [];
        const nums = 10000;
        for (let i = 0; i < nums; i++) {
            pms.push(_task(i));
        }
        const label = `${nums}条ping请求并发`;
        console.time(label);
        await Promise.all(pms);
        console.timeEnd(label);
    }
    window["ws"] = s;
});
