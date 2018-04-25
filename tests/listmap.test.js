/* @flow */
import test     from "ava";
import { EMPTY,
         get,
         set,
         del }  from "../src/listmap";

test("empty", t => {
  let m = EMPTY;
  t.plan(1);

  t.is(get("test", m), undefined);
});

test("setting the same value multiple times should result in the same list", t => {
  let m = EMPTY;
  const o = {};

  t.plan(5);

  t.is(get("test", m), undefined);

  m = set("test", o, m);

  t.is(get("test", m), o);

  let m2 = m;

  m = set("test", o, m);

  t.is(get("test", m), o);
  t.is(m, m2);
  t.is(get("test", m), o);
});

test("overwrite", t => {
  let m = EMPTY;

  t.plan(3);

  t.is(get("a", m), undefined);

  m = set("a", 1, m);
  t.is(get("a", m), 1);

  m = set("a", 2, m);
  t.is(get("a", m), 2);
});
