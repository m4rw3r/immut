/* @flow */
import test     from "ava";
import { EMPTY,
         get,
         set,
         del }  from "../src/arraymap";

test("empty", t => {
  let m = EMPTY;
  t.plan(1);

  t.is(get("test", m), null);
});

test("setting the same value multiple times should result in the same list", t => {
  let m = EMPTY;
  const o = {};

  t.plan(5);

  t.is(get("test", m), null);

  m = set("test", o, m);

  t.is(get("test", m), o);

  let m2 = m;

  m = set("test", o, m);

  t.is(get("test", m), o);
  t.is(m, m2);
  t.is(get("test", m), o);
});
