const path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');
const projectPath = __dirname;
const tsConfigPath = path.join(rootDir, 'tsconfig.json');

const { compilerOptions } = require(tsConfigPath);

const jestConfig = {
    rootDir: projectPath,
    transform: {
        '^.+\\.(ts|tsx)$': [
            '@swc/jest',
            {
                sourceMaps: 'inline',
                jsc: {
                    parser: {
                        syntax: 'typescript',
                        tsx: true,
                    },
                    target: 'es2020',
                },
                module: {
                    type: 'commonjs',
                },
            },
        ],
    },
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
    ],
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/test/',
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 95,
            lines: 95,
            statements: 95,
        },
    },
    collectCoverageFrom: [
        'src/*.{js,ts}',
    ],
};

if (compilerOptions.paths) {
    Object.assign(jestConfig, {
        moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
            prefix: `${projectPath}/`,
        }),
    });
}

module.exports = jestConfig;
