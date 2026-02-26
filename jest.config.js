const path = require('path');
const projectPath = __dirname;
const tsConfigPath = path.join(projectPath, 'tsconfig.json');

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
    testPathIgnorePatterns: [
        `${projectPath}/tests/silo`,
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/test/',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
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
