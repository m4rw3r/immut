
require("babel-register");

let Benchmark              = require("benchmark");
let { lpad,
      rpad,
      benchCycle,
      benchError,
      MapObject,
      ImmutableMapObject } = require("./util");

let sizes   = [2, 4, 8, 16, 32];
let suite   = new Benchmark.Suite();
let options = {
  maxTime:    2,
  minSamples: 10
};

function arraycopy(src, srcPos, dest, destPos, len) {
  // Much faster (~+30%) to increment two indices instead of one and adding
  for(len += destPos; destPos < len; destPos++, srcPos++) {
    dest[destPos] = src[srcPos];
  }
}

sizes.forEach(size => {
  let a     = (new Array(size)).fill("foo");
  let key   = "abcd";
  let value = "LEL";

  suite.add("concat " + size, () => {
    let newArray = a.slice(0, size / 2).concat([key, value]).concat(a.slice(size / 2));
  });

  suite.add("set    " + size, () => {
    let b = new Array(size + 2);
    for(var i = 0; i < size / 2; i++) {
      b[i] = a[i];
    }
    b[size/2] = key;
    b[size/2] = value;
    for(var i = size / 2, j = size / 2 + 2; j < b.length; i++, j++) {
      b[j] = a[i];
    }
  });

  suite.add("splice " + size, () => {
    let newArray = a.slice(0).splice(size / 2, 0, key, value);
  });

  suite.add("arrcpy " + size, () => {
    let newArray = new Array(size + 2);
    arraycopy(a, 0, newArray, 0, size / 2);
    newArray[size/2] = key;
    newArray[size/2] = value;
    arraycopy(a, size / 2, newArray, size / 2 + 2, size / 2);
  });
});

suite.on('cycle', benchCycle);

suite.on('error', benchError);

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
});

console.log("Starting benchmark");

suite.run();
