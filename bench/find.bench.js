/* @flow */

let Benchmark               = require("benchmark");
let { HashMap: FJsHashMap } = require("../dist");
let { Map: ImmutableJsMap } = require("immutable");
let { empty: HamtMap }        = require("hamt");
let { lpad,
      rpad,
      benchCycle,
      benchError,
      MapObject,
      ImmutableMapObject } = require("./util");

function hamtHash(str) {
    var type = typeof str;
    if (type === 'number') return str;
    if (type !== 'string') str += '';

    var hash = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c | 0;
    }
    return hash;
};

let sizes = [10, 100, 1000];
let types = {
  //"fjs.Map":         () => new FJSMap(),
  "fjs.HashMap":     FJsHashMap.withHashFn.bind(null, hamtHash),
  "ImmutableJs.Map": ImmutableJsMap,
  "hamt.Map":        () => HamtMap,
  //"ibtree BTMap":    () => new BTMap(),
  //"ArrayMap":        () => 0,
  "Native Map":      () => new Map(),
  //"{} as Map":       () => new MapObject(),
  //"Object.assign":   () => new ImmutableMapObject()
};

let suite   = new Benchmark.Suite();
let options = {
  maxTime:    0.5,
  minSamples: 1,
};

console.log("Preparing...");

sizes.forEach(size => {
  Object.keys(types).forEach(name => {
    let obj = types[name];
    let o = obj();

    for(var i = 0; i < size; i++) {
      o = o.set(i, i);
    }

    suite.add(rpad(name, 16) + " fetch " +  lpad(size + "", 7) + " number -> number", () => {
      for(var i = 0; i < size; i++) {
        o.get(i);
      }
    }, options);
  });
});

sizes.forEach(size => {
  Object.keys(types).forEach(name => {
    let obj = types[name];
    let o   = obj();

    for(var i = 0; i < size; i++) {
      o = o.set("a".repeat(i % 20) + i, i);
    }

    suite.add(rpad(name, 16) + " fetch " + lpad(size + "", 7) + " string -> number", () => {
      for(var i = 0; i < size; i++) {
        o.get("a".repeat(i % 20) + i, i);
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
