const { HashMap: ImmutHashMap,
        hash: immutHash }      = require("../../dist");
const { Map: ImmutableMap }    = require("immutable");
const hamt                     = require("hamt");

const basicGet = (m, k)    => m.get(k);
const basicSet = (m, k, v) => m.set(k, v);

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

const immutHashMap = {
  name:      "immut.HashMap",
  immutable: true,
  create:    () => new ImmutHashMap(),
  get:       basicGet,
  set:       basicSet,
};

const immutHashMapHamtHash = {
  name:      "immut.HashMap (hamt.hash)",
  immutable: true,
  create:    ImmutHashMap.withHashFn.bind(null, hamtHash),
  get:       basicGet,
  set:       basicSet,
};

const immutableMap = {
  name:      "immutable.Map",
  immutable: true,
  create:    ImmutableMap,
  get:       basicGet,
  set:       basicSet,
};

const hamtMap = {
  name:      "hamt.Map",
  immutable: true,
  create:    () => hamt.empty,
  get:       basicGet,
  set:       basicSet,
};

const hamtMapImmutHash = {
  name:      "hamt.Map (immutHash)",
  immutable: true,
  create:    ()        => hamt.empty,
  get:       (m, k)    => m.getHash(immutHash(k), k),
  set:       (m, k, v) => m.setHash(immutHash(k), k, v),
};

const nativeMap = {
  name:      "Native Map",
  immutable: false,
  create:    () => new Map(),
  get:       basicGet,
  set:       basicSet,
};

const objMap = {
  name:      "{} as Map",
  immutable: false,
  create:    ()        => ({}),
  get:       (m, k)    => m[k],
  set:       (m, k, v) => {
    m[k] = v;

    return m;
  },
};

const objAssign = {
  name: "Object.assign",
  immutable: true,
  create:    ()        => ({}),
  get:       (m, k)    => m[k],
  set:       (m, k, v) => Object.assign({}, m, { [k]: v }),
};

module.exports = [
  immutHashMap,
  immutHashMapHamtHash,
  immutableMap,
  hamtMap,
  hamtMapImmutHash,
  //nativeMap,
  //objMap,
  //objAssign,
];
