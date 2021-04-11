const chokidar = require("chokidar");
const { resolve } = require("path");
const execa = require("execa");
const watchPaths = [
  resolve("src", "components", "**", "*.json"),
  resolve("src", "components", "**", "*.twig"),
];

chokidar.watch(watchPaths, { ignoreInitial: true }).on("all", (event, path) => {
  console.log(event, path);
  const param = resolve("src", "scripts", "build-stories.js");
  const exec = execa("node", [param]);
  exec.stdout.pipe(process.stdout);
  exec.stderr.pipe(process.stderr);
});
