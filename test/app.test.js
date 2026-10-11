const {
    parseGitHubInput,
    generateDefaultInstructions,
    validatePremiumLogin,
    escapeHtml,
    fetchWeeklyPopularRepos,
    fetchMostStarredRepos,
    fetchAgentRepos,
    fetchSkillsRepos,
    getSmartDomainExplanation,
    findSpecificKnowledge,
    cleanReadmeText,
    fetchReadmeExcerpt,
    translateAndSummarize,
    REPO_SPECIFIC_KNOWLEDGE,
    state
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

    test('should fetch and return top 100 most starred repositories', async () => {
        const mockRepos = [
            { name: 'repo-star-1', stars: 50000, language: 'Go' },
            { name: 'repo-star-2', stars: 45000, language: 'Rust' }
        ];

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: mockRepos })
            })
        );

        const result = await fetchMostStarredRepos();
        expect(result).toEqual(mockRepos);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.github.com/search/repositories?q=stars')
        );
    });

    test('should fetch and return agent repositories', async () => {
        const mockRepos = [{ name: 'agent-1', stars: 2000 }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: mockRepos })
            })
        );
        const result = await fetchAgentRepos();
        expect(result).toEqual(mockRepos);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('agent')
        );
    });

    test('should fetch and return skills repositories', async () => {
        const mockRepos = [{ name: 'skills-1', stars: 1000 }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: mockRepos })
            })
        );
        const result = await fetchSkillsRepos();
        expect(result).toEqual(mockRepos);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('mcp')
        );
    });
});

describe('Repo Specific Turkish Explanations', () => {
    test('should return rich specific knowledge for curated repo react', () => {
        const info = getSmartDomainExplanation({ name: 'react', owner: 'react', description: 'A JavaScript library for building user interfaces' });
        expect(info.turkishTitle).toContain('React');
        expect(info.beginnerExplanation).toContain('Instagram');
        expect(info.beginnerExplanation).not.toContain('yapboz parçası gibidir');
    });

    test('should return rich specific knowledge for curated repo yt-dlp', () => {
        const info = getSmartDomainExplanation({ name: 'yt-dlp', owner: 'yt-dlp', description: 'A youtube-dl fork with additional features' });
        expect(info.turkishTitle).toContain('Video');
        expect(info.beginnerExplanation).toContain('MP3');
        expect(info.beginnerExplanation).not.toContain('tekerleği yeniden icat etmemek');
    });

    test('should dynamically classify an unknown AI agent repo', () => {
        const info = getSmartDomainExplanation({ name: 'super-ai-agent', description: 'Autonomous agent framework for multi-step reasoning' });
        expect(info.turkishTitle).toContain('Yapay Zeka Ajanı');
        expect(info.beginnerExplanation).toContain('dijital bir asistandır');
    });

    test('should dynamically classify an unknown database repo', () => {
        const info = getSmartDomainExplanation({ name: 'fast-kv-db', description: 'Ultra fast key-value database storage engine' });
        expect(info.turkishTitle).toContain('Veritabanı');
        expect(info.beginnerExplanation).toContain('dijital kasadır');
    });

    test('should not match keywords inside longer words', () => {
        // "build" ve "guide" içinde "ui" geçer; arayüz kütüphanesi sayılmamalı.
        const info = getSmartDomainExplanation({ name: 'build-guide', description: 'A guide to build things' });
        expect(info.turkishTitle).not.toContain('Arayüz');
    });

    test('should still match plural and hyphenated keywords', () => {
        const info = getSmartDomainExplanation({ name: 'mini', description: 'Small tools for agents', topics: ['llm-agents'] });
        expect(info.turkishTitle).toContain('Yapay Zeka Ajanı');
    });
});

