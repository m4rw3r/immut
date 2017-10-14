import flow   from "rollup-plugin-flow";
import babel  from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

export default {
  input: "src/index.js",
  plugins: [
    flow(),
    babel({
      presets: [
        ["env", {
          modules: false,
          loose:   true,
        }]
      ]
    }),
  ],
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.es.js",
      format: "es",
    },
  ],
};

