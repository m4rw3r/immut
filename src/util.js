/* @flow */

export function arrayInsert<T>(src: Array<T>, idx: number, key: T, val: T): Array<T> {
  const arr = new Array(src.length + 2);

  for(let i = 0; i < idx; i++) {
    arr[i] = src[i];
  }

  arr[idx] = (key: any);
  arr[idx + 1] = (val: any);

  for(let i = idx, j = idx + 2, l = src.length - idx; i < l; i++, j++) {
    arr[j] = src[i];
  }

  return arr;
}

export function arrayReplace<T>(src: Array<T>, idx: number, elem: T): Array<T> {
  const arr = new Array(src.length);

  for(let i = 0; i < src.length; i++) {
    arr[i] = src[i];
  }

  arr[idx] = elem;

  return arr;
}

export function arrayRemovePair<T>(src: Array<T>, idx: number): Array<T> {
  const arr = new Array(src.length - 2);

  for(let i = 0; i < idx; i++) {
    arr[i] = src[i];
  }

  for(let i = idx, j = idx + 2; j < src.length; i++, j++) {
    arr[i] = src[j];
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
