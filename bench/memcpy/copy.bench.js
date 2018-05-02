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

const insert = (new Benchmark.Suite("Insert"))
  .add("arrayInsert", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayInsert(arr, positions[i], "p", {});
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, 0, 0, positions[i], ["p", {}]);
    }
  });

const remove = (new Benchmark.Suite("Remove"))
  .add("arrayRemovePair", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemovePair(arr, positions[i]);
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, positions[i], 2, 0, []);
    }
  });

const replace = (new Benchmark.Suite("Replace"))
  .add("arrayReplace", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayReplace(arr, positions[i] + 1, {});
    }
  })
  .add("arrayRemoveAndAdd", () => {
    for(var i = 0; i < positions.length; i++) {
      arrayRemoveAndAdd(arr, positions[i] + 1, 1, positions[i], [{}]);
    }
  });

module.exports = [
  insert,
  remove,
  replace,
];
