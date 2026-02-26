import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi, type Mock } from 'vitest';
import type { Configuration as WebpackConfig } from 'webpack';
import type { CreateWebpackConfigArgs as _CreateWebpackConfigArgs } from 'gatsby';
import { realpath, walkBack } from '../../../src/utils';
import { onCreateWebpackConfig as _onCreateWebpackConfig, IPluginOptions } from '../../../src/gatsby-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reporter = {
    warn: vi.fn((message: string): string => message),
    panic: vi.fn((message: string): string => message),
};

interface CreateWebpackConfigArgs {
    actions: {
        replaceWebpackConfig: Mock<(config: WebpackConfig) => WebpackConfig>;
    };
    reporter: typeof reporter;
    getConfig: _CreateWebpackConfigArgs['getConfig'];
    store: _CreateWebpackConfigArgs['store'];
}
type IOnCreateWebpackConfig = (actions: CreateWebpackConfigArgs, options?: IPluginOptions) => Promise<void>;

const uniq = (values: string[]): string[] => Array.from(new Set(values));

const getConfigResults = (resolutions: string[]): WebpackConfig => {
    return {
        resolve: {
            modules: uniq(resolutions),
        },
        resolveLoader: {
            modules: uniq(resolutions),
        },
    };
};

describe('Defining module/loader resolutions in silo', () => {
    const onCreateWebpackConfig = _onCreateWebpackConfig as unknown as IOnCreateWebpackConfig;
    const replaceWebpackConfig: CreateWebpackConfigArgs['actions']['replaceWebpackConfig'] = vi.fn((config) => config);
    const actions: CreateWebpackConfigArgs['actions'] = {
        replaceWebpackConfig,
    };
    const args: CreateWebpackConfigArgs = {
        actions,
        reporter,
        getConfig: () => ({}),
        store: {
            dispatch: vi.fn(),
            replaceReducer: vi.fn(),
            subscribe: vi.fn(),
            getState: () => ({
                program: {
                    directory: process.cwd(),
                },
            }),
        },
    };

    const curDir = path.resolve(__dirname, '..');
    const testsDir = path.resolve(curDir, '..');
    const testsNodeModules = path.join(testsDir, 'node_modules');
    const rootDir = path.resolve(curDir, '..', '..');
    const rootNodeModules = path.join(rootDir, 'node_modules');

    describe('Resolves with strict mode correctly', () => {
        beforeEach(() => {
            replaceWebpackConfig.mockReset();
            Object.entries(reporter).forEach(([key, fn]) => {
                fn.mockReset();
            });
        });

        it('With strict off', async () => {
            process.chdir(__dirname);
            const resolutions = [
                'node_modules',
                path.resolve(path.join(__dirname, 'node_modules')),
                await walkBack(await realpath(path.join(rootNodeModules, 'gatsby'))),
                path.resolve('node_modules', '.pnpm', 'node_modules'),
            ];
            const shouldEqual = getConfigResults(resolutions);
            await onCreateWebpackConfig(args, {
                strict: false,
            });
            expect(replaceWebpackConfig).toHaveBeenLastCalledWith(shouldEqual);
        });
        it('With strict off, include package name', async () => {
            process.chdir(__dirname);
            const resolutions = [
                'node_modules',
                path.resolve(path.join(__dirname, 'node_modules')),
                await walkBack(await realpath(path.join(rootNodeModules, 'gatsby'))),
                path.resolve('node_modules', '.pnpm', 'node_modules'),
                await walkBack(await realpath(path.join(rootNodeModules, 'vitest'))),
            ];
            const shouldEqual = getConfigResults(resolutions);
            await onCreateWebpackConfig(args, {
                strict: false,
                include: ['vitest'],
            });
            expect(replaceWebpackConfig).toHaveBeenLastCalledWith(shouldEqual);
        });
        it('With strict off, include package name and directory', async () => {
            process.chdir(__dirname);
            const resolutions = [
                'node_modules',
                path.resolve(path.join(__dirname, 'node_modules')),
                await walkBack(await realpath(path.join(rootNodeModules, 'gatsby'))),
                path.resolve('node_modules', '.pnpm', 'node_modules'),
                path.join(curDir, 'node_modules'),
                rootNodeModules,
            ];
            const shouldEqual = getConfigResults(resolutions);
            await onCreateWebpackConfig(args, {
                strict: false,
                include: ['silo-foo-package', '../../../node_modules'],
            });
            expect(replaceWebpackConfig).toHaveBeenLastCalledWith(shouldEqual);
        });

        it('Panics with strict on, and no Gatsby', async () => {
            process.chdir(__dirname);
            await onCreateWebpackConfig(args, {
                strict: true,
            });
            expect(reporter.panic).toHaveBeenCalledTimes(1);
        });
    });

    describe('Resolves with projectPath correctly', () => {
        beforeEach(() => {
            replaceWebpackConfig.mockReset();
            Object.entries(reporter).forEach(([key, fn]) => {
                fn.mockReset();
            });
        });

        it('With strict off, and package includes', async () => {
            const resolutions = [
                'node_modules',
                path.join(testsNodeModules),
                await walkBack(await realpath(path.join(rootNodeModules, 'gatsby'))),
                path.resolve(path.join(testsNodeModules, '.pnpm', 'node_modules')),
                await walkBack(await realpath(path.join(rootNodeModules, 'vitest'))),
                path.join(testsDir, 'node_modules'),
            ];
            const shouldEqual = getConfigResults(resolutions);
            await onCreateWebpackConfig(args, {
                strict: false,
                include: ['vitest', 'foo-package'],
                projectPath: testsDir,
            });
            expect(replaceWebpackConfig).toHaveBeenLastCalledWith(shouldEqual);
        });

        it('With strict on, and package and directory includes', async () => {
            const resolutions = [
                'node_modules',
                rootNodeModules,
                await walkBack(await realpath(path.join(rootNodeModules, 'gatsby'))),
                path.join(rootNodeModules, '.pnpm', 'node_modules'),
                await walkBack(await realpath(path.join(rootNodeModules, 'vitest'))),
                curDir,
                rootDir,
            ];
            const shouldEqual = getConfigResults(resolutions);
            await onCreateWebpackConfig(args, {
                strict: true,
                include: ['vitest', curDir, '.'],
                projectPath: rootDir,
            });
            expect(replaceWebpackConfig).toHaveBeenLastCalledWith(shouldEqual);
        });

        it('With strict on, and panic with no Gatsby', async () => {
            await onCreateWebpackConfig(args, {
                strict: true,
                projectPath: testsDir,
            });
            expect(reporter.panic).toHaveBeenCalledTimes(1);
        });
    });
});
