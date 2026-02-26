import path from 'node:path';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createRequire as createNodeRequire } from 'node:module';
import { stat as statCallback, type Stats } from 'node:fs';

export const createRequire = createNodeRequire;
export { realpath };

const nodeRequire = createRequire(import.meta.url);

/**
 * Checks whether a file or directory exists at a path.
 *
 * @param filepath Absolute or relative path to check.
 * @returns File stats when the path exists; otherwise undefined.
 */
export const fileExists = async (filepath: string): Promise<Stats | undefined> => {
    return new Promise((resolve) => {
        statCallback(filepath, (err, fileStats) => {
            if (err) {
                return resolve(undefined);
            }
            return resolve(fileStats);
        });
    });
};

/**
 * Determines whether a path points to a directory.
 *
 * @param pathname Absolute or relative path to inspect.
 * @returns True when the path exists and is a directory.
 */
export const isDir = async (pathname: string): Promise<boolean> => {
    try {
        const fsStat = await stat(pathname);
        return fsStat.isDirectory();
    } catch (err) {
        // noop
    }
    return false;
};

/**
 * Gets the path to pnpm's virtual store directory.
 *
 * pnpm persists this value at `node_modules/.modules.yaml` under `virtualStoreDir`.
 * When the value is unavailable, this function falls back to the default
 * `node_modules/.pnpm`.
 *
 * @param {string} nodeModules Absolute path to the project's `node_modules` folder.
 * @returns {Promise<string>} Absolute path to pnpm's virtual store directory.
 */
export const getPnpmVirtualStoreDir = async (nodeModules: string): Promise<string> => {
    const modulesManifestPath = path.join(nodeModules, '.modules.yaml');
    try {
        const modulesManifest = await readFile(modulesManifestPath, 'utf8');
        const match = /^\s*virtualStoreDir:\s*(.+)\s*$/m.exec(modulesManifest);
        if (match && match[1]) {
            const maybeQuotedValue = match[1].trim();
            const virtualStoreDir = maybeQuotedValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            if (virtualStoreDir) {
                return path.resolve(nodeModules, virtualStoreDir);
            }
        }
    } catch (err) {
        // noop
    }

    return path.join(nodeModules, '.pnpm');
};

export const walkBack = async (startPath: string): Promise<string> => {
    const procPath = path.resolve(startPath);
    const sep = '[\\\\/]';
    const matches = new RegExp(`(.*${sep}node_modules)(?:${sep}.+?$|${sep}?$)`, 'i').exec(procPath);
    if (matches && matches[1]) return matches[1];
    return '';
};

type IGetPkgNodeModules = (args: { pkgName: string; nodeModules: string; strict: boolean }) => Promise<string>;
export const getPkgNodeModules: IGetPkgNodeModules = async ({ pkgName, nodeModules, strict }) => {
    try {
        const pkgPath = strict
            ? // We need to check if the option is a valid dependency of the
              // current project
              path.join(nodeModules, pkgName)
            : // Or we need to let node resolve it
              nodeRequire.resolve(pkgName, {
                  paths: [nodeModules],
              });
        if (await fileExists(pkgPath)) {
            try {
                const nodePath = path.join(await walkBack(strict ? await realpath(pkgPath) : pkgPath));
                return nodePath;
            } catch (err) {
                // noop
            }
        }
    } catch (err) {
        // noop
    }
    return '';
};