describe('Favoriler ve dil filtresi', () => {
    let app;
    let storage;
    let nodes;
    let originalGlobals;
    const storageKey = 'git_tr_bookmarks';
    const repo = {
        name: 'example-repo',
        owner: { login: 'ugur' },
        stargazers_count: 42,
        language: 'Python',
        description: 'Example repository',
        html_url: 'https://github.com/ugur/example-repo'
    };

    function loadApp() {
        let loaded;
        // Her yüklemede ayrı state oluştur; mevcut testlerin modülüne dokunma.
        jest.isolateModules(() => {
            loaded = require('../app.js');
        });
        return loaded;
    }

    beforeEach(() => {
        jest.useFakeTimers();
        storage = new Map();
        nodes = {
            'favorites-count': { textContent: '' },
            'curated-grid': { innerHTML: '' },
            'modal-bookmark-btn': { textContent: '', classList: { toggle: jest.fn() } },
            toast: {
                textContent: '',
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() }
            }
        };
        const stubs = {
            localStorage: {
                getItem: jest.fn(key => storage.get(key) ?? null),
                setItem: jest.fn((key, value) => storage.set(key, String(value)))
            },
            document: {
                getElementById: jest.fn(id => nodes[id] || null),
                querySelectorAll: jest.fn(() => []),
                // Başlangıç işlemlerini çalıştırmadan yalnız gerekli DOM'u sağla.
                addEventListener: jest.fn()
            },
            CURATED_REPOSITORIES: []
        };
        originalGlobals = Object.keys(stubs).map(key => [
            key, Object.getOwnPropertyDescriptor(global, key)
        ]);
        for (const [key, value] of Object.entries(stubs)) {
            Object.defineProperty(global, key, { configurable: true, writable: true, value });
        }
        app = loadApp();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        for (const [key, descriptor] of originalGlobals) {
            if (descriptor) Object.defineProperty(global, key, descriptor);
            else delete global[key];
        }
    });

    test('kayıt yoksa favoriler boş başlar', () => {
        expect(app.getBookmarks()).toEqual([]);
        expect(global.localStorage.getItem).toHaveBeenCalledWith(storageKey);
    });

    test('saveBookmarks listeyi doğru anahtarla kaydeder ve sayacı günceller', () => {
        app.saveBookmarks([repo]);
        expect(app.getBookmarks()).toEqual([repo]);
        expect(global.localStorage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify([repo]));
        expect(nodes['favorites-count'].textContent).toBe(1);
    });

    test('kaydedilen favoriler yeni modül yüklemesinde geri gelir', () => {
        app.saveBookmarks([repo]);
        const reloaded = loadApp();
        expect(reloaded.state).not.toBe(app.state);
        expect(reloaded.getBookmarks()).toEqual([repo]);
        expect(reloaded.isBookmarked(repo)).toBe(true);
    });

    test('bozuk kayıt uygulama yüklenirken boş listeye döner', () => {
        storage.set(storageKey, '{invalid');
        expect(loadApp().getBookmarks()).toEqual([]);
    });

    test('boş listeyi kaydetmek kalıcı favorileri temizler', () => {
        app.saveBookmarks([repo]);
        app.saveBookmarks([]);
        expect(storage.get(storageKey)).toBe('[]');
        expect(loadApp().getBookmarks()).toEqual([]);
        expect(nodes['favorites-count'].textContent).toBe(0);
    });

    test('isBookmarked kayıtlı ve kayıtsız isimleri ayırt eder', () => {
        app.saveBookmarks([repo]);
        expect(app.isBookmarked({ name: repo.name })).toBe(true);
        expect(app.isBookmarked({ name: 'other-repo' })).toBe(false);
    });

    test.each([null, undefined])('isBookmarked boş repo için false döner: %s', emptyRepo => {
        expect(app.isBookmarked(emptyRepo)).toBe(false);
    });

    test('isBookmarked name ve full_name alanlarını karşılıklı eşleştirir', () => {
        app.saveBookmarks([{ full_name: 'ugur/example-repo' }]);
        expect(app.isBookmarked({ name: 'ugur/example-repo' })).toBe(true);
        expect(app.isBookmarked({ full_name: 'ugur/example-repo' })).toBe(true);
        expect(app.isBookmarked({ full_name: 'other/example-repo' })).toBe(false);
        app.saveBookmarks([{ name: 'ugur/example-repo' }]);
        expect(app.isBookmarked({ full_name: 'ugur/example-repo' })).toBe(true);
    });

    test('iki alan varsa isBookmarked name alanını önceliklendirir', () => {
        app.saveBookmarks([{ name: repo.name, full_name: 'ugur/other-repo' }]);
        expect(app.isBookmarked({ name: repo.name, full_name: 'different/name' })).toBe(true);
        expect(app.isBookmarked({ full_name: 'ugur/other-repo' })).toBe(false);
    });

    test('toggleBookmark repo ekler ve kaydı kalıcı hale getirir', () => {
        app.toggleBookmark(repo);
        expect(app.getBookmarks()).toHaveLength(1);
        expect(app.getBookmarks()[0]).toEqual(expect.objectContaining({
            name: repo.name,
            owner: 'ugur',
            stars: 42,
            language: 'Python',
            description: repo.description,
            githubUrl: repo.html_url
        }));
        expect(app.isBookmarked(repo)).toBe(true);
        expect(loadApp().getBookmarks()).toEqual(app.getBookmarks());
        expect(nodes.toast.textContent).toContain('favorilere eklendi');
        expect(nodes['modal-bookmark-btn'].classList.toggle).toHaveBeenCalledWith('active', true);
    });

    test('toggleBookmark ikinci çağrıda repo çıkarır ve diğer favorileri korur', () => {
        const other = { name: 'other-repo' };
        app.saveBookmarks([other]);
        app.toggleBookmark(repo);
        app.toggleBookmark(repo);
        expect(app.getBookmarks()).toEqual([other]);
        expect(app.isBookmarked(repo)).toBe(false);
        expect(loadApp().getBookmarks()).toEqual([other]);
        expect(nodes.toast.textContent).toContain('favorilerden çıkarıldı');
        expect(nodes['favorites-count'].textContent).toBe(1);
        expect(nodes['modal-bookmark-btn'].classList.toggle).toHaveBeenLastCalledWith('active', false);
    });

    test('toggleBookmark kayıtlı full_name ile eşleşen name değerini çıkarır', () => {
        app.saveBookmarks([{ full_name: repo.name }]);
        app.toggleBookmark(repo);
        expect(app.getBookmarks()).toEqual([]);
        expect(storage.get(storageKey)).toBe('[]');
    });

    test.each([null, undefined])('toggleBookmark boş repo için değişiklik yapmaz: %s', emptyRepo => {
        app.saveBookmarks([repo]);
        global.localStorage.setItem.mockClear();
        app.toggleBookmark(emptyRepo);
        expect(app.getBookmarks()).toEqual([repo]);
        expect(global.localStorage.setItem).not.toHaveBeenCalled();
        expect(nodes.toast.classList.add).not.toHaveBeenCalled();
    });

    test('all filtresi boş dil dahil bütün repoları korur', () => {
        const repos = [repo, { language: null }, {}];
        app.state.languageFilter = 'all';
        expect(app.filterByLanguage(repos)).toBe(repos);
    });

    test('tek dil filtresi yalnız eşleşen repoları döndürür ve girdiyi değiştirmez', () => {
        const pythonRepo = Object.freeze({ language: 'Python' });
        const repos = Object.freeze([pythonRepo, Object.freeze({ language: 'Go' })]);
        app.state.languageFilter = 'python';
        expect(app.filterByLanguage(repos)).toEqual([pythonRepo]);
        expect(repos).toHaveLength(2);
    });

    test('dil filtresi ve repo dili büyük/küçük harften etkilenmez', () => {
        const repos = [{ language: 'PYTHON' }, { language: 'pYtHoN' }, { language: 'Go' }];
        app.state.languageFilter = 'PyThOn';
        expect(app.filterByLanguage(repos)).toEqual(repos.slice(0, 2));
    });

    test('C/C++ filtresi yalnız C ve C++ repolarını döndürür', () => {
        const repos = [
            { language: 'C' },
            { language: 'C++' },
            { language: 'JavaScript' },
            { language: 'C#' },
            { language: 'CSS' },
            { language: 'Objective-C' }
        ];
        app.state.languageFilter = 'C++';
        expect(app.filterByLanguage(repos)).toEqual(repos.slice(0, 2));
    });

    test('aktif dil filtresi boş, null ve eksik dil alanlarını eler', () => {
        app.state.languageFilter = 'python';
        expect(app.filterByLanguage([{ language: '' }, { language: null }, {}])).toEqual([]);
    });

    test('aktif dil filtresinde boş girdi boş sonuç verir', () => {
        app.state.languageFilter = 'python';
        expect(app.filterByLanguage([])).toEqual([]);
    });
});

