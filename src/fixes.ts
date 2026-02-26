import path from 'node:path';
import type { Configuration } from 'webpack';
import { createRequire } from './utils.js';

type FrameworkModule = {
    resource?: string;
};

type FrameworkCacheGroup = {
    test?: RegExp | ((mod: FrameworkModule) => boolean);
};

/**
 * Fix missing framework in development.
 * See https://github.com/Js-Brecht/gatsby-plugin-pnpm/issues/8
 */
export const fixFrameworkCache = (config: Configuration, siteDirectory: string) => {
    const splitChunks = config.optimization?.splitChunks;
    const framework = (
        splitChunks &&
        typeof splitChunks === 'object' &&
        splitChunks.cacheGroups &&
        typeof splitChunks.cacheGroups === 'object' &&
        'framework' in splitChunks.cacheGroups
            ? splitChunks.cacheGroups.framework
            : false
    ) as FrameworkCacheGroup | boolean;

    if (!framework) return;
    if (typeof framework !== 'object' || !framework.test) return;
    if (!(framework.test instanceof RegExp)) return;

    const regVal = framework.test
        .toString()
        .replace(/[[\\\]]/g, '')
        .slice(1, -1);
    const frameworkPackages = /\/\(([^)]+)\)\/$/.exec(regVal);
    const frameworkList: string[] = [];

    if (frameworkPackages?.[1]) {
        const frameworkRequire = createRequire(`${siteDirectory}/:internal:`);
        Object.assign(
            frameworkList,
            frameworkPackages[1]
                .split('|')
                .map((f) => {
                    try {
                        return path.dirname(frameworkRequire.resolve(`${f}/package.json`)) + path.sep;
                    } catch (err) {
                        return '';
                    }
                })
                .filter(Boolean),
        );
    }

    const isRootDependency = (val?: string) => frameworkList.some((f) => val?.startsWith(f));
    framework.test = (mod: FrameworkModule) => isRootDependency(mod.resource);
};
