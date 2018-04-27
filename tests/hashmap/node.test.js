/* @flow */
import test      from "ava";
import { EMPTY,
         get,
         set }   from "../../src/hashmap/node";

const noCall = () => { throw new Error("Should not be called"); };

test("empty", t => {
  t.is(get("test", 0, EMPTY), undefined);
  t.is(get("test", 1, EMPTY), undefined);
  t.is(get("aaaa", 1, EMPTY), undefined);
});

test("set single", t => {
  t.deepEqual(set("a", ["b"],  0, noCall, 0, 0), [1 <<  0, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"],  1, noCall, 0, 0), [1 <<  1, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"],  2, noCall, 0, 0), [1 <<  2, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"],  3, noCall, 0, 0), [1 <<  3, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"], 15, noCall, 0, 0), [1 << 15, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"], 16, noCall, 0, 0), [1 << 16, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"], 31, noCall, 0, 0), [1 << 31, 0, ["a", "b"]]);
  // Wraparound
  t.deepEqual(set("a", ["b"], 32, noCall, 0, 0), [1 <<  0, 0, ["a", "b"]]);
  t.deepEqual(set("a", ["b"], 33, noCall, 0, 0), [1 <<  1, 0, ["a", "b"]]);
});

test("set same", t => {
  let a = set("a", ["b"], 0, noCall, 0, 0);

  t.is(set("a", ["b"], 0, noCall, 0, a), a);
  t.not(set("a", ["c"], 0, noCall, 0, a), a);
  t.deepEqual(set("a", ["c"], 0, noCall, 0, a), [1 << 0, 0, ["a", "c"]]);
});

test("set deep shift", t => {
  t.deepEqual(set("a", ["b"], 32, noCall, 5, EMPTY), [1 << 1, 0, ["a", "b"]]);
  //t.deepEqual(set("a", ["b"], 0, noCall, 0, set("b", ["c"], 32), [1 << 0, 0, ["a", "b"]]);
});

test("delete empty", t => {
  t.is(set("a", 0, 0, noCall, 0, 0), 0);
});

test("delete", t => {
  t.is(set("a", 0, 0, noCall, 0, [1 << 0, 0, ["a", "b"]]), 0);
  t.deepEqual(set("a", 0, 0, noCall, 0, [1 << 0 | 1 << 1, 0, ["a", "b", "c", "d"]]), [1 << 1, 0, ["c", "d"]]);
});

test("delete missing", t => {
  t.deepEqual(set("a", 0, 1, noCall, 0, [1 << 0, 0, ["a", "b"]]), [1 << 0, 0, ["a", "b"]]);
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
  // Two different keys in same tree
  t.is(get("a", 32, [0, 1 | 2, [[1 << 1, 0, ["b", o2]], [1 << 1, 0, ["a", o]]]]), o);
  t.is(get("b", 33, [0, 1 | 2, [[1 << 1, 0, ["b", o2]], [1 << 1, 0, ["a", o]]]]), o2);
});

