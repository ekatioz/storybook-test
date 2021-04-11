const { readdirSync, mkdirSync, writeFileSync, existsSync } = require("fs");
const { resolve, join, relative, parse } = require("path");
const { renderFile } = require("twig");
const hasha = require("hasha");
const remove = require("rimraf");
const componentsPath = resolve("src", "components");
const templateExtension = ".twig";
const modelsFolder = "models";
const storiesPath = resolve("src", "stories");
const buildPath = resolve("build");

buildStories();

function buildStories() {
  remove.sync(buildPath);
  remove.sync(storiesPath);
  mkdirSync(buildPath);
  mkdirSync(storiesPath);
  readdirSync(componentsPath).forEach((group) =>
    readdirSync(join(componentsPath, group)).forEach((component) => {
      const componentPath = join(componentsPath, group, component);
      const modelsPath = join(componentPath, modelsFolder);
      const template = join(componentPath, component + templateExtension);
      Promise.all(
        readdirSync(modelsPath)
          .map((jsonFile) => parse(jsonFile).name)
          .map((variant) =>
            writeVariantHTML(template, modelsPath, variant, component)
          )
      ).then((variants) => {
        writeStory(group, component, componentPath, variants);
      });
    })
  );
}

function writeVariantHTML(template, modelsPath, variant, component) {
  return new Promise((resolve, reject) => {
    renderFile(template, require(join(modelsPath, variant)), (err, html) => {
      const file = join(
        buildPath,
        `${component}_${variant}#${hasha(html).substr(0, 8)}.html`
      );
      delete require.cache[require.resolve(join(modelsPath, variant))];
      if (err) {
        reject(err);
      } else {
        writeFileSync(file, html, { encoding: "utf-8" });
        resolve({ file, variant });
      }
    });
  });
}

function writeStory(group, component, componentPath, variants) {
  const cssPath = join(componentPath, `${component}.css`);
  let content = "";
  console.log(cssPath);
  if (existsSync(cssPath)) {
    console.log("exists");
    content += `import "${relative(storiesPath, cssPath).replace(
      /\\/g,
      "/"
    )}";\n`;
  }
  content += variants.reduce((content, variant) => {
    const importPath = relative(storiesPath, variant.file).replace(/\\/g, "/");
    const importName = parse(variant.file).name.substr(
      0,
      parse(variant.file).name.indexOf("#")
    );
    const variantName = capitalize(importName.replace(component + "_", ""));
    content += `import ${importName} from "${importPath}";\n`;
    content += `export const ${variantName} = () => ${importName};\n`;
    return content;
  }, "");
  content += `export default { title: "${capitalize(group)}/${capitalize(
    component
  )}" };\n`;
  writeFileSync(join(storiesPath, `${component}.stories.js`), content, {
    encoding: "utf-8",
  });
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
