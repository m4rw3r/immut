/* @flow */

import { /*arrayInsert,*/
  /*arrayReplace, */
         arrayRemoveAndAdd,
/* arrayRemovePair */ } from "../util";

/**
 * List of key-value pairs, keys on even indices and values on odd.
 *
 * Fixed-length tuple type to satisfy flow and differentiate, it is
 * actually 2*N in length
 */
export type ArrayNode<K, V> =
    [K, V]
  | [K, V, K, V];

/**
 * Helper function to cast an array of key-value pairs into an
 * ArrayNode<K, V>.
 */
export function arrayNode<K, V>(arr: Array<K | V>): ArrayNode<K, V> {
  return ((arr: any): ArrayNode<K, V>);
}

export function get<K, V>(key: K, node: ArrayNode<K, V>): ?V {
  for(let i = 0; i < node.length; i += 2) {
    if(node[i] === key) {
      // i + 1 is always odd, so it is a V
      return ((node[i + 1]: any): V);
    }
  }
}

export function set<K, V>(key: K, value: V, node: ArrayNode<K, V>): ArrayNode<K, V> {
  let i = 0;

  for(; i < node.length; i += 2) {
    if(node[i] === key) {
      break;
    }
  }

  // TODO: Check if the value is identical
  return ((arrayRemoveAndAdd((node: any), i, 2, 0, [key, value]): any): ArrayNode<K, V>);
}

export function del<K, V>(key: K, node: ArrayNode<K, V>): ArrayNode<K, V> {
  for(let i = 0; i < node.length; i += 2) {
    // Evens are K
    if(node[i] === key) {
      return ((/* arrayRemovePair(node, i) */ arrayRemoveAndAdd((node: any), i, 2, 0, []): any): ArrayNode<K, V>);
    }
  }

  return node;
}