describe('Seçkin repo bilgi tablosu (knowledge.js)', () => {
    const fs = require('fs');
    const path = require('path');
    const knowledge = require('../knowledge.js');
    const curated = new Function(
        `${fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8')}; return CURATED_REPOSITORIES;`
    )();
    const legacy = require('../app.js').REPO_SPECIFIC_KNOWLEDGE;

    afterEach(() => {
        delete global.REPO_KNOWLEDGE;
    });

    test('her seçkin repo için repoya özel bilgi vardır', () => {
        const missing = curated.filter(repo =>
            !legacy[`${repo.owner}/${repo.name}`.toLowerCase()] && !knowledge[`${repo.owner}/${repo.name}`.toLowerCase()]
        );
        expect(missing.map(repo => `${repo.owner}/${repo.name}`)).toEqual([]);
    });

    test('bütün kayıtlarda dört alan dolu ve örnek kalıbı var', () => {
        for (const [key, entry] of Object.entries(knowledge)) {
            for (const field of ['turkishTitle', 'turkishSummary', 'whyUseful', 'beginnerExplanation']) {
                expect(typeof entry[field]).toBe('string');
                expect(entry[field].trim().length).toBeGreaterThan(15);
            }
            expect(entry.beginnerExplanation).toContain('<br><br><strong>Gerçekçi Örnek:</strong>');
            const withoutAllowedTags = entry.beginnerExplanation.replace(/<br><br>|<strong>|<\/strong>/g, '');
            expect(`${key}: ${/[<>]/.test(withoutAllowedTags)}`).toBe(`${key}: false`);
        }
    });

    test('iki repo aynı özet cümlesini paylaşmaz', () => {
        const seen = new Map();
        for (const [key, entry] of Object.entries(knowledge)) {
            expect(seen.has(entry.turkishSummary) ? `${key} = ${seen.get(entry.turkishSummary)}` : null).toBeNull();
            seen.set(entry.turkishSummary, key);
        }
    });

    test('aynı ada sahip repolar sahibine göre ayrılır', () => {
        global.REPO_KNOWLEDGE = knowledge;
        const anthropic = getSmartDomainExplanation({ name: 'skills', owner: 'anthropics' });
        const pocock = getSmartDomainExplanation({ name: 'skills', owner: { login: 'mattpocock' } });
        expect(anthropic).toBe(knowledge['anthropics/skills']);
        expect(pocock).toBe(knowledge['mattpocock/skills']);
        expect(anthropic.turkishSummary).not.toBe(pocock.turkishSummary);
    });
});


