/* @flow */
import test                       from "ava";
import { arrayRemoveAndAdd as c } from "../src/util";

test("empty", t => {
  t.deepEqual(c([], 0, 0, 0, []), []);
  t.deepEqual(c([], 0, 0, 0, ["a"]), ["a"]);
  t.deepEqual(c([], 0, 0, 0, ["a", "b"]), ["a", "b"]);
});

test("delete", t => {
  t.deepEqual(c(["a"], 0, 1, 0, []), []);
  t.deepEqual(c(["a", "b"], 0, 1, 0, []), ["b"]);
  t.deepEqual(c(["a", "b"], 1, 1, 0, []), ["a"]);
  t.deepEqual(c(["a", "b", "c"], 1, 1, 0, []), ["a", "c"]);
  t.deepEqual(c(["a", "b"], 0, 2, 0, []), []);
});

test("replace", t => {
  t.deepEqual(c(["a"], 0, 1, 0, ["b"]), ["b"]);
  t.deepEqual(c(["a", "c"], 0, 1, 0, ["b"]), ["b", "c"]);
  t.deepEqual(c(["a", "c"], 0, 2, 0, ["b"]), ["b"]);
  t.deepEqual(c(["a", "c"], 1, 1, 0, ["b"]), ["b", "a"]);
  t.deepEqual(c(["a", "c"], 1, 1, 1, ["b"]), ["a", "b"]);
  t.deepEqual(c(["a", "c"], 1, 1, 0, ["b", "c"]), ["b", "c", "a"]);
  t.deepEqual(c(["a", "c"], 1, 1, 1, ["b", "c"]), ["a", "b", "c"]);
});
