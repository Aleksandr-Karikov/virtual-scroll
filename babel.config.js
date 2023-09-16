const presetEnv = require('@babel/preset-env')
const presetReact = require('@babel/preset-react')
const presetTS = require("@babel/preset-typescript")
import {} from '@babel/types';

export default function (api) {
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