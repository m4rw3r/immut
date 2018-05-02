/* @flow */

import type { HashFn }    from "../hash";
import type { ArrayNode } from "./arraynode";

import { get as arrayNodeGet,
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
  Array<any>,
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
 * Number of entries and nodes in the given node.
 */
const nodeArity = (datamap: Bitmap, nodemap: Bitmap): number =>
  popcnt(datamap) + popcnt(nodemap);

/**
 * The empty node.
 */
export const EMPTY: EmptyNode = 0;

function mergeEntries<K, V>(shift: number, k1: K, h1: number, v1: V, k2: K, h2: number, v2: V): Node<K, V> {
  if(shift >= 32) {
    // Preserve insertion order
    return [k2, v2, k1, v1];
  }

  const masked1 = (h1 >>> shift) & MASK;
  const masked2 = (h2 >>> shift) & MASK;

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
      arrayRemoveAndAdd(array, 2 * idx, 2, array.length - 2, [
        mergeEntries(
          shift + LEVEL,
          key, hash, value,
          k, hashFn(k), v)
      ])
    ];
  }

  if((nodemap & bit) !== 0) {
    // Exists in subnode
    const nodeIdx = array.length - 1 - index(nodemap, bit);
    const subNode = array[nodeIdx];
    const newNode = shift + LEVEL < 32
      ? set(key, value, hash, hashFn, shift + LEVEL, subNode)
      : arrayNodeSet(key, value, subNode);

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
          // The keys are guaranteed to share the hash at shift - LEVEL since we
          // are in a subnode
          // FIXME: Is that really true? can we really do that since it will
          // break down if we have to move more than one step upwards
          shift === 0 ? datamap ^ bit : bitpos(hash, shift - LEVEL),
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
    const subNode = array[nodeIdx];
    const newNode = shift + LEVEL < 32
      ? del(key, hash, shift + LEVEL, subNode)
      : arrayNodeDel(key, subNode);

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
              // We shared this bit with the node
              bit,
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
          arrayRemoveAndAdd(array, nodeIdx, 1, 2 * idx,
            newNode.length === 3
              // HashNode<K, V>, with a single key-value
              ? ((newNode: any)[2]: Array<K | V>)
              // ArrayNode<K, V>, with a single key-value
              : ((newNode: any): Array<K | V>)),
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

export function get<K, V>(key: K, hash: number, node: RootNode<K, V>): ?V {
  for(let shift = 0; node;) {
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

    node   = (array[nodeIdx]: HashNode<K, V>);
    shift += LEVEL;

    if(shift >= 32) {
      return arrayNodeGet(key, ((node: any): ArrayNode<K, V>));
    }
  }
}
