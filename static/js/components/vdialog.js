import { generateRandomTemplateTag, removeStyleHidden } from "./css_utils.js";

const P = generateRandomTemplateTag();

const dialogVariableSheet = new CSSStyleSheet();
dialogVariableSheet.replaceSync(P`
* {
    --↦-dialog-bg-color: var(--dialog-bg-color, #FFF);
    --↦-dialog-text-color: var(--dialog-text-color, #000);
    --↦-dialog-border-color: var(--dialog-border-color, #000);
    --↦-dialog-button-bg-color: var(--dialog-button-bg-color, var(--↦-dialog-border-color));
    --↦-dialog-button-text-color: var(--dialog-button-text-color, var(--↦-dialog-bg-color));
    --↦-dialog-border-radius: var(--dialog-border-radius, 1rem);
    --↦-dialog-border-width: var(--dialog-border-width, 0.25rem);
    --↦-dialog-text-padding: var(--dialog-text-padding, 1rem);
}
`);
const dialogSheet = new CSSStyleSheet();
dialogSheet.replaceSync(P`
.↦-dialog {
    border: none;
    position: fixed;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.25);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.↦-dialog,
.↦-dialog * {
    box-sizing: border-box;
    margin: 0;
}

.↦-dialog.↦-dialog-hidden {
    display: none;
}

.↦-dialog .↦-dialog-outter {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.↦-dialog .↦-dialog-inner {
    width: fit-content;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    align-items: center;
}

.↦-dialog .↦-dialog-content {
    background-color: var(--↦-dialog-bg-color);
    color: var(--↦-dialog-text-color);
    max-width: 100%;
    max-height: 100%;
    border: var(--↦-dialog-border-color) var(--↦-dialog-border-width) solid;
    border-radius: var(--↦-dialog-border-radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.↦-dialog .↦-dialog-message {
    flex: 1 1 auto;
    padding: var(--↦-dialog-text-padding);
    color: var(--↦-dialog-text-color);
    overflow: hidden;
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: anywhere;
}

.↦-dialog .↦-dialog-button {
    flex: 0 0 auto;
    padding: calc(var(--↦-dialog-text-padding) - var(--↦-dialog-border-width));
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    border: none;
    border-radius: 0;
    background-color: var(--↦-dialog-button-bg-color);
    color: var(--↦-dialog-button-text-color);
}
`);

export class VDialog extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add(P`↦-dialog`);
        this.classList.add(P`↦-dialog-hidden`);
        // remove hide style
        removeStyleHidden(this.style);
        // prepare components
        const fragment = document.createDocumentFragment();
        const divOutter = document.createElement("div");
        divOutter.classList.add(P`↦-dialog-outter`);
        fragment.append(divOutter);
        const divInner = document.createElement("div");
        divInner.classList.add(P`↦-dialog-inner`);
        divOutter.append(divInner);
        const divContent = document.createElement("div");
        divContent.classList.add(P`↦-dialog-content`);
        divInner.append(divContent);
        // process children
        while (this.firstChild) {
            divContent.appendChild(this.firstChild);
        }
        this.contentElement = divContent;
        // add all
        this.append(fragment);
    }

    show() {
        if (this.classList.contains(P`↦-dialog-hidden`)) {
            this.classList.remove(P`↦-dialog-hidden`);
        }
    }

    hide() {
        if (!this.classList.contains(P`↦-dialog-hidden`)) {
            this.classList.add(P`↦-dialog-hidden`);
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
        this.contentElement.classList.add(P`↦-dialog-message`);
        this.contentElement.append("Loading");
    }
}

export class VAlertDialog extends VDialog {
    constructor() {
        super();
        /** @type {(() => void) | undefined} */
        this.alertResolve = undefined;
        const preMessage = document.createElement("pre");
        preMessage.classList.add(P`↦-dialog-message`);
        this.contentElement.append(preMessage);
        const buttonOk = document.createElement("button");
        buttonOk.classList.add(P`↦-dialog-button`);
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

// attach stylesheet to document
(() => {
    document.adoptedStyleSheets.push(dialogVariableSheet);
    document.adoptedStyleSheets.push(dialogSheet);
    // define
    customElements.define("v-dialog", VDialog, { extends: "div" });
    customElements.define("v-loading-dialog", VLoadingDialog, { extends: "div" });
    customElements.define("v-alert-dialog", VAlertDialog, { extends: "div" });
})();

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
/*
<!-- Loading Dialog -->
<div class="dialog dialog-hidden" id="dialog_loading">
    <div class="dialog-outter">
        <div class="dialog-inner">
            <div class="dialog-content dialog-message">
                Loading...
            </div>
        </div>
    </div>
</div>
<div class="dialog dialog-hidden" id="dialog_alert">
    <div class="dialog-outter">
        <div class="dialog-inner">
            <div class="dialog-content">
                <pre class="dialog-message">Message</pre>
                <button class="dialog-button">
                    OK
                </button>
            </div>
        </div>
    </div>
</div>
*/
