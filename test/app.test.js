const {
    parseGitHubInput,
    generateDefaultInstructions,
    validatePremiumLogin,
    escapeHtml,
    fetchWeeklyPopularRepos,
    fetchMostStarredRepos,
    fetchAgentRepos,
    fetchSkillsRepos,
    getSmartDomainExplanation
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
        const info = getSmartDomainExplanation({ name: 'react', description: 'A JavaScript library for building user interfaces' });
        expect(info.turkishTitle).toContain('React');
        expect(info.beginnerExplanation).toContain('Instagram');
        expect(info.beginnerExplanation).not.toContain('yapboz parçası gibidir');
    });

    test('should return rich specific knowledge for curated repo yt-dlp', () => {
        const info = getSmartDomainExplanation({ name: 'yt-dlp', description: 'A youtube-dl fork with additional features' });
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
