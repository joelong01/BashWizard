/*jshint esversion: 6 */
const path = require("path");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');
module.exports = {
    plugins: [
        // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        new MonacoWebpackPlugin({languages: ['shell', 'json']})

    ],
    target: "electron-main",
    entry: "./src/electron/main.ts",
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [{
                    loader: "ts-loader",
                    options: {
                        compilerOptions: {
                            noEmit: false
                        }
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                include: MONACO_DIR,
                use: ['style-loader', 'css-loader'],
              }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "../build")
    }
};
