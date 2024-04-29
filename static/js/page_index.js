import { doWithLoadingDialog, installDialogs, showAlertDialog } from "./vdialog.js";

globalThis.addEventListener("load", async () => {
    installDialogs();
    doWithLoadingDialog(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        showAlertDialog("Hello Dragon");
        document.querySelector("v-dialog").show();
    });
});
