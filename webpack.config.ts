import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import 'webpack-dev-server';

const config: webpack.Configuration = {
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
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
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
export default config;