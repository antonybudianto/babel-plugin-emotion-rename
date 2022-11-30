require("@babel/register")({
  configFile: "./babel-main.config.js",
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});

require("./babel.spec");
