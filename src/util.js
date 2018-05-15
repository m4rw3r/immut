/* @flow */

/**
 * Copies the given array and inserts `key`, `val` at the given position `idx`.
 */
export function arrayInsert<T>(src: Array<T>, idx: number, key: T, val: T): Array<T> {
  const arr = new Array(src.length + 2);

  for(let i = 0; i < idx; i++) {
    arr[i] = src[i];
  }

  arr[idx]     = key;
  arr[idx + 1] = val;

  for(let i = idx; i < src.length; i++) {
    arr[i + 2] = src[i];
  }

  return arr;
}

/**
 * Copies the given array and replaces the elemnt at index `idx` with `elem`.
 */
export function arrayReplace<T>(src: Array<T>, idx: number, elem: T): Array<T> {
  /*const arr = new Array(src.length);

  for(let i = 0; i < src.length; i++) {
    arr[i] = src[i];
  }*/

  // Slice is pretty fast to copy an array in Node 10.0.0
  const arr = src.slice();

  arr[idx] = elem;

  return arr;
}

/**
 * Copies the given array and removes two elements starting at `idx`.
 */
export function arrayRemovePair<T>(src: Array<T>, idx: number): Array<T> {
  const arr = new Array(src.length - 2);

  // Splice is slow
  for(let i = 0; i < idx; i++) {
    arr[i] = src[i];
  }

  for(let i = idx; i < src.length - 2; i++) {
    arr[i] = src[i + 2];
  }

  return arr;
}

// TODO: Check if we can replace arrayRemovePair with this, and arrayInsertPair, maybe all
export function arrayRemoveAndAdd<T>(array: Array<T>, start: number, num: number, insert: number, items: Array<T>): Array<T> {
  // DEOPT: Wrong map (array)
  const len  = array.length;
  const ilen = items.length;
  const arr  = new Array(len - num + ilen);
  let i = 0;
  let j = 0;

  while(true) {
    // TODO: What are the performance implications of these two?
    while(i >= insert && i < insert + ilen) {
      // Leave gaps
      i++;
    }

    while(j >= start && j < start + num) {
      // Skip
      j++;
    }

    if(j >= len) {
      break;
    }

    // DEOPT: Not a small-integer
    arr[i++] = array[j++];
  }

  for(i = 0; i < ilen; i++) {
    arr[insert + i] = items[i];
  }

  return arr;
}
