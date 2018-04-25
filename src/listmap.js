/* @flow */

/**
 * An immutable Map based on a singly-linked list.
 */
export type ListMap<K, V> = 0 | [K, V, ListMap<K, V>];

/**
 * The empty ListMap.
 */
export const EMPTY = 0;

/**
 * Retrieves the first occurence of the key in the ListMap.
 */
export function get<K, V>(key: K, map: ListMap<K, V>): ?V {
  while(map) {
    if(map[0] === key) {
      return map[1];
    }

    map = map[2];
  }

  return undefined;
}

/**
 * Sets the key to the given value.
 *
 * Not tail recursive.
 */
export function set<K, V>(key: K, value: V, map: ListMap<K, V> = 0): ListMap<K, V> {
  if(get(key, map) === value) {
    return map;
  }

  return [key, value, del(key, map)];
}

/**
 * Removes the first occurence of the key in the ListMap.
 *
 * Not tail recursive.
 */
export function del<K, V>(key: K, map: ListMap<K, V> = 0): ListMap<K, V> {
  if( ! map) {
    return 0;
  }

  if(map[0] === key) {
    return map[2];
  }

  let tail = del(key, map[2])

  if(tail !== map[2]) {
    return [map[0], map[1], tail];
  }

  return map;
}
