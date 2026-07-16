const {
    parseGitHubInput,
    generateDefaultInstructions,
    validatePremiumLogin,
    escapeHtml,
    fetchWeeklyPopularRepos
} = require('../app.js');

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

describe('Premium Login Validation', () => {
    test('accepts the documented demo account', () => {
        expect(validatePremiumLogin('premium@gitturkce.com', 'premium123')).toEqual({
            isValid: true,
            message: ''
        });
    });

    test('normalizes email casing and surrounding spaces', () => {
        expect(validatePremiumLogin('  PREMIUM@GITTURKCE.COM ', 'premium123').isValid).toBe(true);
    });

    test('rejects malformed email addresses', () => {
        expect(validatePremiumLogin('premium', 'premium123')).toEqual({
            isValid: false,
            message: 'Geçerli bir e-posta adresi girin.'
        });
    });

    test('rejects short passwords', () => {
        expect(validatePremiumLogin('premium@gitturkce.com', '123')).toEqual({
            isValid: false,
            message: 'Şifre en az 6 karakter olmalıdır.'
        });
    });

    test('rejects unknown premium credentials', () => {
        expect(validatePremiumLogin('ogrenci@example.com', 'premium123')).toEqual({
            isValid: false,
            message: 'E-posta veya şifre hatalı. Demo hesap bilgilerini kullanın.'
        });
    });
});

describe('HTML Escaping', () => {
    test('escapes markup from external repository data', () => {
        expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
            '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
        );
    });

    test('converts non-string values safely', () => {
        expect(escapeHtml(42)).toBe('42');
    });
});

describe('Weekly Popular Repositories API', () => {
    let originalFetch;

    beforeAll(() => {
        originalFetch = global.fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test('should fetch and return weekly popular repositories', async () => {
        const mockRepos = [
            { name: 'repo1', stars: 100, language: 'JS' },
            { name: 'repo2', stars: 50, language: 'Python' }
        ];

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: mockRepos })
            })
        );

        const result = await fetchWeeklyPopularRepos();
        expect(result).toEqual(mockRepos);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.github.com/search/repositories')
        );
    });
});
