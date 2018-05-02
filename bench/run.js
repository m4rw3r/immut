/* @flow */

const fs               = require("fs");
const path             = require("path");
const Benchmark        = require("benchmark");
const { textReporter } = require("./util");

Benchmark.options = Object.assign(Benchmark.options, {
  maxTime:    0.5,
  minSamples: 1,
});

const dir   = path.resolve("./bench");
const files = fs.readdirSync(dir)
  .map(file => dir + "/" + file)
  .filter(file => {
    const stat = fs.statSync(file);

    return stat.isFile() && /\.bench\.js$/.test(file);
  });
const suites = [].concat.apply([], files.map(require));

Benchmark.invoke(suites, Object.assign({
  name:   "run",
  queued: true,
  async:  false,
}, textReporter));
