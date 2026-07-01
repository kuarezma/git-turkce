const { parseGitHubInput, generateDefaultInstructions } = require('../app.js');

describe('GitHub Input Parser', () => {
    test('should parse standard https URL', () => {
        const result = parseGitHubInput('https://github.com/ollama/ollama');
        expect(result).toEqual({ owner: 'ollama', repo: 'ollama' });
    });

    test('should parse standard http URL', () => {
        const result = parseGitHubInput('http://github.com/ollama/ollama');
        expect(result).toEqual({ owner: 'ollama', repo: 'ollama' });
    });

    test('should parse URL with trailing slash', () => {
        const result = parseGitHubInput('https://github.com/ollama/ollama/');
        expect(result).toEqual({ owner: 'ollama', repo: 'ollama' });
    });

    test('should parse URL without protocol', () => {
        const result = parseGitHubInput('github.com/ollama/ollama');
        expect(result).toEqual({ owner: 'ollama', repo: 'ollama' });
    });

    test('should parse direct owner/repo format', () => {
        const result = parseGitHubInput('ollama/ollama');
        expect(result).toEqual({ owner: 'ollama', repo: 'ollama' });
    });

    test('should return null for search keywords', () => {
        const result = parseGitHubInput('ollama');
        expect(result).toBeNull();
    });

    test('should return null for multiple words query', () => {
        const result = parseGitHubInput('AI agents');
        expect(result).toBeNull();
    });
});

describe('Default Instructions Generator', () => {
    test('should generate JS/TS instructions', () => {
        const instructions = generateDefaultInstructions('next.js', 'vercel', 'TypeScript');
        expect(instructions).toContain('npm install');
        expect(instructions).toContain('npm run dev');
        expect(instructions).toContain('vercel/next.js');
    });

    test('should generate Python instructions', () => {
        const instructions = generateDefaultInstructions('autogen', 'microsoft', 'Python');
        expect(instructions).toContain('pip install -r requirements.txt');
        expect(instructions).toContain('python main.py');
    });

    test('should generate Rust instructions', () => {
        const instructions = generateDefaultInstructions('tauri', 'tauri-apps', 'Rust');
        expect(instructions).toContain('cargo run');
    });

    test('should generate Go instructions', () => {
        const instructions = generateDefaultInstructions('ollama', 'ollama', 'Go');
        expect(instructions).toContain('go mod download');
        expect(instructions).toContain('go run');
    });

    test('should generate fallback instructions for unknown languages', () => {
        const instructions = generateDefaultInstructions('some-repo', 'some-user', 'Assembly');
        expect(instructions).toContain('git clone');
        expect(instructions).toContain('Assembly gereksinimlerine göre');
    });
});
