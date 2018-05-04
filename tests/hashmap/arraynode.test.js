/* @flow */
import test      from "ava";
import { get,
         set,
         has,
         del,
         arrayNode as n } from "../../src/hashmap/arraynode";

test("get empty", t => {
  t.is(get("a", n([])), undefined);
})

test("get", t => {
  const o1 = {};
  const o2 = {};

  t.is(get("a", n(["a", o1])), o1);
  t.is(get("a", n(["b", o1])), undefined);
  t.is(get("a", n(["a", o1, "b", o2])), o1);
  t.is(get("b", n(["a", o1, "b", o2])), o2);
  t.is(get("b", n(["a", "b", "b", "c"])), "c");
  t.is(get("a", n(["a", "b", "b", "c"])), "b");
})

test("set", t => {
  t.deepEqual(set("a", "b", n([])), n(["a", "b"]));
  t.deepEqual(set("b", "c", n(["a", "b"])), n(["a", "b", "b", "c"]));
  t.deepEqual(set("a", "c", n(["a", "b"])), n(["a", "c"]));

  const a = set("a", "b", n([]));

  t.is(set("a", "b", a), a);
  t.not(set("a", "c", a), a);
  t.not(set("b", "c", a), a);
});

test("del", t => {
  const a = n([]);
  const b = n(["a", "b", "b", "c"]);

  t.is(del("a", a), a);
  t.deepEqual(del("a", n(["a", "b"])), n([]));

  t.is(del("d", b), b);

  t.deepEqual(del("b", n(["a", "b", "b", "c"])), n(["a", "b"]));
  t.deepEqual(del("a", n(["a", "b", "b", "c"])), n(["b", "c"]));
});

test("has", t => {
  t.is(has("a", n([])), false);
  t.is(has("a", ["b", "a"]), false);
  t.is(has("a", ["a", "b"]), true);
  t.is(has("a", ["b", "c", "a", "b"]), true);
  t.is(has("a", ["b", "a", "a", "b"]), true);
  t.is(has("a", ["b", "a", "d", "b"]), false);
  t.is(has("a", ["b", "a", "a", "b", "d", "e"]), true);
});
