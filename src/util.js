/* @flow */

export function arrayInsert<K, V>(array: Array<mixed>, idx: number, key: K, val: V): Array<mixed> {
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
