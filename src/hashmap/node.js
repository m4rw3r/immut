/* @flow */

import type { HashFn }    from "../hash";
import type { ArrayNode } from "./arraynode";

import { get as arrayNodeGet,
         has as arrayNodeHas,
         set as arrayNodeSet,
         del as arrayNodeDel } from "./arraynode";

import { arrayInsert,
         arrayReplace,
         arrayRemoveAndAdd,
         arrayRemovePair } from "../util";

/*

Implementation of a Lean Hash Array Mapped Trie

*/

type Bitmap    = number;
type EmptyNode = 0;

type HashNode<K, V> = [
  /** Datamap */
  Bitmap,
  /** Nodemap */
  Bitmap,
  /**
   * Array of node entries, key-value pairs go first with keys on even indices
   * and values on odd, after that we have the nodes listed in the nodemap
   * bitmap.
   */
  Array<K | V | Node<K, V>>,
];

export type Node<K, V> =
    HashNode<K, V>
  | ArrayNode<K, V>
  | EmptyNode;

export type RootNode<K, V> =
    HashNode<K, V>
  | EmptyNode;

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
 * The empty node.
 */
export const EMPTY: EmptyNode = 0;

function replaceWithNode<K, V>(src: Array<any>, idx: number, node: Node<K, V>): Array<any> {
  // Replace with node always adds the node last so the following statement is always true:
  // TODO: Assert
  // idx <= src.length - 2
  const arr = new Array(src.length - 1);

  for(let i = 0; i < idx; i++) {
    arr[i] = src[i];
  }

  for(let i = idx, l = src.length - 2; i < l; i++) {
    arr[i] = src[i + 2];
  }

  arr[src.length - 2] = node;

  return arr;
}
function copyToInline<K, V>(src: Array<any>, newIdx: number, nodeIdx: number, entry: [K, V]): Array<any> {
  // TODO: Assert
  // newIdx <= nodeIdx
  const arr = new Array(src.length + 1);

  for(let i = 0; i < newIdx; i++) {
    arr[i] = src[i];
  }

  arr[newIdx]     = entry[0];
  arr[newIdx + 1] = entry[1]

  for(let i = newIdx; i < nodeIdx; i++) {
    arr[i + 2] = src[i];
  }

  for(let i = nodeIdx + 1; i < src.length; i++) {
    arr[i + 2] = src[i];
  }

  return arr;
}

/**
 * Merges two key-value pairs into a single node.
 */
function mergeEntries<K, V>(shift: number, k1: K, h1: number, v1: V, k2: K, h2: number, v2: V): Node<K, V> {
  if(shift >= 32) {
    // Preserve insertion order
    return [k2, v2, k1, v1];
  }

  const masked1 = ((h1 >>> shift) & MASK) | 0;
  const masked2 = ((h2 >>> shift) & MASK) | 0;

  return masked1 !== masked2
    ? [(1 << masked1) | (1 << masked2),
       0,
       masked1 < masked2
         ? [k1, v1, k2, v2]
         : [k2, v2, k1, v1]]
    : [0,
       (1 << masked1),
       [mergeEntries(shift + LEVEL, k1, h1, v1, k2, h2, v2)]];
}

// TODO: More doc
/**
 *
 * Worst case: O(N), if all key-hashes have collided.
 */
export function set<K, V>(key: K, value: V, hash: number, hashFn: HashFn<K>, shift: number, node: RootNode<K, V>): RootNode<K, V> {
  const bit = bitpos(hash, shift);

  // TODO: Maybe move?
  if( ! node) {
    return [bit, 0, [key, value]];
  }

  const [
    datamap,
    nodemap,
    array
  ]         = node;
  const idx = index(datamap, bit);

  if((datamap & bit) !== 0) {
    // DEOPT: Wrong map
    const k = ((array[2 * idx]: any): K);
    const v = ((array[2 * idx + 1]: any): V);

    if(k === key) {
      // Duplicate, replace if not equal
      return v !== value
        ? [
          datamap,
          nodemap,
          arrayReplace(array, 2 * idx + 1, value),
        ]
        : node;
    }

    // We have a collision in the sub-hash, split out to a new node
    return [
      datamap ^ bit,
      nodemap | bit,
      // TODO: Replace with specialized
      replaceWithNode(array, 2 * idx, mergeEntries(shift + LEVEL, key, hash, value, k, hashFn(k), v))
      /*arrayRemoveAndAdd(array, 2 * idx, 2, array.length - 2, [
        mergeEntries(
          shift + LEVEL,
          key, hash, value,
          k, hashFn(k), v)
      ])*/
    ];
  }

  if((nodemap & bit) !== 0) {
    // Exists in subnode
    const nodeIdx = array.length - 1 - index(nodemap, bit);
    const subNode = ((array[nodeIdx]: any): Node<K, V>);
    const newNode = shift + LEVEL < 32
      ? set(key, value, hash, hashFn, shift + LEVEL, (subNode: any))
      : arrayNodeSet(key, value, (subNode: any));

    return newNode !== subNode
      ? [
          datamap,
          nodemap,
          arrayReplace(array, nodeIdx, newNode)
        ]
      : node;
  }

  return [
    datamap | bit,
    nodemap,
    arrayInsert(array, 2 * idx, key, value),
  ];
}

