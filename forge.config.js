const { execSync } = require('child_process');
module.exports = {
  packagerConfig: {
    icon: './src/assets/BDSA-icon', // no file extension required
    extraResource: [
      "./dist/engine",
    ],
    ignore:[
      "/\.pyenv.*/",
      "/pyinstaller/",
      "/build/engine",
      "dist",
      "temp"
    ]
  },
  rebuildConfig: {},
  hooks:{
    prePackage:async (forgeConfig) => {

      console.log('** Cleaning out directory **');
      execSync('rm -rf ./out');

      console.log('** Cleaning build directory **');
      execSync('rm -rf ./build');

      console.log('** Running pyinstaller on ./pyinstaller/engine.spec **');
      execSync('pyinstaller -y ./pyinstaller/engine.spec');
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: '/src/assets/BDSA-icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.mainwindow.config.mjs',
          },
          {
            name: 'viewer_window',
            config: 'vite.viewer.config.mjs',
          },
        ],
      },
    },
  ],
};
