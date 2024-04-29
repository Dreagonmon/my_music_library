import type { MapCreator } from '../map-creator/index.d.ts'
import type { Store } from '../map/index.d.ts'

export const clean: unique symbol

/**
 * Destroys all cached stores and call
 *
 * It also reset all tasks by calling {@link cleanTasks}.
 *
 * ```js
 * import { cleanStores } from 'nanostores'
 *
 * afterEach(() => {
 *   cleanStores($router, $settings)
 * })
 * ```
 *
 * @param stores Used store classes.
 * @return Promise for stores destroying.
 */
export function cleanStores(
  ...stores: (MapCreator<any, any[]> | Store | undefined)[]
): void
