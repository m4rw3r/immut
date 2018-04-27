require("@babel/register")({
  ignore:     ["node_modules/*", "test/*"],
  babelrc:    false,
  sourceMaps: "inline",
  presets:    [
    ["@babel/preset-env", {
      "esmodules": true,
      "loose":     true,
      "targets":   {
        "node":     "current",
      },
      "exclude":   [ "transform-typeof-symbol" ]
    }]
  ],
  plugins: [
    "@babel/syntax-flow",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    "@babel/transform-flow-strip-types",
  ]
});
