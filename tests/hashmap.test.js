/* @flow */
import test     from "ava";
import { EMPTY,
         get,
         set,
         del }  from "../src/hashmap";

test("empty", t => {
  t.is(get("test", EMPTY), undefined);
});

test("set", t => {
  t.deepEqual(set("a", "b", EMPTY), [2, 0, ["a", "b"]]);
  t.deepEqual(set("c", "d", EMPTY), [8, 0, ["c", "d"]]);
  t.deepEqual(set("a", "b", set("a", "b", EMPTY)), [2, 0, ["a", "b"]]);
  t.deepEqual(set("c", "d", set("a", "b", EMPTY)), [10, 0, ["a", "b", "c", "d"]]);

  let a = set("a", "b", EMPTY);

  t.is(set("a", "b", a), a);
});

test("set series", t => {
  for(let i = 0; i < 32; i++) {
    let arr = [];
    let a   = EMPTY;

    for(let j = 0; j <= i; j++) {
      arr = arr.concat([String.fromCharCode(64 + j), j]);
      a   = set(String.fromCharCode(64 + j), j, a);
    }

    t.deepEqual(a, [(-1 >>> (32 - i - 1))|0, 0, arr], `set(${String.fromCharCode(64 + i)}, ${i})`);
  }

  for(let i = 0; i < 32; i++) {
    let arr = [];
    let a   = EMPTY;

    for(let j = i; j >= 0; j--) {
      arr = [String.fromCharCode(64 + j), j].concat(arr);
      a   = set(String.fromCharCode(64 + j), j, a);
    }

    t.deepEqual(a, [(-1 >>> (32 - i - 1))|0, 0, arr], `set(${String.fromCharCode(64 + i)}, ${i})`);
  }
});

test("set and get", t => {
  for(let i = 0; i < 32; i++) {
    let arr = [];
    let a   = EMPTY;

    for(let j = 0; j <= i; j++) {
      let k = String.fromCharCode(64 + j);

      t.is(get(k, a), undefined, `get(${k})`)

      a = set(k, j, a);

      t.is(get(k, a), j, `get(${k})`)
    }
  }
})
