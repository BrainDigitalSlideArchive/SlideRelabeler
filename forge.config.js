const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let extraResource = [];

if(os.platform() === 'darwin') {
  extraResource = ['./dist/engine.app', './dist/globus_cli.app'];
}
else {
  extraResource = ['./dist/engine', './dist/globus_cli'];
}

/**
 * Prefer PyInstaller from CONDA_PREFIX (set by npm run package/make via with-conda).
 * Avoids broken Homebrew/system shims on PATH (e.g. bad interpreter: python3.7).
 */
function resolvePyInstaller() {
  const condaPrefix = process.env.CONDA_PREFIX;
  if (condaPrefix) {
    const candidate =
      os.platform() === 'win32'
        ? path.join(condaPrefix, 'Scripts', 'pyinstaller.exe')
        : path.join(condaPrefix, 'bin', 'pyinstaller');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    throw new Error(
      `CONDA_PREFIX is set (${condaPrefix}) but pyinstaller was not found at ${candidate}.\n` +
        'Install pyinstaller in the sliderelabeler conda env, or run via `npm run package` / `npm run make` ' +
        '(conda-wrapped) after `conda activate sliderelabeler`.',
    );
  }
  return 'pyinstaller';
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

      // Prepare environment variables for pyinstaller subprocess
      // engine.spec needs CONDA_PREFIX to copy DLLs
      // Prefer npm run package / npm run make (conda-wrapped) so CONDA_PREFIX + PATH are set
      const execEnv = { ...process.env };
      const pyinstaller = resolvePyInstaller();
      console.log(`** Using pyinstaller: ${pyinstaller} **`);

      console.log('** Running pyinstaller on ./pyinstaller/engine.spec **');
      execSync(`"${pyinstaller}" -y --clean ./pyinstaller/engine.spec`, {
        env: execEnv,
        stdio: 'inherit',
      });

      console.log('** Running pyinstaller on ./pyinstaller/globus-cli.spec **');
      execSync(`"${pyinstaller}" -y --clean ./pyinstaller/globus-cli.spec`, {
        env: execEnv,
        stdio: 'inherit',
      });
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
