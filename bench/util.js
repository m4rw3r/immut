/* @flow */

const formatNumber = (number) => {
  number = String(number).split('.');

  return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') +
      (number[1] ? '.' + number[1] : '');
}

const lpad = (str, len) => (" ".repeat(len) + str).slice(-len);
const rpad = (str, len) => (str + " ".repeat(len)).slice(0, len);

const fastest = ({ stats: a }, { stats: b }) =>
  a.mean + a.moe > b.mean + b.moe ? 1 : -1;

const textReporter = {
  // Run per finished benchmark suite
  onCycle: event => {
    console.log(event.target.name + ":");

    const namePad = event.target.reduce((a, bench) => Math.max(a, bench.name.length), 0) + 2;

    event.target.sort(fastest).forEach(bench => {
      let { name, hz, stats } = bench;
      let size                = stats.sample.length;

      console.log("  " + rpad(name, namePad) +
        lpad(formatNumber(hz.toFixed(hz < 100 ? 2 : 0)), 14) + " ops/sec " +
        "\xb1" + stats.rme.toFixed(2) + "% (" + size + " run" + (size == 1 ? "" : "s") + " sampled)");
    });

    console.log("    Fastest: " + event.target.filter("fastest").map("name"));
  },
  onError: error => console.error(error),
};

module.exports.reporters = {
  text: textReporter
};
