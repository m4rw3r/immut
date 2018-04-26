/* @flow */

import type { HashFn } from "../hash";

import type { Node } from "./node";

import { genericHash } from "../hash";

import { EMPTY,
         get as _get,
         set as _set } from "./node";

/**
 * Creates a new hasher.
 */
export function withHasher<K>(hashFn: HashFn<K>) {
  return {
    get<V>(key: K, node: Node<K, V>): ?V {
      return _get(key, hashFn(key), node);
    },
    set<V>(key: K, value: V, node: Node<K, V>): Node<K, V> {
      return _set(key, [value], hashFn(key), hashFn, 0, node);
    },
    del<V>(key: K, node: Node<K, V>): Node<K, V> {
      return _set(key, 0, hashFn(key), hashFn, 0, node);
    }
  };
}

const { get, set, del } = withHasher(genericHash);

export { EMPTY, get, set, del };

export class HashMap<K, V> {
  static DEFAULT_HASH: HashFn<any>;
  _root:   Node<K, V>;
  _hashFn: HashFn<K>;
  constructor() {
    this._root   = (EMPTY: Node<K, V>);
    this._hashFn = (HashMap.DEFAULT_HASH: HashFn<K>);
  }
  get(k: K): ?V {
    return _get(k, this._hashFn(k), this._root);
  }
  set(k: K, v: V): HashMap<K, V> {
    let n = _set(k, [v], this._hashFn(k), this._hashFn, 0, this._root);

    return n !== this._root ? Object.create(HashMap.prototype, ({ _root: n, _hashFn: this._hashFn }: any)) : this;
  }
  del(k: K): HashMap<K, V> {
    let n =  _set(k, 0, this._hashFn(k), this._hashFn, 0, this._root);

    return n !== this._root ? Object.create(HashMap.prototype, ({ _root: n, _hashFn: this._hashFn }: any)) : this;
  }
}

HashMap.DEFAULT_HASH = genericHash;
