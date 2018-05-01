/* @flow */
import test      from "ava";
import { get,
         set,
         del,
         arrayNode as n } from "../../src/hashmap/arraynode";

test("get empty", t => {
    t.is(get("a", n([])), undefined);
})