describe('README prose cleaning', () => {
    test('removes decoration and code while retaining plain text and inline link labels', () => {
        const markdown = [
            '# Small heading',
            '[![Build badge](https://shields.io/build)](https://example.com)',
            '<!-- Hidden comment that must never reach the summary -->',
            '<div>A useful paragraph describing the actual project purpose.</div>',
            '![Project illustration](https://example.com/long-image.png)',
            '[Documentation link](https://example.com/documentation)',
            '- [A longer standalone documentation link](https://example.com/documentation)',
            'https://example.com/documentation/very-long-url',
            '[docs]: https://example.com/documentation',
            'Please sponsor this project to support its maintenance.',
            '```js',
            'const hiddenCode = "must never appear in the summary";',
            '```',
            '~~~python',
            'print("this code should be removed from the summary")',
            '~~~',
            '    const indentedCode = "also remove this code";',
            '-----------------------------------------',
            'Read the [practical guide](https://example.com/guide) to learn how this project works.'
        ].join('\n');
        expect(cleanReadmeText(markdown)).toBe(
            'A useful paragraph describing the actual project purpose.\n' +
            'Read the practical guide to learn how this project works.'
        );
    });

    test('preserves paragraph boundaries for the translation excerpt', () => {
        const text = 'The first paragraph explains the project purpose.\n\nThe second paragraph has detailed setup instructions.';
        expect(cleanReadmeText(text)).toBe(text);
    });

    test('removes link targets when the link text wraps across lines', () => {
        const text = 'It has binary downloads available for [every\nrelease](https://example.com/releases). It is similar to other tools.';
        const cleaned = cleanReadmeText(text);
        expect(cleaned).toContain('every release');
        expect(cleaned).not.toContain('https://');
        expect(cleaned).not.toContain('](');
    });

    test('drops empty-text linked images left over from badges', () => {
        const text = '[![Build status](https://ci.example.com/badge.svg)](https://ci.example.com)\n\nA real paragraph that describes what the project does.';
        expect(cleanReadmeText(text)).toBe('A real paragraph that describes what the project does.');
    });

    test('limits the output length and uses a 1200 character default', () => {
        expect(cleanReadmeText('a'.repeat(1500))).toHaveLength(1200);
        expect(cleanReadmeText('a'.repeat(100), 40)).toBe('a'.repeat(40));
        expect(cleanReadmeText('a'.repeat(100), 0)).toBe('');
    });

    test.each(['', null, undefined, 42, {}])('returns empty text for invalid input: %s', value => {
        expect(cleanReadmeText(value)).toBe('');
    });

    test('drops lines of 25 characters or less and unterminated fences', () => {
        expect(cleanReadmeText('x'.repeat(25) + '\n' + 'y'.repeat(26) + '\n```\n' + 'z'.repeat(40))).toBe('y'.repeat(26));
    });
});

