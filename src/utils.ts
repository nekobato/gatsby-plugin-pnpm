import * as path from 'path';
import Module from "module";
import { stat as _stat, Stats, realpath as _realpath, readFile as _readFile } from 'fs';
import { promisify } from 'util';

export const createRequire = Module.createRequire || Module.createRequireFromPath;

const stat = promisify(_stat);
export const realpath = promisify(_realpath);
const readFile = promisify(_readFile);

export const fileExists = async (filepath: string): Promise<Stats | void> => {
    return new Promise((resolve) => {
        _stat(filepath, (err, fileStats) => {
            if (err) {
                return resolve();
            }
            resolve(fileStats);
        });
    });
};

export const isDir = async (pathname: string): Promise<Boolean> => {
    try {
        const fsStat = await stat(pathname);
        return fsStat.isDirectory();
    } catch (err) {
        //noop
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
            const virtualStoreDir = maybeQuotedValue
                .replace(/^"(.*)"$/, '$1')
                .replace(/^'(.*)'$/, '$1');
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

type IGetPkgNodeModules = (args: {
    pkgName: string;
    nodeModules: string;
    strict: boolean;
}) => Promise<string>;
export const getPkgNodeModules: IGetPkgNodeModules = async ({
    pkgName,
    nodeModules,
    strict,
}) => {
    try {
        const pkgPath = strict ?
        // We need to check if the option is a valid dependency of the
        // current project
            path.join(nodeModules, pkgName) :
            // Or we need to let node resolve it
            require.resolve(pkgName, {
                paths: [
                    nodeModules,
                ],
            });
        if (await fileExists(pkgPath)) {
            try {
                const nodePath = path.join(
                    await walkBack(strict ? await realpath(pkgPath) : pkgPath),
                );
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
