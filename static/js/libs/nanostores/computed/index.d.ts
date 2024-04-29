import type { ReadableAtom } from '../atom/index.d.ts'
import type { AnyStore, Store, StoreValue } from '../map/index.d.ts'
import type { Task } from '../task/index.d.ts'

export type StoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

type A = ReadableAtom<number>
type B = ReadableAtom<string>

type C = (...values: StoreValues<[A, B]>) => void

interface Computed {
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Task<Value> | Value
  ): ReadableAtom<Value>
  /**
   * Create derived store, which use generates value from another stores.
   *
   * ```js
   * import { computed } from 'nanostores'
   *
   * import { $users } from './users.d.ts'
   *
   * export const $admins = computed($users, users => {
   *   return users.filter(user => user.isAdmin)
   * })
   * ```
   *
   * An async function can be evaluated by using {@link task}.
   *
   * ```js
   * import { computed, task } from 'nanostores'
   *
   * import { $userId } from './users.d.ts'
   *
   * export const $user = computed($userId, userId => task(async () => {
   *   const response = await fetch(`https://my-api/users/${userId}`)
   *   return response.d.tson()
   * }))
   * ```
   */
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Task<Value> | Value
  ): ReadableAtom<Value>
}

export const computed: Computed

interface Batched {
  <Value extends any, OriginStore extends Store>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Task<Value> | Value
  ): ReadableAtom<Value>
  /**
   * Create derived store, which use generates value from another stores.
   *
   * ```js
   * import { batched } from 'nanostores'
   *
   * const $sortBy = atom('id')
   * const $category = atom('')
   *
   * export const $link = batched([$sortBy, $category], (sortBy, category) => {
   *   return `/api/entities?sortBy=${sortBy}&category=${category}`
   * })
   * ```
   */
  <Value extends any, OriginStores extends AnyStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Task<Value> | Value
  ): ReadableAtom<Value>
}

export const batched: Batched