// TODO: More doc
/**
 *
 * Worst case: O(N), if all key-hashes have collided.
 */
export function del<K, V>(key: K, hash: number, shift: number, node: RootNode<K, V>): RootNode<K, V> {
  if( ! node) {
    return node;
  }

  const [
    datamap,
    nodemap,
    array,
  ]         = node;
  const bit = bitpos(hash, shift);
  const idx = index(datamap, bit);

  if((datamap & bit) !== 0 && array[2 * idx] === key) {
    // delete

    if(nodemap === 0) {
      const numKeys = popcnt(datamap);

      if(numKeys === 2) {
        // Prepare node for migration upwards
        return [
          // We either are already at the top-level, or the node will be
          // incorporated into the parent, or become the top-level:
          shift === 0 ? datamap ^ bit : bitpos(hash, 0),
          0,
          idx === 0 ? [array[2], array[3]] : [array[0], array[1]],
        ];
      }

      if(numKeys === 1) {
        return EMPTY;
      }
    }

    return [
      datamap ^ bit,
      nodemap,
      arrayRemovePair(array, 2 * idx),
    ];
  }

  if((nodemap & bit) !== 0) {
    const nodeIdx = array.length - 1 - index(nodemap, bit);
    const subNode = ((array[nodeIdx]: any): Node<K, V>);
    const newNode = shift + LEVEL < 32
      ? del(key, hash, shift + LEVEL, (subNode: any))
      : arrayNodeDel(key, (subNode: any));

    if(newNode !== subNode) {
      if(newNode !== 0 &&
        (newNode.length === 3 && (newNode[1] === 0 && popcnt((newNode: any)[0]) === 1) ||
         newNode.length === 2)) {
        // single-value hash-node or ArrayNode, we could propagate upwards
        if(datamap === 0 && popcnt(nodemap) === 1) {
          // it is the only one in this node, we have prepared to be able to propagate
          return newNode.length === 3
            // Already prepared HashNode
            ? (newNode: any)
            // Merge the ArrayNode
            : [
              // We shared this bit with the node, propagate upwards
              bitpos(hash, 0),
              0,
              // Correct K-V order already
              ((newNode: any): Array<K | V>),
            ];
        }

        // Copy and migrate to inline
        return [
          datamap | bit,
          nodemap ^ bit,
          // TODO: Replace with specialized
          copyToInline(array, 2 * idx, nodeIdx, newNode.length === 3
              // HashNode<K, V>, with a single key-value
              ? ((newNode: any)[2]: [K, V])
              // ArrayNode<K, V>, with a single key-value
              : ((newNode: any): [K, V])),
            /*arrayRemoveAndAdd(array, nodeIdx, 1, 2 * idx,
            newNode.length === 3
              // HashNode<K, V>, with a single key-value
              ? ((newNode: any)[2]: Array<K | V>)
              // ArrayNode<K, V>, with a single key-value
              : ((newNode: any): Array<K | V>)),*/
        ];
      }

      return [
        datamap,
        nodemap,
        arrayReplace(array, nodeIdx, newNode)
      ];
    }
  }

  return node;
}

/**
 * O(log_32(N)). Returns true if the given key exists in the node or any of
 * its subnodes.
 *
 * Worst case: O(N), if all key-hashes have collided.
 */
export function has<K, V>(key: K, hash: number, node: RootNode<K, V>): boolean {
  for(let shift = 0; node;) {
    const [datamap, nodemap, array] = node;
    const bit                       = bitpos(hash, shift);
    const keyIdx                    = 2 * index(datamap, bit);
    const nodeIdx                   = array.length - 1 - index(nodemap, bit);

    if((datamap & bit) !== 0 && ((array[keyIdx]: any): K) === key) {
      return true;
    }

    if((nodemap & bit) === 0) {
      break;
    }

    shift += LEVEL;

    if(shift >= 32) {
      return arrayNodeHas(key, ((array[nodeIdx]: any): ArrayNode<K, V>));
    }

    node = ((array[nodeIdx]: any): HashNode<K, V>);
  }

  return false;
}

/**
 * O(log_32(N)). Attempts to fetch the value belonging to the given key.
 *
 * Worst case: O(N), if all key-hashes have collided.
 */
export function get<K, V>(key: K, hash: number, node: RootNode<K, V>): ?V {
  for(let shift = 0; node;) {
    const [datamap, nodemap, array] = node;
    const bit                       = bitpos(hash, shift);
    const keyIdx                    = 2 * index(datamap, bit);
    const nodeIdx                   = array.length - 1 - index(nodemap, bit);

    if((datamap & bit) !== 0 && ((array[keyIdx]: any): K) === key) {
      return ((array[keyIdx + 1]: any): V);
    }

    if((nodemap & bit) === 0) {
      break;
    }

    shift += LEVEL;

    if(shift >= 32) {
      return arrayNodeGet(key, ((array[nodeIdx]: any): ArrayNode<K, V>));
    }

    node = ((array[nodeIdx]: any): HashNode<K, V>);
  }
}
