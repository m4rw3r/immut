/* @flow */

import type { ListMap } from "./listmap";

import { genericHash } from "./hash";

import { get as listMapGet,
         set as listMapSet } from "./listmap";

import { arrayRemovePair } from "./util";

type Ref<T> = [T];

type HashFn<T> = (k: T) => number;

type Bitmap = number;

type HashNode<K, V> = [
  /** Datamap */
  Bitmap,
  /** Nodemap */
  Bitmap,
  /** Nested */
  Array<any>,
  0,
];

export type Node<K, V> = ListMap<K, V> | HashNode<K, V>;

type SetOperation<T> = [T];
type DelOperation    = 0;
type Operation<T>    = SetOperation<T> | DelOperation;

/**
 * Number of bits per level.
 */
const LEVEL = 5;
/**
 * Mask to obtain valid array-indices.
 */
const MASK  = (1 << LEVEL) - 1;

export const EMPTY: Node<any, any> = 0;

function popcnt(i: Bitmap): number {
   i = i - ((i >>> 1) & 0x55555555);
   i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);

   return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

  /*
function mask(hash: number, shift: number): number {
  return (hash >>> shift) & MASK;
}

function bitpos(index: number): number {
  return 1 << index;
}
*/

function bitpos(hash: number, shift: number): number {
  return 1 << ((hash >>> shift) & MASK);
}

function index(bitmap: Bitmap, bit: number): number {
  return popcnt(bitmap & (bit - 1));
}

function nodeArity(datamap: Bitmap, nodemap: Bitmap): number {
  return popcnt(datamap) + popcnt(nodemap);
}

function _set<K, V>(key: K, op: Operation<V>, hash: number, hashFn: HashFn<K>, shift: number, node: Node<K, V>): Node<K, V> {
  const bit = bitpos(hash, shift);

  if( ! node) {
    return op ? [bit, 0, [key, op[0]], 0] : 0;
  }

  if(node.length === 3) {
    return op ? (listMapSet(key, op[0], (node: ListMap<K, V>)): any) : 0;
  }

  const [datamap, nodemap, array] = (node: HashNode<K, V>);
  const keyIdx  = 2 * index(datamap, bit);
  const nodeIdx = array.length - 1 - index(nodemap, bit);

  if((datamap & bit) > 0) {
    if( ! op) {
      return nodeArity(datamap, nodemap) === 1 ? 0 :
        [datamap ^ bit, nodemap, arrayRemovePair(array, keyIdx), 0];
    }

  }

  return node;
}

function _get<K, V>(key: K, hash: number, node: Node<K, V>): ?V {
  let shift = 0;

  while(node) {
    // ListMap is always 3 in length
    if(node.length !== 4) {
      return listMapGet(key, (node: ListMap<K, V>));
    }

    const [datamap, nodemap, array] = (node: HashNode<K, V>);
    const bit     = bitpos(hash, shift);
    const keyIdx  = 2 * index(datamap, bit);
    const nodeIdx = array.length - 1 - index(nodemap, bit);

    if((datamap & bit) > 0 && (array[keyIdx]: K) === key) {
      return (array[keyIdx + 1]: V);
    }

    if((nodemap & bit) > 0) {
      node   = (array[nodeIdx]: Node<K, V>);
      shift += LEVEL;
    }
    else {
      break;
    }
  }

  return undefined;
}

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

export { get, set, del };

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
