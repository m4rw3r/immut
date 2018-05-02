/* @flow */

import { arrayInsert,
         arrayReplace,
         arrayRemovePair } from "../util";

/**
 * A collision node type, key-value pairs are ordered after insertion with the
 * last inserted one first and keys on even indices and values on odd.
 *
 * Fixed-length tuple type to satisfy flow and differentiate, it is
 * actually 2*N in length where N > 0.
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

  if(i >= node.length) {
    return ((arrayInsert((node: any), i, key, value): any): ArrayNode<K, V>);
  }

  if(node[i + 1] !== value) {
    return ((arrayReplace((node: any), i + 1, value): any): ArrayNode<K, V>);
  }

  return node;
}

export function del<K, V>(key: K, node: ArrayNode<K, V>): ArrayNode<K, V> {
  for(let i = 0; i < node.length; i += 2) {
    // Evens are K
    if(node[i] === key) {
      return ((arrayRemovePair((node: any), i): any): ArrayNode<K, V>);
    }
  }

  return node;
}
