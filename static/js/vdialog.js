import { mergeGlobalVariablesFromDocument } from "./css_utils.js";

const dialogVariableSheet = new CSSStyleSheet();
dialogVariableSheet.replaceSync(`
* {
    --dialog-bg-color: #FFF;
    --dialog-text-color: #000;
    --dialog-border-color: #000;
    --dialog-button-bg-color: var(--dialog-border-color);
    --dialog-button-text-color: var(--dialog-bg-color);
    --dialog-border-radius: 1rem;
    --dialog-border-width: 0.25rem;
    --dialog-text-padding: 1rem;
}
`);
const dialogSheet = new CSSStyleSheet();
dialogSheet.replaceSync(`
.dialog {
    border: none;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.25);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.dialog,
.dialog * {
    box-sizing: border-box;
    margin: 0;
}

.dialog.dialog_hidden {
    display: none;
}

.dialog .dialog_outter {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dialog .dialog_inner {
    width: fit-content;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    align-items: center;
}

.dialog .dialog_inner * {
    background-color: var(--dialog-bg-color, #FFF);
    color: var(--dialog-text-color, #000);
}

.dialog .dialog_content {
    max-width: 100%;
    max-height: 100%;
    border: var(--dialog-border-color, #000) var(--dialog-border-width, 0.25rem) solid;
    border-radius: var(--dialog-border-radius, 1rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.dialog .dialog_message {
    flex: 1 1 auto;
    padding: var(--dialog-text-padding, 1rem);
    color: var(--dialog-text-color, #000);
    overflow: hidden;
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: anywhere;
}

.dialog .dialog_button {
    flex: 0 0 auto;
    padding: calc(var(--dialog-text-padding, 1rem) - var(--dialog-border-width, 0.25rem));
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    border: none;
    background-color: var(--dialog-button-bg-color, var(--dialog-border-color, #000));
    color: var(--dialog-button-text-color, var(--dialog-bg-color, #FFF));
}
`);

export class VDialog extends HTMLDivElement {
    constructor() {
        super();
        // root element style
        this.style.position = "fixed";
        this.style.top = "0";
        this.style.left = "0";
        const root = this.attachShadow({ mode: "open", delegatesFocus: true });
        root.adoptedStyleSheets = [dialogVariableSheet, dialogSheet];
        const divDialog = document.createElement("div");
        divDialog.classList.add("dialog");
        divDialog.classList.add("dialog_hidden");
        root.append(divDialog);
        const divOutter = document.createElement("div");
        divOutter.classList.add("dialog_outter");
        divDialog.append(divOutter);
        const divInner = document.createElement("div");
        divInner.classList.add("dialog_inner");
        divOutter.append(divInner);
        const divContent = document.createElement("div");
        divContent.classList.add("dialog_content");
        divInner.append(divContent);
        this.dialogElement = divDialog;
        this.contentElement = divContent;
    }

    show() {
        if (this.dialogElement.classList.contains("dialog_hidden")) {
            this.dialogElement.classList.remove("dialog_hidden");
        }
    }

    hide() {
        if (!this.dialogElement.classList.contains("dialog_hidden")) {
            this.dialogElement.classList.add("dialog_hidden");
        }
    }

    doWithDialogOpen = async (task) => {
        this.show();
        try {
            const result = task();
            if (result instanceof Promise) {
                return await result;
            } else {
                return result;
            }
        } finally {
            this.hide();
        }
    };
}

export class VLoadingDialog extends VDialog {
    constructor() {
        super();
        this.contentElement.classList.add("dialog_message");
        this.contentElement.append("Loading");
    }
}

export class VAlertDialog extends VDialog {
    constructor() {
        super();
        /** @type {(() => void) | undefined} */
        this.alertResolve = undefined;
        const preMessage = document.createElement("pre");
        preMessage.classList.add("dialog_message");
        this.contentElement.append(preMessage);
        const buttonOk = document.createElement("button");
        buttonOk.classList.add("dialog_button");
        buttonOk.innerText = "OK";
        buttonOk.onclick = (() => {
            this.hide();
            if (this.alertResolve instanceof Function) {
                this.alertResolve();
            }
        }).bind(this);
        this.messageElement = preMessage;
        this.contentElement.append(buttonOk);
    }

    alert(msg) {
        return new Promise((resolve) => {
            this.alertResolve = resolve;
            this.messageElement.innerText = msg;
            this.show();
        });
    }
}

// define
customElements.define("v-dialog", VDialog, { extends: "div" });
customElements.define("v-loading-dialog", VLoadingDialog, { extends: "div" });
customElements.define("v-alert-dialog", VAlertDialog, { extends: "div" });

const globalLoadingDialog = new VLoadingDialog();
const globalAlertDialog = new VAlertDialog();

/**
 * Insert default dialog element to document body.
 */
export const installDialogs = () => {
    document.body.append(globalLoadingDialog);
    document.body.append(globalAlertDialog);
};

export const doWithLoadingDialog = globalLoadingDialog.doWithDialogOpen.bind(globalLoadingDialog);
export const showAlertDialog = globalAlertDialog.alert.bind(globalAlertDialog);

/**
 * Update style with global variables.
 * * --dialog-bg-color: #FFF;
 * * --dialog-text-color: #000;
 * * --dialog-border-color: #000;
 * * --dialog-button-bg-color: var(--dialog-border-color);
 * * --dialog-button-text-color: var(--dialog-bg-color);
 * * --dialog-border-radius: 1rem;
 * * --dialog-border-width: 0.25rem;
 * * --dialog-text-padding: 1rem;
 */
export const updateDialogThemeStyle = () => {
    mergeGlobalVariablesFromDocument(dialogVariableSheet);
};

/*
<!-- Loading Dialog -->
<div class="dialog dialog_hidden" id="dialog_loading">
    <div class="dialog_outter">
        <div class="dialog_inner">
            <div class="dialog_content dialog_message">
                Loading...
            </div>
        </div>
    </div>
</div>
<div class="dialog dialog_hidden" id="dialog_alert">
    <div class="dialog_outter">
        <div class="dialog_inner">
            <div class="dialog_content">
                <pre class="dialog_message">Message</pre>
                <button class="dialog_button">
                    OK
                </button>
            </div>
        </div>
    </div>
</div>
*/
