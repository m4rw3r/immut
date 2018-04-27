/* @flow */

import type { HashFn } from "../hash";

import { arrayInsert, arrayReplace, arrayRemovePair } from "../util";

type Bitmap = number;

type HashNode<K, V> = [
  /** Datamap */
  Bitmap,
  /** Nodemap */
  Bitmap,
  /** Nested */
  Array<any>,
];

type SetOperation<T> = [T];
type DelOperation    = 0;

export type Node<K, V>   = HashNode<K, V> | 0;
export type Operation<T> = SetOperation<T> | DelOperation;

/**
 * Number of bits per level.
 */
const LEVEL = 5;

/**
 * Mask to obtain valid array-indices.
 */
const MASK  = (1 << LEVEL) - 1;

/**
 * Variable-precision SWAR algorithm, should be converted into a proper
 * population count instruction in JIT.
 */
function popcnt(i: Bitmap): number {
   i = i - ((i >>> 1) & 0x55555555);
   i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);

   return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

/**
 * Bitmap with single bit lit for the hash position at the given shift.
 */
const bitpos = (hash: number, shift: number): number =>
  // Inlined mask
  1 << ((hash >>> shift) & MASK);

/**
 * The array index for the given bit in the bitmap.
 */
const index = (bitmap: Bitmap, bit: number): number =>
  popcnt(bitmap & (bit - 1));

/**
 * Number of entries and nodes in the given node.
 */
const nodeArity = (datamap: Bitmap, nodemap: Bitmap): number =>
  popcnt(datamap) + popcnt(nodemap);

/**
 * The empty node.
 */
export const EMPTY: Node<any, any> = 0;

export function set<K, V>(key: K, op: Operation<V>, hash: number, hashFn: HashFn<K>, shift: number, node: Node<K, V>): Node<K, V> {
  const bit = bitpos(hash, shift);

  if( ! node) {
    return op ? [bit, 0, [key, op[0]]] : (EMPTY: Node<K, V>);
  }

  // Flow: Fails to determine union type based on tuple length
  const [datamap, nodemap, array] = node;
  const keyIdx                    = 2 * index(datamap, bit);
  const nodeIdx                   = array.length - 1 - index(nodemap, bit);

  if((nodemap & bit) !== 0) {
    // Exists in subnode
    throw new Error("Not implemented: Exists in subnode");
  }

  if((datamap & bit) !== 0) {
    if(array[keyIdx] === key) {
      // Duplicate
      if( ! op) {
        // delete
        return nodeArity(datamap, nodemap) !== 1
          ? [datamap ^ bit, nodemap, arrayRemovePair(array, keyIdx)]
          : (EMPTY: Node<K, V>);
      }

      // replace if not equal
      return array[keyIdx + 1] !== op[0]
        ? [datamap, nodemap, arrayReplace(array, keyIdx + 1, op[0])]
        : node;
    }

    // Duplicate hash
    throw new Error("Not implemented: Duplicate hash");
  }

  return ! op ? node : [datamap | bit, nodemap, arrayInsert(array, keyIdx, key, op[0])];
}

export function get<K, V>(key: K, hash: number, node: Node<K, V>): ?V {
  let shift = 0;

  while(node) {
    /*
    // ListMap is always 3 in length
    if(node.length !== 4) {
      // Flow: Fails to determine union type based on tuple length
      return listMapGet(key, ((node: any): ListMap<K, V>));
    }
    */

    const [datamap, nodemap, array] = node;
    const bit                       = bitpos(hash, shift);
    const keyIdx                    = 2 * index(datamap, bit);
    const nodeIdx                   = array.length - 1 - index(nodemap, bit);

    if((datamap & bit) !== 0 && (array[keyIdx]: K) === key) {
      return (array[keyIdx + 1]: V);
    }

    if((nodemap & bit) === 0) {
      break;
    }

    node   = (array[nodeIdx]: Node<K, V>);
    shift += LEVEL;
  }

  return undefined;
}
