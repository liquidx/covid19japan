const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    index: ["./src/index.js", "./src/index.scss"],
    tokyo: ["./src/tokyo.js", "./src/trends.scss"],
    ageTrends: ["./src/ageTrends.js", "./src/trends.scss"],
    deathTrends: ["./src/deathTrends.js", "./src/trends.scss"],
  },
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: "[name].js",
    publicPath: "/",
  },

  devServer: {
    contentBase: "./docs",
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "src/index.html",
      chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      filename: "tokyo.html",
      template: "src/tokyo.html",
      chunks: ["tokyo"],
    }),
    new HtmlWebpackPlugin({
      filename: "ageTrends.html",
      template: "src/ageTrends.html",
      chunks: ["ageTrends"],
    }),
    new HtmlWebpackPlugin({
      filename: "deathTrends.html",
      template: "src/deathTrends.html",
      chunks: ["deathTrends"],
    }),
    new HtmlWebpackPlugin({
      bodyClass: "embed",
      filename: "embed.html",
      template: "src/index.html",
      chunks: ["index"],
    }),
    new CopyPlugin([{ from: "CNAME", to: ".", flatten: false }]),
    new CopyPlugin([{ from: "static/**", to: ".", flatten: false }]),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif|ico|geojson)$/,
        use: ["file-loader"],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader" },
          { loader: "postcss-loader" },
          {
            loader: "sass-loader",
            options: { implementation: require("node-sass") },
          },
        ],
      },
    ],
  },
};
