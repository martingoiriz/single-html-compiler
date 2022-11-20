const fs = require("fs");
const { JSDOM } = require("jsdom");
const minify = require("html-minifier").minify;

let path = process.argv?.filter((x) => x.startsWith("--path="))[0]?.split("=")[1];

if (!path) return console.error("Error: you must specify a path");

path = path.startsWith("/") ? path : "/" + path;
path = path.endsWith("/") ? path : path + "/";

fs.readdir(path, (err, files) => {
  if (err) return console.error(err);

  fs.readFile(`${path}index.html`, "utf-8", (err, htmlText) => {
    if (err) return console.error(err);

    const htmlContent = new JSDOM(htmlText);

    fs.readFile(`${path}${getFile(files, ".css")}`, "utf-8", (err, cssText) => {
      const htmlCssModified = appendCss(htmlContent, cssText, err);

      fs.readFile(`${path}${getFile(files, ".js")}`, "utf-8", (err, jsText) => {
        const finalHtml = appendJs(htmlCssModified, jsText, err);

        writeBuild(finalHtml);
      });
    });
  });
});

const writeBuild = (htmlContent) => {
  let dir = "./build/";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: false });
  }

  const resultHtml = minify(htmlContent.serialize(), {
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeTagWhitespace: true,
    trimCustomFragments: true,
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    conservativeCollapse: true,
  });

  fs.writeFile(dir + "index.html", resultHtml, (err) => {
    if (err) return console.error(err);
    console.log("\x1b[33m" + "Compiled successfully" + "\x1b[0m");
  });
};

const appendCss = (htmlContent, cssText, err) => {
  if (err) return console.error(err);

  let contentDom = htmlContent.window.document;
  contentDom.getElementsByTagName("link")[0].remove();
  var styleTag = contentDom.createElement("style");
  styleTag.innerHTML = cssText;
  contentDom.getElementsByTagName("head")[0].appendChild(styleTag);
  htmlContent.window.document += contentDom;
  return htmlContent;
};

const appendJs = (htmlCssModified, jsText, err) => {
  if (err) return console.error(err);

  let contentDom = htmlCssModified.window.document;
  contentDom.getElementsByTagName("script")[0].remove();

  var scriptTag = contentDom.createElement("script");
  scriptTag.type = "text/javascript";
  scriptTag.innerHTML = jsText;
  contentDom.getElementsByTagName("html")[0].appendChild(scriptTag);
  htmlCssModified.window.document += contentDom;
  return htmlCssModified;
};

const getFile = (fileList, ext) => fileList.filter((x) => x.endsWith(ext))[0];
