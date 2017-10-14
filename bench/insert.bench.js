/* @flow */

require("babel-register");

let Benchmark              = require("benchmark");
let FJSMap                 = require("../src").Map;
let FJSHashMap             = require("../src").HashMap;
let ImmutableJSMap         = require("immutable").Map;
let { BTMap }              = require("ibtree");
let { lpad,
      rpad,
      benchCycle,
      benchError,
      MapObject,
      ImmutableMapObject } = require("./util");

let sizes = [10, 100, 1000];
let types = {
  "fjs.Map":         () => new FJSMap(),
  "fjs.HashMap":     () => new FJSHashMap(),
  "ImmutableJS.Map": ImmutableJSMap,
  "ibtree BTMap":    () => new BTMap(),
  "Native Map":      () => new Map(),
  "{} as Map":       () => new MapObject(),
  "Object.assign":   () => new ImmutableMapObject()
};

let suite   = new Benchmark.Suite();
let options = {
  maxTime:    0.5,
  minSamples: 1,
};

sizes.forEach(size => {
  Object.keys(types).forEach(name => {
    let obj = types[name];

    suite.add(rpad(name, 16) + " insert " + lpad(size, 7) + " number -> number", () => {
      let o = obj();

      for(var i = 0; i < size; i++) {
        o = o.set(i, i);
      }
    }, options);
  });
});

sizes.forEach(size => {
  Object.keys(types).forEach(name => {
    let obj = types[name];

    suite.add(rpad(name, 16) + " insert " + lpad(size, 7) + " string -> number", () => {
      let o = obj();

      for(var i = 0; i < size; i++) {
        o = o.set("a".repeat(i % 20) + i, i);
      }
    }, options);
  });
});

suite.on('cycle', benchCycle);

suite.on('error', benchError);

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
});

console.log("Starting benchmark");

suite.run();
