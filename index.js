'use strict';

const minify = require('html-minifier').minify;
const sysPath = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const fm = require('front-matter');

const DEFAULT_PATTERN = /\.html$/;
const DEFAULT_HTMLMIN_OPTIONS = {
  caseSensitive: false,
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: false,
  collapseWhitespace: true,
  conservativeCollapse: false,
  html5: true,
  includeAutoGeneratedTags: false,
  keepClosingSlash: false,
  minifyCSS: true,
  minifyJS: true,
  preserveLineBreaks: false,
  preventAttributesEscaping: false,
  processConditionalComments: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true
};

const DEFAULT_DESTINATION_FN = path => {
  return path.replace(/^app[\/\\]/, '');
};

class HtmlPages {
  constructor(config) {
    if (config === undefined) config = {};
    if (config.plugins === undefined) config.plugins = {};

    const pluginConfig = config.plugins.htmlPages || {};
    this.publicPath = config.paths.public;
    this.destinationFn = pluginConfig.destination || DEFAULT_DESTINATION_FN;
    this.disabled = !config.optimize || pluginConfig.disabled;
    this.pattern = pluginConfig.pattern || DEFAULT_PATTERN;
    this.preserveFrontMatter = !!pluginConfig.preserveFrontMatter;
    this.htmlMinOptions = pluginConfig.htmlMin ?
      Object.assign({}, pluginConfig.htmlMin) :
      DEFAULT_HTMLMIN_OPTIONS;
    this.compileAssets = pluginConfig.compileAssets;
  }

  compile(file, path, callback) {
    let err, error, contents, frontmatter;
    try {
      if (!this.disabled && this.preserveFrontMatter) {
        // strip out front matter
        frontmatter = fm(file);
        contents = frontmatter.body;
      } else {
        contents = file;
      }

      const result = this.disabled ? contents : minify(contents, this.htmlMinOptions);

      if (!this.disabled && this.preserveFrontMatter) {
        // add back front matter
        contents = '---\n' + frontmatter.frontmatter + '\n---\n' + result;
      } else {
        contents = result;
      }

      const destinationPath = sysPath.join(this.publicPath, this.destinationFn(path));
      const destinationDir = sysPath.dirname(destinationPath);
      mkdirp.sync(destinationDir);
      return fs.writeFileSync(destinationPath, contents);
    } catch (_error) {
      err = _error;
      console.error('Error while processing \'${path}\': ${err.toString()');
      return error = err;
    } finally {
      return callback(error, '');
    }
  }

  compileStatic(file) {
    const data = file.data;
    const path = file.path;

    return new Promise(resolve => {
      resolve({
        data: this.compileAssets && !this.disabled ? minify(data, this.htmlMinOptions) : data,
        path: sysPath.join(this.publicPath, this.destinationFn(path))
      });
    });
  }
}

HtmlPages.prototype.brunchPlugin = true;
HtmlPages.prototype.type = 'template';
HtmlPages.prototype.extension = 'html';
HtmlPages.prototype.staticTargetExtension = 'html';

module.exports = HtmlPages;
