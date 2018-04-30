/* @flow */

import { /*arrayInsert,*/
  /*arrayReplace, */
         arrayRemoveAndAdd,
/* arrayRemovePair */ } from "../util";

/**
 * List of key-value pairs, keys on even indices and values on odd.
 */
export opaque type ArrayNode<K, V> = Array<K | V>;

export function get<K, V>(key: K, node: ArrayNode<K, V>): ?V {
  for(let i = 0; i < node.length; i += 2) {
    if(node[i] === key) {
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
  return arrayRemoveAndAdd(node, i, 2, 0, [key, value]);
}

export function del<K, V>(key: K, node: ArrayNode<K, V>): ArrayNode<K, V> {
  for(let i = 0; i < node.length; i += 2) {
    // Evens are K
    if(node[i] === key) {
      return /* arrayRemovePair(node, i) */ arrayRemoveAndAdd(node, i, 2, 0, []);
    }
  }

  return node;
}
