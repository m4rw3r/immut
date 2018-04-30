/* @flow */

import type { HashFn }    from "../hash";
import type { ArrayNode } from "./arraynode";

import { get as arrayNodeGet,
         set as arrayNodeSet,
         del as arrayNodeDel } from "./arraynode";

import { /*arrayInsert,*/
  /*arrayReplace, */
         arrayRemoveAndAdd,
/* arrayRemovePair */ } from "../util";

type Bitmap = number;

type HashNode<K, V> = [
  /** Datamap */
  Bitmap,
  /** Nodemap */
  Bitmap,
  /** Nested */
  Array<any>,
];

type Some<T> = [T];
type None    = 0;

export type Node<K, V> =
    HashNode<K, V>
  | ArrayNode<K, V>
  | 0;
export type Option<T>  =
    Some<T>
  | None;

/**
 * Number of bits per level.
 */
export const LEVEL = 5;

/**
 * Mask to obtain valid array-indices.
 */
const MASK = (1 << LEVEL) - 1;

/**
 * Counts the number of set bits in the given 32-bit bitmap.
 *
 * Variable-precision SWAR algorithm, should be possible to run as SIMD.
 */
function popcnt(i: Bitmap): number {
   i = i - ((i >>> 1) & 0x55555555);
   i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);

   return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

/**
 * Returns a bitmap with a single bit set for the hash position for the given
 * hash at the given shift.
 */
const bitpos = (hash: number, shift: number): number =>
  // Inlined mask (1 << mask)
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

function mergeEntries<K, V>(shift: number, k1: K, h1: number, v1: V, k2: K, h2: number, v2: V): Node<K, V> {
  if(shift >= 32) {
    // Preserve insertion order
    // TODO: Cast to ArrayNode<K, V>
    return ([k2, v2, k1, v1]: any);
  }

  const masked1 = (h1 >>> shift) & MASK;
  const masked2 = (h2 >>> shift) & MASK;

  return ((masked1 !== masked2
    ? [(1 << masked1) | (1 << masked2), 0, masked1 < masked2 ? [k1, v1, k2, v2] : [k2, v2, k1, v1]]
    : [0, (1 << masked1), [mergeEntries(shift + LEVEL, k1, h1, v1, k2, h2, v2)]]): HashNode<K, V>);
}

export function set<K, V>(key: K, op: Option<V>, hash: number, hashFn: HashFn<K>, shift: number, node: Node<K, V>): Node<K, V> {
  if(shift >= 32) {
    /*:: node = ((node: any): ArrayNode<K, V>); */

    // FIXME: Proper adding and removal, need to collapse the tree to the minimal tree on delete
    return op
      ? arrayNodeSet(key, op[0], node)
      : arrayNodeDel(key, node);
  }

  /*:: node = ((node: any): HashNode<K, V>); */

  const bit = bitpos(hash, shift);

  if( ! node) {
    return op
      ? ([bit, 0, [key, op[0]]]: HashNode<K, V>)
      : (EMPTY: Node<K, V>);
  }

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
        // TODO: Compact the tree
        return nodeArity(datamap, nodemap) !== 1
          ? ([
              datamap ^ bit,
              nodemap,
              /* arrayRemovePair(array, keyIdx) */
              arrayRemoveAndAdd(array, keyIdx, 2, 0, [])
            ]: HashNode<K, V>)
          : (EMPTY: Node<K, V>);
      }

      // replace if not equal
      return array[keyIdx + 1] !== op[0]
        ? ([
          datamap,
          nodemap,
          /* arrayReplace(array, keyIdx + 1, op[0]) */
          arrayRemoveAndAdd(array, keyIdx + 1, 1, keyIdx + 1, (op: any))
        ]: HashNode<K, V>)
        : node;
    }

    if(op) {
      // We have a collision in the sub-hash, split out to a new node
      return ([
        datamap ^ bit,
        nodemap | bit,
        arrayRemoveAndAdd(array, keyIdx, 2, nodeIdx - 1, [
          mergeEntries(
            shift + LEVEL,
            key, hash, op[0],
            (array[keyIdx]: K), hashFn((array[keyIdx]: K)), (array[keyIdx + 1]: V))
        ])
      ]: HashNode<K, V>);
    }
  }

  return ! op
    ? node
    : ([
      datamap | bit,
      nodemap,
      /*arrayInsert(array, keyIdx, key, op[0])*/
      arrayRemoveAndAdd(array, 0, 0, keyIdx, [key, op[0]])
    ]: HashNode<K, V>);
}

export function get<K, V>(key: K, hash: number, node: Node<K, V>): ?V {
  let shift = 0;

  while(node) {
    if(shift >= 32) {
      /*:: node = ((node: any): ArrayNode<K, V>);*/

      return arrayNodeGet(key, node);
    }

    /*:: node = ((node: any): HashNode<K, V>);*/

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
