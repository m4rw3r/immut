/* @flow */
import test      from "ava";
import { EMPTY,
         LEVEL,
         get,
         set,
         has,
         del }   from "../../src/hashmap/node";

const noCall = () => { throw new Error("Should not be called"); };

test("empty", t => {
  t.is(get("test", 0, EMPTY), undefined);
  t.is(get("test", 1, EMPTY), undefined);
  t.is(get("aaaa", 1, EMPTY), undefined);
});

test("set single", t => {
  t.deepEqual(set("a", "b",  0, noCall, 0, EMPTY), [1 <<  0, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b",  1, noCall, 0, EMPTY), [1 <<  1, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b",  2, noCall, 0, EMPTY), [1 <<  2, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b",  3, noCall, 0, EMPTY), [1 <<  3, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b", 15, noCall, 0, EMPTY), [1 << 15, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b", 16, noCall, 0, EMPTY), [1 << 16, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b", 31, noCall, 0, EMPTY), [1 << 31, 0, ["a", "b"]]);
  // Wraparound
  t.deepEqual(set("a", "b", 32, noCall, 0, EMPTY), [1 <<  0, 0, ["a", "b"]]);
  t.deepEqual(set("a", "b", 33, noCall, 0, EMPTY), [1 <<  1, 0, ["a", "b"]]);
});

test("set same", t => {
  let a = set("a", "b", 0, noCall, 0, EMPTY);

  t.is(set("a", "b", 0, noCall, 0, a), a);
  t.not(set("a", "c", 0, noCall, 0, a), a);
  t.deepEqual(set("a", "c", 0, noCall, 0, a), [1 << 0, 0, ["a", "c"]]);
});

test("set deep shift", t => {
  t.deepEqual(set("a", "b", 32, noCall, LEVEL, EMPTY), [1 << 1, 0, ["a", "b"]]);
});

test("set deep duplicate bits", t => {
  const o1 = { name: "o1" };
  const o2 = { name: "o2" };

  const rehash = (hash: string): number => {
    t.is(hash, "a");

    return 0;
  };
  const rehash2 = (hash: string): number => {
    t.is(hash, "b");

    return 32;
  };

  let a = set("a", o1, 0, noCall, 0, EMPTY);

  t.deepEqual(a, [1 << 0, 0, ["a", o1]]);
  t.deepEqual(set("b", o2, 32, rehash, 0, a),
    [0, 1, [[1 | 2, 0, ["a", o1, "b", o2]]]]);
  t.deepEqual(set("a", o1, 0, noCall, 0, a), [1 << 0, 0, ["a", o1]]);
  t.deepEqual(set("a", o1, 0, rehash2, 0, [1 << 0, 0, ["b", o2]]),
    [0, 1, [[1 | 2, 0, ["a", o1, "b", o2]]]]);
});

test("set deep same bits", t => {
  const o1 = { name: "o1" };
  const o2 = { name: "o2" };
  const o3 = { name: "o3" };

  const rehash = (hash: string): number => {
    t.is(hash, "a");

    return 0;
  };

  let a = set("a", o1, 0, noCall, 0, EMPTY);

  t.deepEqual(a, [1 << 0, 0, ["a", o1]]);

  a = set("b", o2, 0, rehash, 0, a);

  t.deepEqual(a,
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2]]]]]]]]]]]]]]]);

  a = set("c", o3, 0, noCall, 0, a);

  t.deepEqual(a,
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2, "c", o3]]]]]]]]]]]]]]]);

  // Immutable, same object should come the same one
  t.is(set("c", o3, 0, noCall, 0, a), a);
});

