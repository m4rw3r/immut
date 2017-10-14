/* @flow */

let Benchmark              = require("benchmark");
let { arrayMapSet,
      arrayMapGet }        = require("../dist");
let { lpad,
      rpad,
      benchCycle,
      benchError,
      MapObject,
      ImmutableMapObject } = require("./util");

let sizes   = [10, 100, 1000];
let suite   = new Benchmark.Suite();
let options = {
  maxTime:    0.5,
  minSamples: 1,
};
let name = "ArrayMap";

sizes.forEach(size => {
  let o = 0;

  for(var i = 0; i < size; i++) {
    arrayMapSet(i, i);
  }

  suite.add(rpad(name, 16) + " fetch " +  lpad(size + "", 7) + " number -> number", () => {
    for(var i = 0; i < size; i++) {
      arrayMapGet(i);
    }
  }, options);
});

sizes.forEach(size => {
  let o   = 0;

  for(var i = 0; i < size; i++) {
    o = arrayMapSet("a".repeat(i % 20) + i, i);
  }

  suite.add(rpad(name, 16) + " fetch " + lpad(size + "", 7) + " string -> number", () => {
    for(var i = 0; i < size; i++) {
      arrayMapGet("a".repeat(i % 20) + i, i);
    }
  }, options);
});

suite.on('cycle', benchCycle);

suite.on('error', benchError);

console.log("Starting benchmark");

suite.run();
