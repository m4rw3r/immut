import babel    from "rollup-plugin-babel";
import resolve  from "rollup-plugin-node-resolve";
import gzip     from "rollup-plugin-gzip";
import uglify   from "rollup-plugin-uglify";
import replace  from "rollup-plugin-replace";

const production = process.env.NODE_ENV === "production";

export default {
  input:  "src/index.js",
  output: [
    {
      file:      "dist/index.es2015.js",
      sourcemap: true,
      format:    "es",
    },
    {
      file:      "dist/index.js",
      sourcemap: true,
      format:    "cjs",
    },
  ],
  plugins: [
    babel({
      babelrc: false,
      presets: [
        ["@babel/preset-env", {
          "modules": false,
          "loose":   true,
          "targets": {
            "node":     "current",
            "browsers": "last 2 versions"
          },
          "exclude": [ "transform-typeof-symbol" ]
        }]
      ],
      plugins: [
        "@babel/syntax-flow",
        ["@babel/plugin-proposal-class-properties", { loose: true }],
        "@babel/transform-flow-strip-types",
      ]
    }),
    resolve({
      module:      true,
      jsnext:      true,
      modulesOnly: true,
    }),
  // We only perform the replace in pure production
  ].concat(production ? [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
  ] : []).concat([
    uglify({
      compress: {
        booleans:      true,
        collapse_vars: true,
        conditionals:  true,
        dead_code:     true,
        evaluate:      true,
        hoist_funs:    true,
        hoist_props:   true,
        hoist_vars:    false,
        if_return:     true,
        inline:        true,
        join_vars:     true,
        keep_fargs:    true,
        keep_fnames:   false,
        loops:         true,
        negate_iife:   true,
        passes:        3,
        properties:    true,
        pure_funcs:    [],
        pure_getters:  true,
        reduce_funcs:  true,
        reduce_vars:   true,
        sequences:     true,
        typeofs:       true,
        unsafe:        true,
        unsafe_proto:  true,
        unused:        true,
        warnings:      true,
      },
      mangle: production ? {
        toplevel:   true,
        reserved:   [],
        properties: {
          regex: /^_/
        },
      } : false,
      output: {
        beautify: !production
      }
    }),
    gzip({
      options: {
        level: 9
      }
    })
  ]),
};
