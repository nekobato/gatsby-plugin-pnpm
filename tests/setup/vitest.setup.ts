import { afterEach, vi } from 'vitest';

const initialCwd = process.cwd();

afterEach(() => {
    vi.restoreAllMocks();
    process.chdir(initialCwd);
});
