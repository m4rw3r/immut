/* @flow */

type ArrayMap<K, V> = 0 | [K, V, ArrayMap<K, V>];

export function get<K, V>(key: K, map: ArrayMap<K, V>): ?V {
  while(map) {
    if(map[0] === key) {
      return map[1];
    }

    map = map[2];
  }

  return null;
}

export function set<K, V>(key: K, value: V, map: ArrayMap<K, V> = 0): ArrayMap<K, V> {
  return [key, value, map];
}
