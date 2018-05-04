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
 * O(1). Helper function to cast an array of key-value pairs into an
 * ArrayNode<K, V>.
 */
export function arrayNode<K, V>(arr: Array<K | V>): ArrayNode<K, V> {
  return ((arr: any): ArrayNode<K, V>);
}

/**
 * O(N). Fetches the value associated with the given key, uses a linear
 * search.
 */
export function get<K, V>(key: K, node: ArrayNode<K, V>): ?V {
  for(let i = 0; i < node.length; i += 2) {
    if(node[i] === key) {
      // i + 1 is always odd, so it is a V
      return ((node[i + 1]: any): V);
    }
  }
}

/**
 * O(N). Performs a lookup of the given key, returning true if it exists.
 */
export function has<K, V>(key: K, node: ArrayNode<K, V>): boolean {
  for(let i = 0; i < node.length; i += 2) {
    if(node[i] === key) {
      return true;
    }
  }

  return false;
}

/**
 * O(N). Stores the given key-value pair in the array node, if the key already
 * exists and its value is not strictly equal to `value` then a new ArrayNode
 * will be returned containing the new value. `node` will not be modified.
 */
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

/**
 * O(N). If the given key exists in the node a new node will be created without
 * this key and its associated value.
 */
export function del<K, V>(key: K, node: ArrayNode<K, V>): ArrayNode<K, V> {
  for(let i = 0; i < node.length; i += 2) {
    // Evens are K
    if(node[i] === key) {
      return ((arrayRemovePair((node: any), i): any): ArrayNode<K, V>);
    }
  }

  return node;
}
