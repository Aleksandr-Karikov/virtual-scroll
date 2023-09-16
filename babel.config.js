const presetEnv = require('@babel/preset-env')
const presetReact = require('@babel/preset-react')
const presetTS = require("@babel/preset-typescript")

module.exports = function (api) {
    api.cache(true);
  
    const presets = [ presetEnv, presetReact, presetTS];
    const plugins = [];
  
    if (process.env["ENV"] === "prod") {
    //   plugins.push(...);
    }
  
    return {
      presets,
      plugins
    };
  }