describe('Repository explanations from source data', () => {
    let originalGlobals;
    let originalApiKey;
    const repo = {
        name: 'unlisted-project', owner: { login: 'example' },
        description: 'A practical collection of classroom learning material.',
        language: 'Python', stargazers_count: 42, topics: ['education', 'math']
    };
    const paragraph = 'This collection contains classroom exercises and their worked solutions.';
    const translatedParagraph = 'Bu derleme sınıf alıştırmalarını ve adım adım çözümlerini içerir.';

    beforeEach(() => {
        originalGlobals = ['fetch', 'REPO_KNOWLEDGE'].map(key => [
            key, Object.getOwnPropertyDescriptor(global, key)
        ]);
        originalApiKey = state.geminiApiKey;
        state.geminiApiKey = '';
        global.REPO_KNOWLEDGE = {};
    });

    afterEach(() => {
        state.geminiApiKey = originalApiKey;
        for (const [key, descriptor] of originalGlobals) {
            if (descriptor) Object.defineProperty(global, key, descriptor);
            else delete global[key];
        }
    });

    function mockSources(readme = paragraph, translation = translatedParagraph) {
        global.fetch = jest.fn(async url => {
            if (url.endsWith('/readme')) return { ok: true, text: async () => readme };
            const text = new URL(url).searchParams.get('q');
            return { ok: true, json: async () => ({ responseData: {
                translatedText: text === repo.description ? 'Sınıf için hazırlanmış bir öğrenme derlemesi.' : translation
            } }) };
        });
    }

    test('fetches raw README text and cleans it', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '# Short\n' + paragraph });
        await expect(fetchReadmeExcerpt('example', repo.name)).resolves.toBe(paragraph);
        expect(global.fetch).toHaveBeenCalledWith(`https://api.github.com/repos/example/${repo.name}/readme`, {
            method: 'GET', headers: { Accept: 'application/vnd.github.raw' }
        });
    });

    test('returns empty README on HTTP failure including rate limits', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
        await expect(fetchReadmeExcerpt('example', repo.name)).resolves.toBe('');
    });

    test('returns empty README when fetch rejects', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
        await expect(fetchReadmeExcerpt('example', repo.name)).resolves.toBe('');
    });

    test('returns empty README when reading the body fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => { throw new Error('body failure'); } });
        await expect(fetchReadmeExcerpt('example', repo.name)).resolves.toBe('');
    });

    test.each(['Example', { login: 'Example' }])('matches lower-case owner/name keys for owner %p', owner => {
        const knowledge = { turkishTitle: 'Özel açıklama' };
        global.REPO_KNOWLEDGE = { 'example/react': knowledge };
        expect(findSpecificKnowledge({ owner, name: 'React' })).toBe(knowledge);
        expect(getSmartDomainExplanation({ owner, name: 'React' })).toBe(knowledge);
    });

    test('prefers owner/name knowledge over legacy names', () => {
        const knowledge = { turkishTitle: 'Sahibine özel React' };
        global.REPO_KNOWLEDGE = { 'example/react': knowledge };
        expect(findSpecificKnowledge({ owner: 'example', name: 'react' })).toBe(knowledge);
    });

    test('falls back to legacy repo knowledge by owner/name', () => {
        delete global.REPO_KNOWLEDGE;
        expect(findSpecificKnowledge({ owner: 'react', name: 'react' })).toBe(REPO_SPECIFIC_KNOWLEDGE['react/react']);
    });

    test('does not reuse curated knowledge for a same-named repo from another owner', () => {
        delete global.REPO_KNOWLEDGE;
        expect(findSpecificKnowledge({ owner: 'someone-else', name: 'react' })).toBeNull();
        expect(findSpecificKnowledge({ name: 'react' })).toBeNull();
    });

    test('returns null for unknown repositories', () => {
        expect(findSpecificKnowledge(repo)).toBeNull();
    });

    test('never fetches for known repositories even with a Gemini key', async () => {
        state.geminiApiKey = 'test-only-key';
        const knowledge = { turkishTitle: 'Özel', turkishSummary: 'Kayıtlı açıklama' };
        global.REPO_KNOWLEDGE = { 'example/unlisted-project': knowledge };
        global.fetch = jest.fn();
        await expect(translateAndSummarize(repo)).resolves.toEqual({
            ...knowledge, howToUse: generateDefaultInstructions(repo.name, 'example', 'Python')
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('returns legacy knowledge without making network requests', async () => {
        global.fetch = jest.fn();
        const result = await translateAndSummarize({ name: 'react', owner: 'react', language: 'JavaScript' });
        expect(result).toEqual({
            ...REPO_SPECIFIC_KNOWLEDGE['react/react'],
            howToUse: generateDefaultInstructions('react', 'react', 'JavaScript')
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('uses translated README and repository facts instead of boilerplate', async () => {
        mockSources();
        const result = await translateAndSummarize(repo);
        expect(result.turkishSummary).toBe('Sınıf için hazırlanmış bir öğrenme derlemesi.');
        expect(result.beginnerExplanation).toContain(translatedParagraph);
        expect(result.beginnerExplanation).toContain("README'nin otomatik çevirisidir");
        expect(result.whyUseful).toBe('Ana dili Python. 42 yıldızı var. Konu etiketleri: education, math.');
        expect(result.beginnerExplanation).not.toContain('açık kaynaklı bir araçtır');
    });

    test('escapes HTML in translated README text', async () => {
        mockSources(paragraph, '<script>alert(1)</script>');
        const result = await translateAndSummarize(repo);
        expect(result.beginnerExplanation).toContain('&lt;script&gt;');
        expect(result.beginnerExplanation).not.toContain('<script>');
    });

    test('translates only the first paragraph and cuts at a sentence boundary', async () => {
        const firstSentence = 'This first sentence explains the purpose of the collection.';
        mockSources(firstSentence + ' ' + 'Long additional details '.repeat(30) + '\n\nAnother paragraph that should not be sent for translation.');
        await translateAndSummarize(repo);
        const translationCalls = global.fetch.mock.calls.filter(([url]) => url.includes('mymemory'));
        expect(translationCalls).toHaveLength(2);
        expect(new URL(translationCalls[1][0]).searchParams.get('q')).toBe(firstSentence);
    });

    test('ignores MyMemory warning responses', async () => {
        global.fetch = jest.fn(async url => url.endsWith('/readme')
            ? { ok: true, text: async () => paragraph }
            : { ok: true, json: async () => ({ responseData: { translatedText: 'MYMEMORY WARNING: quota exceeded' } }) });
        const result = await translateAndSummarize(repo);
        const fallback = getSmartDomainExplanation(repo);
        expect(result.turkishSummary).toBe(fallback.turkishSummary);
        expect(result.beginnerExplanation).toBe(fallback.beginnerExplanation);
    });

    test('keeps README translation when description translation fails', async () => {
        mockSources();
        global.fetch.mockImplementationOnce(async () => { throw new Error('translation offline'); });
        const result = await translateAndSummarize(repo);
        expect(result.turkishSummary).toBe(getSmartDomainExplanation(repo).turkishSummary);
        expect(result.beginnerExplanation).toContain(translatedParagraph);
    });

    test('omits missing facts and preserves zero stars', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
        const result = await translateAndSummarize({ name: repo.name, owner: 'example', stars: 0 });
        expect(result.whyUseful).toBe('0 yıldızı var.');
    });

    test('falls back without throwing when all fetch calls reject', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
        const unknown = { name: repo.name, owner: 'example', description: repo.description };
        const result = await translateAndSummarize(unknown);
        const fallback = getSmartDomainExplanation(unknown);
        expect(result).toEqual(expect.objectContaining({
            turkishSummary: fallback.turkishSummary,
            whyUseful: fallback.whyUseful,
            beginnerExplanation: fallback.beginnerExplanation
        }));
    });

    test('adds README, topics, license and factual rules to the Gemini prompt without changing its JSON mode', async () => {
        state.geminiApiKey = 'test-only-key';
        const aiResult = { turkishTitle: 'Derleme', turkishSummary: 'Açıklama', whyUseful: 'Yarar', beginnerExplanation: 'Örnek', howToUse: 'Kullanım' };
        global.fetch = jest.fn(async url => url.endsWith('/readme')
            ? { ok: true, text: async () => paragraph }
            : { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(aiResult) }] } }] }) });
        await expect(translateAndSummarize({ ...repo, license: { spdx_id: 'MIT' } })).resolves.toEqual(aiResult);
        const body = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(body.generationConfig.responseMimeType).toBe('application/json');
        const prompt = body.contents[0].parts[0].text;
        expect(prompt).toContain('- Topics: education, math');
        expect(prompt).toContain('- License: MIT');
        expect(prompt).toContain('- README excerpt (cleaned): ' + paragraph);
        expect(prompt).toContain('Do not invent numbers or features');
        expect(prompt).toContain('non-software repositories');
    });

    test('falls back after Gemini and README failures', async () => {
        state.geminiApiKey = 'test-only-key';
        global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
        await expect(translateAndSummarize(repo)).resolves.toEqual(expect.objectContaining({
            beginnerExplanation: getSmartDomainExplanation(repo).beginnerExplanation
        }));
    });
});
