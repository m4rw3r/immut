/* @flow */

export type HashFn<T> = (k: T) => number;

/**
 * SDBM Hash.
 */
export function sdbmHash(str: string): number {
  var hash = 0;

  for(var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);

    hash = char + (hash << 6) + (hash << 16) - hash;
  }

  return hash|0;
}

export function genericHash(key: any): number {
  if(key === false || key === null || key === undefined) {
    return 0;
  }

  const type = typeof key;

  if(type === "number") {
    /*
     * See: http://stackoverflow.com/a/12996028/3000308
     */
    key = ((key >>> 16) ^ key) * 0x45d9f3b;
    key = ((key >>> 16) ^ key) * 0x45d9f3b;

    return ((key >>> 16) ^ key)|0;
  }
  if(type === "string") {
    return sdbmHash(key);
  }
  if(type === "function") {
    return sdbmHash(key.toString());
  }

  throw new Error("Key type " + type + " cannot be hashed.");
}