test("set subnode", t => {
  const o1 = { name: "o1" };
  const o2 = { name: "o2" };

  t.deepEqual(set("a", o1, 0, noCall, 0, [0, 1, [[2, 0, ["b", o2]]]]),
    [0, 1, [[3, 0, ["a", o1, "b", o2]]]]);
  t.deepEqual(set("a", o1, 64, noCall, 0, [0, 1, [[2, 0, ["b", o2]]]]),
    [0, 1, [[6, 0, ["b", o2, "a", o1]]]]);

  const n = [0, 1, [[2, 0, ["b", o2]]]];

  global.debug = true;
  t.is(set("b", o2, 32, noCall, 0, n), n);
  global.debug = false;
  t.deepEqual(set("b", o1, 32, noCall, 0, n), [0, 1, [[2, 0, ["b", o1]]]]);
});

test("delete empty", t => {
  t.is(del("a", 0, 0, EMPTY), EMPTY);
});

test("delete", t => {
  t.is(del("a", 0, 0, [1 << 0, 0, ["a", "b"]]), EMPTY);
  t.deepEqual(del("a", 0, 0, [1 << 0 | 1 << 1, 0, ["a", "b", "c", "d"]]), [1 << 1, 0, ["c", "d"]]);
  t.deepEqual(del("a", 0, 0, [7, 0, ["a", "b", "c", "d", "e", "f"]]), [6, 0, ["c", "d", "e", "f"]]);
  t.deepEqual(del("c", 1, 0, [7, 0, ["a", "b", "c", "d", "e", "f"]]), [5, 0, ["a", "b", "e", "f"]]);
  t.deepEqual(del("e", 2, 0, [7, 0, ["a", "b", "c", "d", "e", "f"]]), [3, 0, ["a", "b", "c", "d"]]);
  // Wrong hash:
  t.deepEqual(del("e", 1, 0, [7, 0, ["a", "b", "c", "d", "e", "f"]]), [7, 0, ["a", "b", "c", "d", "e", "f"]]);
});

test("delete missing", t => {
  const a = [1 << 0, 0, ["a", "b"]];
  t.deepEqual(del("a", 1, 0, a), [1 << 0, 0, ["a", "b"]]);
  t.is(del("a", 1, 0, a), a);
  t.deepEqual(del("b", 1, 0, a), [1 << 0, 0, ["a", "b"]]);
  t.is(del("b", 1, 0, a), a);
  t.deepEqual(del("b", 0, 0, a), [1 << 0, 0, ["a", "b"]]);
  t.is(del("b", 0, 0, a), a);
});

test("delete nested", t => {
  t.deepEqual(del("a", 0, 0, [0, 1, [[3, 0, ["a", { name: "a" }, "b", { name: "b" }]]]]), [1, 0, ["b", { name: "b" }]]);
  t.deepEqual(del("b", 32, 0, [0, 1, [[3, 0, ["a", { name: "a" }, "b", { name: "b" }]]]]), [1, 0, ["a", { name: "a" }]]);
  t.deepEqual(del("a", 0, 0, [1, 2, ["a", { name: "a" }, [3, 0, ["b", { name: "b" }, "c", { name: "c" }]]]]), [0, 2, [[3, 0, ["b", { name: "b" }, "c", { name: "c" }]]]]);
  const a = [1, 2, ["a", { name: "a" }, [3, 0, ["b", { name: "b" }, "c", { name: "c" }]]]];

  global.debug = true;
  t.deepEqual(del("d", 1, 0, a), [1, 2, ["a", { name: "a" }, [3, 0, ["b", { name: "b" }, "c", { name: "c" }]]]]);
  global.debug = false;
  t.is(del("d", 1, 0, a), a);
  t.deepEqual(del("d", 5, 0, a), [1, 2, ["a", { name: "a" }, [3, 0, ["b", { name: "b" }, "c", { name: "c" }]]]]);
  t.is(del("d", 5, 0, a), a);
});

