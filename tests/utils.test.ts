import * as path from 'path';
import * as os from 'os';
import { existsSync, mkdirSync, mkdtempSync, rmdirSync, writeFileSync } from 'fs';
import { mocked } from 'ts-jest/utils';
import {
    isDir,
    fileExists,
    walkBack,
    realpath,
    getPkgNodeModules,
    getPnpmVirtualStoreDir,
} from '../src/utils';

jest.mock('path');
const { resolve, join } = jest.requireActual('path');

describe('Utility function tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mocked(path.resolve).mockImplementation((...str) => resolve(...str));
        mocked(path.join).mockImplementation((...str) => join(...str));
    });

    const curDir = process.cwd();
    const curFile = join(curDir, 'package.json');
    const projectNodeModules = join(curDir, 'node_modules');

    it('isDir() is accurate', async () => {
        expect(await isDir(curDir)).toBe(true);
        expect(await isDir(curFile)).toBe(false);
    });
    it('fileExists() is accurate', async () => {
        expect(await fileExists(curFile)).not.toBe(void 0);
        expect(await fileExists(join(curDir, 'asdf'))).toBe(void 0);
    });
    describe('walkBack() is accurate', () => {
        beforeEach(() => {
            mocked(path.resolve).mockImplementation((str) => str);
        });

        it('With node_modules as start, and with nested paths', async () => {
            const shouldBe = join(curDir, 'node_modules');
            expect(await walkBack(shouldBe)).toBe(shouldBe);
            expect(await walkBack(join(shouldBe, 'gatsby', 'dist'))).toBe(shouldBe);
        });
        it('With backslashes in path', async () => {
            const shouldBe = join(curDir, 'node_modules').replace(/\//g, '\\');
            expect(await walkBack(join(shouldBe, 'test', 'dist').replace(/\//g, '\\'))).toBe(shouldBe);
        });
        it('Returns 0-length string at beginning of tree', async () => {
            const shouldBe = '';
            expect(await walkBack(resolve('/'))).toBe(shouldBe);
        });
        it('Returns 0-length string when no "node_modules" exists in path', async () => {
            const shouldBe = '';
            expect(await walkBack('/asdf/123/4321/fdsa/foo/bar/baz/boom')).toBe(shouldBe);
        });
    });
    describe('getPkgNodeModules() is accurate', () => {
        beforeEach(() => {
            process.chdir(curDir);
        });

        it('Resolves Gatsby with strict mode correctly', async () => {
            const shouldBe = await walkBack(await realpath(join(curDir, 'node_modules', 'gatsby')));
            expect(await getPkgNodeModules({
                pkgName: 'gatsby',
                nodeModules: projectNodeModules,
                strict: true,
            })).toBe(shouldBe);
        });
        it('Fails to resolve Gatsby with strict on and without direct dependency', async () => {
            const shouldBe = '';
            process.chdir(__dirname);
            expect(await getPkgNodeModules({
                pkgName: 'gatsby',
                nodeModules: join(__dirname, 'node_modules'),
                strict: true,
            })).toBe(shouldBe);
        });
    });

    describe('getPnpmVirtualStoreDir() is accurate', () => {
        const createTempModulesDir = () => {
            const tempDir = mkdtempSync(join(os.tmpdir(), 'gatsby-plugin-pnpm-'));
            const nodeModules = join(tempDir, 'node_modules');
            mkdirSync(nodeModules, { recursive: true });
            return { tempDir, nodeModules };
        };

        const removeTempDir = (target: string) => {
            if (existsSync(target)) {
                rmdirSync(target, { recursive: true });
            }
        };

        it('Falls back to default virtual store directory when no modules manifest exists', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(
                    join(nodeModules, '.pnpm'),
                );
            } finally {
                removeTempDir(tempDir);
            }
        });

        it('Resolves a relative virtualStoreDir from .modules.yaml', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                writeFileSync(
                    join(nodeModules, '.modules.yaml'),
                    'virtualStoreDir: ../.cache/pnpm-store\n',
                    'utf8',
                );
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(
                    resolve(nodeModules, '../.cache/pnpm-store'),
                );
            } finally {
                removeTempDir(tempDir);
            }
        });

        it('Resolves a quoted virtualStoreDir from .modules.yaml', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                writeFileSync(
                    join(nodeModules, '.modules.yaml'),
                    'virtualStoreDir: ".pnpm-custom"\n',
                    'utf8',
                );
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(
                    join(nodeModules, '.pnpm-custom'),
                );
            } finally {
                removeTempDir(tempDir);
            }
        });
    });
});
