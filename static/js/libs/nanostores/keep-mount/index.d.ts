import type { MapCreator } from '../map-creator/index.d.ts'
import type { Store } from '../map/index.d.ts'

/**
 * Prevent destructor call for the store.
 *
 * Together with {@link cleanStores} is useful tool for tests.
 *
 * ```js
 * import { keepMount } from 'nanostores'
 *
 * keepMount($store)
 * ```
 *
 * @param $store The store.
 */
export function keepMount($store: MapCreator | Store): void
