# GitHub Release CI

Tag-triggered GitHub Actions builds SlideRelabeler installers for Windows, macOS (Apple Silicon), and Linux, then attaches them to a GitHub Release.

Workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

## Cut a release

1. Bump `"version"` in [`package.json`](../package.json) (e.g. to `0.9.5`).
2. Commit that change on the branch you want to release.
3. Create and push a matching tag (leading `v` required):

   ```bash
   git tag v0.9.5
   git push origin v0.9.5
   ```

4. Wait for the **Release** workflow on the Actions tab. When all build jobs succeed, a GitHub Release for that tag is created/updated with the assets below.

The workflow **fails** if the tag is not exactly `v` + `package.json` `version` (e.g. tag `v0.9.5` requires `"version": "0.9.5"`).

## What gets attached

| Platform | Runner | Release asset |
|----------|--------|----------------|
| Windows | `windows-latest` | `SlideRelabeler-<version> Setup.exe` (Squirrel installer only) |
| macOS Apple Silicon | `macos-latest` | `SlideRelabeler-darwin-arm64-<version>.zip` (contains `SlideRelabeler.app`) |
| Linux x64 | `ubuntu-latest` | `.deb` and `.rpm` |

Squirrel `.nupkg` / `RELEASES` files are **not** uploaded. Intel Mac builds are not produced.

## Local vs CI packaging tools (Linux)

On Ubuntu CI the workflow installs `fakeroot` and `rpm` so both makers succeed. Locally, before `npm run make`:

```bash
sudo apt-get install -y fakeroot rpm
```

See also [build_readme/linux/README.md](../build_readme/linux/README.md).

## Code signing (optional)

Builds are **unsigned** until you add repository secrets. Empty/missing secrets leave packaging unchanged (usable builds with Gatekeeper / SmartScreen friction).

Set secrets under **Settings → Secrets and variables → Actions** (repository secrets):

| Secret | Used on | Purpose |
|--------|---------|---------|
| `CSC_LINK` | macOS | **Base64** of the Developer ID Application `.p12` (not the `.cer` alone). Example: `base64 -i Certificates.p12 \| pbcopy` |
| `CSC_KEY_PASSWORD` | macOS | Password for that `.p12` |
| `WIN_CSC_LINK` | Windows | Path or base64 contents of the Authenticode certificate (`.pfx` / `.p12`) |
| `WIN_CSC_KEY_PASSWORD` | Windows | Password for that Windows certificate |
| `APPLE_IDENTITY` | macOS | Optional explicit identity, e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | macOS | Apple ID email for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS | [App-specific password](https://support.apple.com/en-us/HT204397) |
| `APPLE_TEAM_ID` | macOS | 10-character Team ID |

### macOS signing notes

Electron Forge / `@electron/osx-sign` does **not** auto-import `CSC_LINK` (that is an electron-builder feature). The Release workflow imports the `.p12` into a temporary keychain with [`apple-actions/import-codesign-certs`](https://github.com/Apple-Actions/import-codesign-certs) when `CSC_LINK` is set, then lists identities (`security find-identity -p codesigning -v`) before `npm run make`.

**Nested PyInstaller helpers.** `engine.app` and `globus_cli.app` are COLLECT folders (not real `.app` bundles) copied into `SlideRelabeler.app/Contents/Resources`. Apple notarization rejects the zip if those Mach-Os are unsigned or ad-hoc. When `CSC_LINK` is set, Forge `prePackage` runs [`scripts/sign-pyinstaller-helpers.mjs`](../scripts/sign-pyinstaller-helpers.mjs) after PyInstaller: deep Developer ID sign (hardened runtime + timestamp + [`build/entitlements.mac.plist`](../build/entitlements.mac.plist)) of every Mach-O under those trees, then Forge signs/notarizes the outer app once. You do **not** notarize the helpers separately.

macOS PyInstaller builds disable UPX (it breaks notarizable signatures).

[`forge.config.js`](../forge.config.js) enables `osxSign` / `osxNotarize` when `CSC_LINK` (and notarization env vars) are set on macOS. The Windows job maps `WIN_CSC_*` into `CSC_LINK` / `CSC_KEY_PASSWORD` for the packager; omit those secrets to ship an unsigned Windows installer.

Further reading: [Electron Forge signing](https://www.electronforge.io/guides/code-signing), Simon Willison [sign/notarize Electron on macOS](https://til.simonwillison.net/electron/sign-notarize-electron-macos).
