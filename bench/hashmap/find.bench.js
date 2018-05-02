/* @flow */

const Benchmark = require("benchmark");
const impls     = require("./impls");

const sizes  = [10, 100, 1000];
const suites = [];

sizes.forEach(size => {
  const suite = new Benchmark.Suite("Find (number -> number) " + size);

  suite.benchData = {
    name: "Find",
    type: "number -> number",
    size: size,
  };

  impls.forEach(({ name, immutable, create, get, set }) => {
    let o = create();

    for(var i = 0; i < size; i++) {
      o = set(o, i, i);
    }

    suite.add(name, () => {
      for(var i = 0; i < size; i++) {
        get(o, i);
      }
    });
  });

  suites.push(suite);
});

sizes.forEach(size => {
  const suite = new Benchmark.Suite("Find (string -> number) " + size);

  suite.benchData = {
    name: "Find",
    type: "string -> number",
    size: size,
  };

  impls.forEach(({ name, immutable, create, get, set }) => {
    let o = create();

    for(var i = 0; i < size; i++) {
      o = set(o, "a".repeat(i % 20) + i, i);
    }

    suite.add(name, () => {
      for(var i = 0; i < size; i++) {
        get(o, "a".repeat(i % 20) + i, i);
      }
    });
  });

  suites.push(suite);
});

module.exports = suites;
