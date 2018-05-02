/* @flow */

// Use babel register
require("../../tests/_register");

const Benchmark = require("benchmark");
const {
  arrayInsert,
  arrayReplace,
  arrayRemovePair,
  arrayRemoveAndAdd
} = require("../../src/util");

const arr = [
  "a", {},
  "b", {},
  "c", {},
  "d", {},
  "e", {},
  "f", {},
  "g", {},
  "h", {},
  "i", {},
  "j", {},
  "k", {},
  "l", {},
  "m", {},
  "n", {},
  "o", {},
];

const positions = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

const memcpy = (src, srcOff, srcLen, dst, dstOff) => {
  for(; srcOff < srcLen; srcOff++, dstOff++) {
    dst[dstOff] = src[srcOff];
  }
};

const memcpyAdd = (src, srcOff, a, b) => {
  const arr = new Array(src.length + 2);

  //memcpy(src, 0, srcOff, arr, 0);
  for(let i = 0; i < srcOff; i++) {
    arr[i] = src[i];
  }

  arr[srcOff] = a;
  arr[srcOff + 1] = b;

  //memcpy(src, srcOff, src.length - srcOff, arr, srcOff + 2);
  for(let i = srcOff + 2, j = srcOff; j < src.length; i++, j++) {
    arr[i] = src[j];
  }

  return arr;
};

const memcpyRemove = (src, srcOff, len) => {
  const arr = new Array(src.length - len);

  for(let i = 0; i < srcOff; i++) {
    arr[i] = src[i];
  }

  for(let i = srcOff, j = srcOff + len; j < src.length; i++, j++) {
    arr[i] = src[j];
  }

  // memcpy(src, 0, srcOff, arr, 0);
  // memcpy(src, srcOff + len, src.length - srcOff - len, arr, srcOff);

  return arr;
};

const memcpyReplace = (src, srcOff, b) => {
  const arr = new Array(src.length);

  //memcpy(src, 0, src.length, arr, 0);
  for(let i = 0; i < src.length; i++) {
    arr[i] = src[i];
  }

  arr[srcOff + 1] = b;

  return arr;
};

const insert = (new Benchmark.Suite("Insert"))
  .on("error", console.error)
  .add("arrayInsert", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayInsert(arr, positions[i], "p", {});
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, 0, 0, positions[i], ["p", {}]);
    }
  })
  .add("memcpy + set", () => {
    for(var i = 0; i < positions.length; i++) {
      memcpyAdd(arr, positions[i], "p", {})
    }
  });

const remove = (new Benchmark.Suite("Remove"))
  .on("error", console.error)
  .add("arrayRemovePair", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemovePair(arr, positions[i]);
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, positions[i], 2, 0, []);
    }
  })
  .add("memcpy x2", () => {
    for(var i = 0; i < positions.length; i++) {
      memcpyRemove(arr, positions[i], 2);
    }
  });

const replace = (new Benchmark.Suite("Replace"))
  .on("error", console.error)
  .add("arrayReplace", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayReplace(arr, positions[i] + 1, {});
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, positions[i] + 1, 1, positions[i], [{}]);
    }
  })
  .add("memcpy + set", () => {
    for(var i = 0; i < positions.length; i++) {
      memcpyReplace(arr, positions[i], {})
    }
  });

module.exports = [
  insert,
  remove,
  replace,
];
