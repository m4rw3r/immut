/* @flow */

import type { ListMap } from "./arraymap";

import { genericHash } from "./hash";

import { get as arrayMapGet,
         set as arrayMapSet } from "./arraymap";

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

type Node<K, V> = 0 | HashNode<K, V>;

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

const EMPTY_NODE: Node<any, any> = 0;

function popcnt(i: Bitmap): number {
   i = i - ((i >>> 1) & 0x55555555);
   i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);

   return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

function mask(hash: number, shift: number): number {
  return (hash >>> shift) & MASK;
}

function bitpos(index: number): number {
  return 1 << index;
}

function index(bitmap: Bitmap, bit: number): number {
  return popcnt(bitmap & (bit - 1));
}

function nodeArity(datamap: Bitmap, nodemap: Bitmap): number {
  return popcnt(datamap) + popcnt(nodemap);
}

function _set<K, V>(key: K, op: Operation<V>, hash: number, hashFn: HashFn<K>, shift: number, node: Node<K, V>): Node<K, V> {
  const bit = 1 << mask(hash, shift);

  if( ! node) {
    return op ? [bit, 0, [key, op[0]], 0] : 0;
  }

  if(node.length === 3) {
    return op ? (arrayMapSet(key, op[0], (node: any)): any) : 0;
  }

  const datamap = node[0];
  const nodemap = node[1];
  const array   = node[2];
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

export function set<K, V>(key: K, value: V, hash: number, hashFn: HashFn<K>, node: Node<K, V>): Node<K, V> {
  return _set(key, [value], hash, hashFn, 0, node);
}

export function del<K, V>(key: K, value: V, hash: number, hashFn: HashFn<K>, node: Node<K, V>): Node<K, V> {
  return _set(key, 0, hash, hashFn, 0, node);
}

export function get<K, V>(key: K, hash: number, node: Node<K, V>): ?V {
  let shift = 0;

  while(node) {
    // ListMap is always 3 in length
    if(node.length !== 4) {
      return arrayMapGet(key, (node: any));
    }

    const [datamap, nodemap, array] = (node: HashNode<K, V>);
    const bit     = 1 << mask(hash, shift);
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

  return null;
}

export class HashMap<K, V> {
  static DEFAULT_HASH: HashFn<any>;
  _root:   Node<K, V>;
  _hashFn: HashFn<K>;
  constructor() {
    this._root   = (EMPTY_NODE: Node<K, V>);
    this._hashFn = (HashMap.DEFAULT_HASH: HashFn<K>);
  }
  get(k: K): ?V {
    return get(k, this._hashFn(k), this._root);
  }
  set(k: K, v: V): HashMap<K, V> {
    let n = set(k, v, this._hashFn(k), this._hashFn, this._root);

    return n !== this._root ? Object.create(HashMap.prototype, ({ _root: n, _hashFn: this._hashFn }: any)) : this;
  }
}

HashMap.DEFAULT_HASH = genericHash;
