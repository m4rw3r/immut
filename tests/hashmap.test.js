/* @flow */
import test     from "ava";
import { EMPTY,
         get,
         set,
         del }  from "../src/hashmap";

test("empty", t => {
  t.is(get("test", EMPTY), undefined);
});
