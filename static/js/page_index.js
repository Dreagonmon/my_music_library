import { doWithLoadingDialog, installDialogs, showAlertDialog, updateDialogThemeStyle } from "./vdialog.js";

globalThis.addEventListener("load", async () => {
    updateDialogThemeStyle(); // update using global style
    installDialogs();
    doWithLoadingDialog(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        showAlertDialog("Hello Dragon");
    });
});
