/* @flow */

import { genericHash } from "./hash";

type Ref<T> = [T];

type HashFn<T> = (k: T) => number;

type Bitmap = number;

type Data<K, V> = Array<K | V>;

type Node<K, V> = [
  /** Datamap */
  Bitmap,
  /** Nodemap */
  Bitmap,
  /** Nested */
  Data<K, V>,
  /** Spacer to differentiate from ArrayMap */
  0
];

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



export function set<K, V>(key: K, value: V, hash: number, hashFn: HashFn<K>, node: Node<K, V>): Node<K, V> {
  // FIXME: Code

  // return _set(key, [value], hash, hashFn, node);
  return node;
}

export function get<K, V>(key: K, hash: number, node: Node<K, V>): ?V {
  let shift = 0;

  while(node) {
    // ArrayMap is always 3 in length
    if(node.length === 3) {
      return arrayMapGet(key, node);
    }

    const datamap = node[0];
    const nodemap = node[1];
    const array   = node[2];
    const bit     = bitpos(mask(hash, shift));
    const keyIdx  = 2 * index(datamap, bit);
    const nodeIdx = array.length - 1 - index(nodemap, bit);

    if((datamap & bit) > 0 && array[keyIdx] === key) {
      return ((array[keyIdx + 1]: any): V);
    }

    if((nodemap & bit) > 0) {
      node   = array[nodeIdx];
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
  construct() {
    this._root   = (EMPTY_NODE: Node<K, V>);
    this._hashFn = (HashMap.DEFAULT_HASH: HashFn<K>);
  }
  get(k: K): ?V {
    return get(k, this._hashFn(k), this._root);
  }
  set(k: K, v: V): HashMap<K, V> {
    let n = set(k, v, this._hashFn(k), hashFn, this._root);

    return n !== this._root ? Object.create(HashMap.prototype, { _root: n, _hashFn: this._hashFn }) : this;
  }
}

HashMap.DEFAULT_HASH = genericHash;