test("delete collision", t => {
  const o1 = { name: "o1" };
  const o2 = { name: "o2" };
  const o3 = { name: "o3" };

  t.deepEqual(del("a", 0, 0, [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2]]]]]]]]]]]]]]]), [1, 0, ["b", o2]]);
  t.deepEqual(del("a", 0, 0, [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2, "c", o3]]]]]]]]]]]]]]]), [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["b", o2, "c", o3]]]]]]]]]]]]]]]);

  t.deepEqual(del("a", 0, 0, [4, 1, ["c", o3, [0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2]]]]]]]]]]]]]]]), [5, 0, ["b", o2, "c", o3]]);
  t.deepEqual(del("a", 0, 0, [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [4, 1, ["c", o3, ["a", o1, "b", o2]]]]]]]]]]]]]]]), [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [5, 0, ["b", o2, "c", o3]]]]]]]]]]]]]]);
  t.deepEqual(del("b", 0, 0,[0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [5, 0, ["b", o2, "c", o3]]]]]]]]]]]]]]), [1, 0, ["c", o3]]);
  t.deepEqual(del("c", 0, 0,[1, 0, ["c", o3]]), EMPTY);
});

test("get nested", t => {
  const o  = {};
  const o2 = {};

  t.is(get("a", 31, [0, 1 << 31, [[1 << 0, 0, ["a", o]]]]), o);
  t.is(get("b", 31, [0, 1 << 31, [[1 << 0, 0, ["a", o]]]]), undefined);
  t.is(get("a", 32, [0, 1 <<  0, [[1 << 1, 0, ["a", o]]]]), o);
  t.is(get("b", 32, [0, 1 <<  0, [[1 << 1, 0, ["a", o]]]]), undefined);
  t.is(get("a", 33, [0, 1 <<  1, [[1 << 1, 0, ["a", o]]]]), o);
  t.is(get("b", 33, [0, 1 <<  1, [[1 << 1, 0, ["a", o]]]]), undefined);
  // Two different nodes
  t.is(get("a", 32, [0, 1 | 2, [[1 << 1, 0, ["b", o2]], [1 << 1, 0, ["a", o]]]]), o);
  t.is(get("b", 33, [0, 1 | 2, [[1 << 1, 0, ["b", o2]], [1 << 1, 0, ["a", o]]]]), o2);
  // Two different keys in same tree
  t.is(get("a",  0, [0, 1, [[1 | 2, 0, ["a", o, "b", o2]]]]), o);
  t.is(get("b", 32, [0, 1, [[1 | 2, 0, ["a", o, "b", o2]]]]), o2);
});

test("get collision", t => {
  const o1 = {};
  const o2 = {};
  const a  = [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", o1, "b", o2]]]]]]]]]]]]]]];
  t.is(get("a", 0, a), o1);
  t.is(get("b", 0, a), o2);
});

test("has", t => {
  t.is(has("a", 0, EMPTY), false);
  t.is(has("b", 0, EMPTY), false);
  t.is(has("a", 1, EMPTY), false);
  t.is(has("a", 0, [1, 0, ["b", "c"]]), false);

  t.is(has("a", 32, [0, 1 | 2, [[1 << 1, 0, ["b", "c"]], [1 << 1, 0, ["a", "d"]]]]), true);
  t.is(has("b", 33, [0, 1 | 2, [[1 << 1, 0, ["b", "c"]], [1 << 1, 0, ["a", "d"]]]]), true);
  t.is(has("c", 33, [0, 1 | 2, [[1 << 1, 0, ["b", "c"]], [1 << 1, 0, ["a", "d"]]]]), false);
  t.is(has("d", 33, [0, 1 | 2, [[1 << 1, 0, ["b", "c"]], [1 << 1, 0, ["a", "d"]]]]), false);

  const a  = [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [[0, 1, [[0, 1, [
    [0, 1, [["a", "c", "b", "d"]]]]]]]]]]]]]]];
  t.is(has("a", 0, a), true);
  t.is(has("b", 0, a), true);
  t.is(has("c", 0, a), false);
  t.is(has("d", 0, a), false);
});
