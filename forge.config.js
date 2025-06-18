const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

let extraResource = [];

if(os.platform() === 'darwin') {
  extraResource = ['./dist/engine.app'];
}
else {
  extraResource = ['./dist/engine'];
}

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/BDSA-icon', // no file extension required
    extraResource: extraResource,
    ignore:[
      "/\.pyenv.*/",
      "/pyinstaller/",
      "/build/engine",
      "dist",
      "temp",
      ".vscode",
      ".idea"
    ]
  },
  rebuildConfig: {},
  hooks:{
    prePackage:async (forgeConfig) => {
      console.log('** Cleaning out directory **');
      if (fs.existsSync('./out')) {
        os.platform() === 'win32' ? execSync('rmdir /s /q .\\out') : execSync('rm -rf ./out');
      }

      if (fs.existsSync('./build')) {
        console.log('** Cleaning build directory **');
        os.platform() === 'win32' ? execSync('rmdir /s /q .\\build') : execSync('rm -rf ./build');
      }

      if (fs.existsSync('./output')) {
        console.log('** Cleaning output directory **');
        os.platform() === 'win32' ? execSync('rmdir /s /q .\\output') : execSync('rm -rf ./output');
      }

      console.log('** Running pyinstaller on ./pyinstaller/engine.spec **');
      execSync('pyinstaller -y --clean ./pyinstaller/engine.spec');
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
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
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
          },
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
          },
        ],
        renderer: [
          {
            name: 'main',
            config: 'vite.renderer.config.mjs',
          },
          {
            name: 'viewer',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
