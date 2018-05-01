function formatNumber(number) {
  number = String(number).split('.');

  return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') +
      (number[1] ? '.' + number[1] : '');
}

function lpad(str, len) {
  return (" ".repeat(len) + str).slice(-len);
}

module.exports.lpad = lpad;

module.exports.rpad = (str, len) =>
  (str + " ".repeat(len)).slice(0, len);

module.exports.benchCycle = function benchCycle(event) {
  let { name, hz, stats } = event.target;
  let size = stats.sample.length;

  console.log(name +
    '  x ' + lpad(formatNumber(hz.toFixed(hz < 100 ? 2 : 0)), 16) + ' ops/sec ' +
    '\xb1' +
stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)');
}

module.exports.benchError = function benchError(error) {
  console.error(error);
}

module.exports.MapObject = MapObject;

module.exports.ImmutableMapObject = ImmutableMapObject;

function MapObject() {};

MapObject.prototype.set = function(k, v) {
  this[k] = v;

  return this;
};

MapObject.prototype.get = function(k) {
  return this[k];
};

function ImmutableMapObject() {};

ImmutableMapObject.prototype.set = function(k, v) {
  return Object.assign(new ImmutableMapObject(), this, { [k]: v });
};

ImmutableMapObject.prototype.get = function(k) {
  return this[k];
};
