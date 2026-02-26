import path from 'node:path';
import os from 'node:os';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { vi } from 'vitest';
import { isDir, fileExists, walkBack, realpath, getPkgNodeModules, getPnpmVirtualStoreDir } from '../src/utils';

const { resolve, join } = path;

describe('Utility function tests', () => {
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
        it('With node_modules as start, and with nested paths', async () => {
            const shouldBe = join(curDir, 'node_modules');
            expect(await walkBack(shouldBe)).toBe(shouldBe);
            expect(await walkBack(join(shouldBe, 'gatsby', 'dist'))).toBe(shouldBe);
        });
        it('With backslashes in path', async () => {
            const resolveSpy = vi.spyOn(path, 'resolve').mockImplementation((value) => value);
            const shouldBe = 'C:\\workspace\\node_modules';
            expect(await walkBack('C:\\workspace\\node_modules\\test\\dist')).toBe(shouldBe);
            resolveSpy.mockRestore();
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
            expect(
                await getPkgNodeModules({
                    pkgName: 'gatsby',
                    nodeModules: projectNodeModules,
                    strict: true,
                }),
            ).toBe(shouldBe);
        });
        it('Fails to resolve Gatsby with strict on and without direct dependency', async () => {
            const shouldBe = '';
            process.chdir(__dirname);
            expect(
                await getPkgNodeModules({
                    pkgName: 'gatsby',
                    nodeModules: join(__dirname, 'node_modules'),
                    strict: true,
                }),
            ).toBe(shouldBe);
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
                rmSync(target, { recursive: true, force: true });
            }
        };

        it('Falls back to default virtual store directory when no modules manifest exists', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(join(nodeModules, '.pnpm'));
            } finally {
                removeTempDir(tempDir);
            }
        });

        it('Resolves a relative virtualStoreDir from .modules.yaml', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                writeFileSync(join(nodeModules, '.modules.yaml'), 'virtualStoreDir: ../.cache/pnpm-store\n', 'utf8');
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(resolve(nodeModules, '../.cache/pnpm-store'));
            } finally {
                removeTempDir(tempDir);
            }
        });

        it('Resolves a quoted virtualStoreDir from .modules.yaml', async () => {
            const { tempDir, nodeModules } = createTempModulesDir();
            try {
                writeFileSync(join(nodeModules, '.modules.yaml'), 'virtualStoreDir: ".pnpm-custom"\n', 'utf8');
                expect(await getPnpmVirtualStoreDir(nodeModules)).toBe(join(nodeModules, '.pnpm-custom'));
            } finally {
                removeTempDir(tempDir);
            }
        });
    });
});
