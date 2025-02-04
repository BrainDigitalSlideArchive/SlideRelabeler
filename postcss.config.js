const postcssPresetEnv = require('postcss-preset-env');
const postcssSass = require('@csstools/postcss-sass')

// postcss.config.js
module.exports = {
    plugins: [
        postcssPresetEnv({

        }),
        postcssSass({
        })
    ]
};