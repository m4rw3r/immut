/* @flow */

import type { HashFn } from "../hash";

import type { RootNode } from "./node";

import { genericHash } from "../hash";

import { EMPTY,
         get as _get,
         set as _set,
         del as _del } from "./node";

/**
 * Creates a new hasher.
 */
export function withHasher<K>(hashFn: HashFn<K>) {
  return {
    get<V>(key: K, node: RootNode<K, V>): ?V {
      return _get(key, hashFn(key), node);
    },
    set<V>(key: K, value: V, node: RootNode<K, V>): RootNode<K, V> {
      return _set(key, value, hashFn(key), hashFn, 0, node);
    },
    del<V>(key: K, node: RootNode<K, V>): RootNode<K, V> {
      return _del(key, hashFn(key), 0, node);
    }
  };
}

const { get, set, del } = withHasher(genericHash);

export { EMPTY, get, set, del };

/**
 * Creates a new HashMap wrapper object around the given root.
 */
function createMap<K, V>(root: RootNode<K, V>, hashFn: HashFn<K>): HashMap<K, V> {
  const map = Object.create(HashMap.prototype);

  map._root   = root;
  map._hashFn = hashFn;

  return map;
}

export class HashMap<K, V> {
  static DEFAULT_HASH: HashFn<any> = genericHash;
  /**
   * Creates a new HashMap with the given hashFn hash-function to hash keys.
   */
  static withHashFn(hashFn: HashFn<K>): HashMap<K, V> {
    return createMap(EMPTY, hashFn);
  }

  _root:   RootNode<K, V>;
  _hashFn: HashFn<K>;
  constructor() {
    this._root   = EMPTY;
    this._hashFn = (HashMap.DEFAULT_HASH: HashFn<K>);
  }
  get(k: K): ?V {
    return _get(k, this._hashFn(k), this._root);
  }
  set(k: K, v: V): HashMap<K, V> {
    let n = _set(k, v, this._hashFn(k), this._hashFn, 0, this._root);

    return n !== this._root ? createMap(n, this._hashFn) : this;
  }
  del(k: K): HashMap<K, V> {
    let n = _del(k, this._hashFn(k), 0, this._root);

    return n !== this._root ? createMap(n, this._hashFn) : this;
  }
}

// HashMap.DEFAULT_HASH = genericHash;
