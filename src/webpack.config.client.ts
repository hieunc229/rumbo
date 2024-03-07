import path from "path";
import webpack from "webpack";
import merge from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
// import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";

import { formatClassName } from "./utils/text";
import { GenerateSW } from "workbox-webpack-plugin";

type Props = {
  mode?: WebpackMode;
  publicPath: string;
  entry: any;
  route: string;
  distDir: string;
  pwaEnabled?: boolean;
};

export function getWebpackReactConfigs(
  props: Props,
  preConfigs?: webpack.Configuration
): webpack.Configuration {
  let { mode, route, entry, distDir, publicPath, pwaEnabled } = props;
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  // let entry = props.entry[formatClassName(route)];
  if (isDevelopment) {
    entry[formatClassName(route)].push(
      "react-hot-loader/patch",
      `webpack-hot-middleware/client?path=${path.join(
        route.replace("*", ""),
        "__webpack_hmr"
      )}`
    );
  }

  let configs: webpack.Configuration = {
    mode,
    name: route,
    entry,
    output: {
      path: path.join(distDir, "static"),
      publicPath: "/static",
      filename: "[name].[fullhash:8].js",
      chunkFilename: "[name].[fullhash:8]-[id].js",
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|js|jsx)?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              // plugins: ["@babel/plugin-transform-modules-amd"]
            },
          },
        },
        {
          oneOf: [
            {
              test: /\.module\.scss$/,
              use: [
                // MiniCssExtractPlugin.loader,
                isProduction
                  ? "css-loader"
                  : {
                      loader: "css-loader",
                      options: {
                        modules: true,
                        url: false,
                        sourceMap: false,
                      },
                    },
                "sass-loader",
              ],
            },
            {
              test: /\.(scss|sass|css)$/i,
              use: [
                isProduction
                  ? "style-loader"
                  : {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        esModule: false,
                      },
                    },
                isProduction
                  ? "css-loader"
                  : {
                      loader: "css-loader",
                      options: { url: false, sourceMap: false },
                    },
                "sass-loader",
                "postcss-loader",
              ],
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js", ".tsx", ".json"],
      modules: ["src", "node_modules"],
    },
    plugins: [
      new webpack.ProvidePlugin({
        React: "react",
      }),

      new MiniCssExtractPlugin({
        filename: "[name].[fullhash:8].css",
        chunkFilename: "[name].[fullhash:8]-[id].css",
      }),

      new HtmlWebpackPlugin({
        filename: "index.html",
        minify: !isDevelopment,
        publicPath: route.replace(/\*/g, ""),
      }),
    ],
  };

  if (preConfigs) {
    configs = merge(configs, preConfigs);
  }

  if (isDevelopment) {
    configs = merge(configs, {
      devtool: "cheap-module-source-map",
      plugins: [new webpack.HotModuleReplacementPlugin()],
    });
  } else {
    configs = merge(configs, {
      mode: "production",
      devtool: false,
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: "all",
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": `"production"`,
        }),
      ],
    });

    if (pwaEnabled) {
      configs.plugins?.push(
        new GenerateSW({
          swDest: "service-worker.js",
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./
        })
      );
    }
  }

  return configs;
}
