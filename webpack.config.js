module.exports = {
  entry: "./public/js/app.js",
  output: {
      path: __dirname,
      filename: "/public/js/bundle.js"
  },
  module: {
    loaders: [
      // sass loader
       {
         test: /\.scss$/,
        loaders: ["style","css","sass"]
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,loaders:'url'
      },
      {
        test: /\.vue$/,
        loader: 'vue',
        options: {
          // vue-loader options go here
        }
      },
      // babel loader
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ],
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue'
    }
  }
}
