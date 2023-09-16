const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
        {
          test: /\.m?jsx?$|\.m?tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },

      ],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './public/index.html',
  }),],
  devServer: {
    client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: true,
        },
      },
    port: 3000,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.jsx', '.js'],
  },
};