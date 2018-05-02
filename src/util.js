/* @flow */

export function arrayInsert<T>(array: Array<T>, idx: number, key: T, val: T): Array<T> {
  const len = array.length;
  const arr = new Array(len + 2);
  let   i   = 0;
  let   j   = 0;

  while(i < idx) {
    arr[j++] = array[i++];
  }

  arr[j++] = (key: any);
  arr[j++] = (val: any);

  while(i < len) {
    arr[j++] = array[i++];
  }

  return arr;
}

export function arrayReplace<T>(array: Array<T>, idx: number, elem: T): Array<T> {
  const len = array.length;
  const arr = new Array(len);

  for(let i = 0; i < len; i++) {
    arr[i] = array[i];
  }

  arr[idx] = elem;

  return arr;
}

export function arrayRemovePair<T>(array: Array<T>, idx: number): Array<T> {
  const len = array.length;
  const arr = new Array(len - 2);
  let   i   = 0;
  let   j   = 0;

  while(j < idx) {
    arr[i++] = array[j++];
  }

  ++j;
  ++j;

  while(j < len) {
    arr[i++] = array[j++];
  }

  return arr;
}

// TODO: Check if we can replace arrayRemovePair with this, and arrayInsertPair, maybe all
export function arrayRemoveAndAdd<T>(array: Array<T>, start: number, num: number, insert: number, items: Array<T>): Array<T> {
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

    arr[i++] = array[j++];
  }

  for(i = 0; i < ilen; i++) {
    arr[insert + i] = items[i];
  }

  return arr;
}
