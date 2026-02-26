# @nekobato/gatsby-plugin-pnpm

Maintained fork of [`Js-Brecht/gatsby-plugin-pnpm`](https://github.com/Js-Brecht/gatsby-plugin-pnpm).

## Description

This plugin configures Webpack module and loader resolution for packages installed via `pnpm`.

When using `pnpm`, Gatsby builds may fail because pnpm's `node_modules` structure differs from npm/yarn. This plugin updates Webpack resolution so Gatsby can resolve dependencies correctly.

## Compatibility

- Node.js: `>=20`
- Gatsby: `>=5`
- Package format: ESM-first

## What's updated in this fork

- Published package name is now `@nekobato/gatsby-plugin-pnpm`.
- Repository and issue tracker now point to `nekobato/gatsby-plugin-pnpm`.
- Added compatibility for modern pnpm virtual stores by reading `node_modules/.modules.yaml` and resolving `virtualStoreDir` automatically (including custom `virtual-store-dir` values).

## Installation

```sh
pnpm add -D @nekobato/gatsby-plugin-pnpm
```

Add it to `gatsby-config.js`:

```js
// gatsby-config.js
module.exports = {
  plugins: [`@nekobato/gatsby-plugin-pnpm`],
};
```

## Migration from upstream package

Replace the old package:

```sh
pnpm remove gatsby-plugin-pnpm
pnpm add -D @nekobato/gatsby-plugin-pnpm
```

And update your Gatsby config from `gatsby-plugin-pnpm` to `@nekobato/gatsby-plugin-pnpm`.

## Extended usage

### Option: `include`

Use this option to add extra module resolution targets.

- Package names:
  - Add package names that Webpack should resolve.
  - If `strict: true`, included package names must be direct dependencies of your project.
- Directory paths:
  - Add directories that contain modules or loaders.
  - Relative paths are resolved from `process.cwd()`.
  - Paths must point to directories.

### Option: `projectPath`

- Default: `process.cwd()`.
- Use this when your project root differs from the process cwd.
- Relative paths are resolved from `process.cwd()`.

### Option: `strict`

- Default: `true`.
- `true`: Resolve using project-scoped pnpm behavior.
- `false`: Use Node module resolution and walk up parent directories.

## Available options

| Option        | Description                                                                                                                   |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------- |
| `include`     | Optional list of package names and/or directory paths that should be available to Webpack resolution.                         |
| `projectPath` | Optional path to the project root (directory containing `package.json`). Used for resolving package and `node_modules` paths. |
| `strict`      | Optional boolean, default `true`. `true` keeps pnpm-style project scoping. `false` uses Node's upward directory resolution.   |

Example:

```js
// gatsby-config.js
const path = require('path');

module.exports = {
  plugins: [
    {
      resolve: `@nekobato/gatsby-plugin-pnpm`,
      options: {
        projectPath: path.dirname(__dirname),
        include: [`my-awesome-package`, `path/to/my/private/webpack/loaders`],
        strict: true,
      },
    },
  ],
};
```

## Issues and contributing

Please open issues at:
<https://github.com/nekobato/gatsby-plugin-pnpm/issues>

## License

MIT. This fork preserves the original copyright notice and license terms.
