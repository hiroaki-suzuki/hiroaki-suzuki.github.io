/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'),
    require('autoprefixer'),
    require('postcss-nested'),
    require('postcss-sorting'),
    require('postcss-custom-media'),
    require('cssnano')({ preset: 'default' }),
  ],
};

module.exports = config;
