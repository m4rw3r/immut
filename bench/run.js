/* @flow */

const fs            = require("fs");
const path          = require("path");
const Benchmark     = require("benchmark");
const minimist      = require("minimist");
const { reporters } = require("./util");

const argv     = minimist(process.argv.slice(2));
const dir      = argv._[0];
const reporter = reporters[argv.reporter || "text"];

if( ! reporter) {
  console.error(`Unknown reporter '${argv.reporter}'`);

  return process.exit(-1);
}

Benchmark.options = Object.assign(Benchmark.options, {
  maxTime:    argv.maxTime || 0.5,
  minSamples: argv.minSamples || 1,
});

const folder = path.resolve(dir);
const files  = fs.statSync(folder).isFile() ? [folder] : fs.readdirSync(folder)
  .map(file => folder + "/" + file)
  .filter(file => {
    const stat = fs.statSync(file);

    return stat.isFile() && /\.bench\.js$/.test(file);
  });
const suites = [].concat.apply([], files.map(require));

Benchmark.invoke(suites, Object.assign({
  name:   "run",
  queued: true,
  async:  false,
}, reporter));
