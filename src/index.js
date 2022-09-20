const schema = require("./options.json");
const mime = require("mime-types");
const path = require("path");

module.exports = function urlLoader(content) {
  const options = this.getOptions(schema);  // 通过 schema 校验 options 是否符合条件
  const { limit } = options;
  const { length } = content;

  //   console.log(shouldTransform(limit, length), 874384)

  if (shouldTransform(limit, length)) {
    const { resourcePath } = this;
    content = Buffer.from(content);
    const mimetype = getMimetype(options.mimetype, resourcePath);
    const encoding = getEncoding(options.encoding);
    const encodedData = getEncodedData(
      options.generator,
      mimetype,
      encoding,
      content,
      resourcePath
    );

    const esModule = options.esModule !== "undefined" ? options.esModule : true;

    return `${
      esModule ? "export default" : "module.exports = "
    } ${JSON.stringify(encodedData)}`;
  }

  // fallback: 默认使用 file-loader
};

module.exports.raw = true;



function shouldTransform(limit, size) {
  if (typeof limit === "boolean") {
    return limit;
  }

  if (typeof limit === "string") {
    return size <= parseInt(limit, 10);
  }

  if (typeof limit === "number") {
    return size <= limit;
  }

  return true;
}

function getMimetype(mimetype, resourcePath) {
  if (typeof mimetype === "boolean") {
    if (mimetype) {
      const resolvedMimetype = mime.contentType(path.extname(resourcePath));
      if (resolvedMimetype) {
        return resolvedMimetype.replace(/;\s+charset/, ";charset");
      }
      return "";
    }
    return "";
  }
  if (typeof mimetype === "string") {
    return mimetype;
  }

  const resolvedMimetype = mime.contentType(path.extname(resourcePath));
  if (resolvedMimetype) {
    return resolvedMimetype.replace(/;\s+charset/, ";charset");
  }
  return "";
}

function getEncoding(encoding) {
  if (typeof encoding === "boolean") {
    return encoding ? "base64" : "";
  }
  if (typeof encoding === "string") {
    return encoding;
  }

  // 默认值
  return "base64";
}

function getEncodedData(generator, mimetype, encoding, content) {
  if (generator && typeof generator === "function") {
    return generator(content, mimetype, encoding, resourcePath);
  }
  // src=”data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAMAAAAOusbgAAAAeFBMVEUAwAD///+U5ZTc9twOww7G8MYwzDCH4==”
  return `data:${mimetype};${encoding ? encoding : ""},${content.toString(
    encoding || undefined
  )}`;
}
