import { doWithLoadingDialog, installDialogs, showAlertDialog } from "./components/vdialog.js";
import { GraphQLSocket } from "./utils/request.js";

globalThis.addEventListener("load", async () => {
    installDialogs();
    doWithLoadingDialog(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        showAlertDialog("Hello Dragon");
    });
    const s = new GraphQLSocket();
    const resp = await s.ping();
    console.log(resp);
    window["ws"] = s;
});
