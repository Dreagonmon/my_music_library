/**
 * @template T
 */
export class AsyncData {
    /** @typedef {() => Promise<T>} DataLoader */
    /** @type {T|null} */
    #data = null;
    /** @type {boolean} */
    #isLoaded = false;
    /** @type {Promise<T|null> | null} */
    #waitLoadingPromise = null;
    /** @type {DataLoader} */
    #loader;
    /**
     * @param {DataLoader} dataLoader
     */
    constructor(dataLoader) {
        this.#loader = dataLoader;
    }

    async #loadData() {
        try {
            const data = await this.#loader();
            if (data === null) {
                return;
            }
            this.#data = data;
            this.#isLoaded = true;
        } catch (e) {
            console.error(e);
            // ignore error, leaving #data = null;
        }
    }

    /**
     * @returns {Promise<T|null>}
     */
    async getData() {
        if (!this.#isLoaded) {
            if (this.#waitLoadingPromise instanceof Promise) {
                await this.#waitLoadingPromise;
            } else {
                // load data
                this.#waitLoadingPromise = this.#loadData().finally(() => {
                    this.#waitLoadingPromise = null;
                });
                await this.#waitLoadingPromise;
                this.#waitLoadingPromise = null;
            }
        }
        return this.#data;
    }

    /**
     * @param {T} data
     */
    provideData(data) {
        this.#data = data;
        this.#isLoaded = true;
    }
}
