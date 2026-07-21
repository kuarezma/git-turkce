/*
 * app.js
 * Türkçe GitHub Kaşifi Mantığı ve API Entegrasyonları
 */

const PREMIUM_STORAGE_KEY = 'git_tr_subscribed';
const PREMIUM_EMAIL_STORAGE_KEY = 'git_tr_premium_email';
const DEMO_PREMIUM_ACCOUNT = Object.freeze({
    email: 'premium@gitturkce.com',
    password: 'premium123'
});

// Detect Electron environment
const isElectron = typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);

// Application State
const state = {
    activeTab: 'panel-curated',
    geminiApiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('git_tr_gemini_key') : '') || '',
    curatedFilter: 'all',
    languageFilter: 'all',
    bookmarks: (() => {
        if (typeof localStorage === 'undefined') return [];
        try {
            const saved = localStorage.getItem('git_tr_bookmarks');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    })(),
    isSubscribed: isElectron || (typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_STORAGE_KEY) === 'true' : false),
    premiumEmail: isElectron ? 'Masaüstü Sürümü' : ((typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_EMAIL_STORAGE_KEY) : '') || ''),
    searchCache: (() => {
        if (typeof localStorage === 'undefined') return {};
        try {
            const cached = localStorage.getItem('git_tr_search_cache');
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    })(),
    currentSelectedRepo: null
};

// DOM Elements (Safe for Node import)
const elements = typeof document !== 'undefined' ? {
    tabs: document.querySelectorAll('.nav-tab'),
    panels: document.querySelectorAll('.content-panel'),
    curatedGrid: document.getElementById('curated-grid'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    favoritesCount: document.getElementById('favorites-count'),
    langFilterBadges: document.querySelectorAll('.lang-filter-badge'),
    
    // Search
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    suggestionTags: document.querySelectorAll('.suggestion-tag'),
    liveGrid: document.getElementById('live-grid'),
    liveStatus: document.getElementById('live-status'),
    searchEmptyState: document.getElementById('search-empty-state'),
    
    // Settings
    geminiKeyInput: document.getElementById('gemini-key'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    clearSettingsBtn: document.getElementById('clear-settings-btn'),
    apiStatus: document.getElementById('api-status'),
    apiStatusText: document.getElementById('api-status-text'),
    
    // Modal
    detailModal: document.getElementById('detail-modal'),
    modalClose: document.getElementById('modal-close'),
    modalRepoLang: document.getElementById('modal-repo-lang'),
    modalRepoStarsCount: document.getElementById('modal-repo-stars-count'),
    modalRepoForks: document.getElementById('modal-repo-forks'),
    modalRepoLicense: document.getElementById('modal-repo-license'),
    modalRepoUpdated: document.getElementById('modal-repo-updated'),
    modalBookmarkBtn: document.getElementById('modal-bookmark-btn'),
    modalOpenVsCode: document.getElementById('modal-open-vscode'),
    modalCopyClone: document.getElementById('modal-copy-clone'),
    modalShareSummary: document.getElementById('modal-share-summary'),
    modalRepoTitle: document.getElementById('modal-repo-title'),
    modalRepoTrTitle: document.getElementById('modal-repo-tr-title'),
    modalRepoLink: document.getElementById('modal-repo-link'),
    modalTrSummary: document.getElementById('modal-tr-summary'),
    modalWhyUseful: document.getElementById('modal-why-useful'),
    modalBeginnerExplanation: document.getElementById('modal-beginner-explanation'),
    modalHowToUse: document.getElementById('modal-how-to-use'),
    modalDownloadZip: document.getElementById('modal-download-zip'),
    modalEnDesc: document.getElementById('modal-en-desc'),
    btnCopyCode: document.getElementById('btn-copy-code'),
    
    // Premium Panel & Modals
    premiumStatusSection: document.getElementById('premium-status-section'),
    premiumActivationSection: document.getElementById('premium-activation-section'),
    openPayModalBtn: document.getElementById('open-pay-modal-btn'),
    licenseKeyInput: document.getElementById('license-key-input'),
    activateLicenseBtn: document.getElementById('activate-license-btn'),
    
    // Login Form Elements
    toggleLoginBtn: document.getElementById('toggle-login-btn'),
    toggleRegisterBtn: document.getElementById('toggle-register-btn'),
    premiumSubscriptionContainer: document.getElementById('premium-subscription-container'),
    premiumLoginContainer: document.getElementById('premium-login-container'),
    premiumEmailInput: document.getElementById('premium-email-input'),
    premiumPasswordInput: document.getElementById('premium-password-input'),
    premiumLoginError: document.getElementById('premium-login-error'),
    premiumLoginSubmitBtn: document.getElementById('premium-login-submit-btn'),
    
    // Payment Modal
    paymentModal: document.getElementById('payment-modal'),
    paymentModalClose: document.getElementById('payment-modal-close'),
    paySubmitBtn: document.getElementById('pay-submit-btn'),
    
    // Card inputs
    cardHolderInput: document.getElementById('card-holder-input'),
    cardNumberInput: document.getElementById('card-number-input'),
    cardExpiryInput: document.getElementById('card-expiry-input'),
    cardCvcInput: document.getElementById('card-cvc-input'),
    
    // Card preview targets
    previewCardHolder: document.getElementById('preview-card-holder'),
    previewCardNumber: document.getElementById('preview-card-number'),
    previewCardExpiry: document.getElementById('preview-card-expiry'),
    
    // Toast
    toast: document.getElementById('toast')
} : {};

// Initialize Application
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initSettings();
        renderCuratedRepos();
        initFilters();
        initSearch();
        initModal();
        initPremium();
    });
}

// 1. Navigation / Tabs Management
function initTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            
            // Remove active classes
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.panels.forEach(p => p.classList.remove('active'));
            
            // Add active classes
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
            state.activeTab = target;
        });
    });
}

// 2. Settings (Gemini API Configuration)
function initSettings() {
    if (state.geminiApiKey) {
        elements.geminiKeyInput.value = state.geminiApiKey;
        updateApiStatusBadge(true);
    } else {
        updateApiStatusBadge(false);
    }
    
    elements.saveSettingsBtn.addEventListener('click', () => {
        const key = elements.geminiKeyInput.value.trim();
        if (key) {
            state.geminiApiKey = key;
            localStorage.setItem('git_tr_gemini_key', key);
            updateApiStatusBadge(true);
            showToast('Gemini API Anahtarı başarıyla kaydedildi!');
        } else {
            showToast('Lütfen geçerli bir API anahtarı girin.', true);
        }
    });
    
    elements.clearSettingsBtn.addEventListener('click', () => {
        state.geminiApiKey = '';
        localStorage.removeItem('git_tr_gemini_key');
        elements.geminiKeyInput.value = '';
        updateApiStatusBadge(false);
        showToast('API Anahtarı temizlendi.');
    });
}

function updateApiStatusBadge(isActive) {
    if (isActive) {
        elements.apiStatus.className = 'api-status-badge active';
        elements.apiStatusText.textContent = 'Gemini Entegrasyonu Aktif (Yapay Zeka Çeviri Modu)';
    } else {
        elements.apiStatus.className = 'api-status-badge inactive';
        elements.apiStatusText.textContent = 'Gemini Entegrasyonu Devre Dışı (Standart Çeviri Modu)';
    }
}

// Bookmark & Favorites Helper Functions
function getBookmarks() {
    return state.bookmarks || [];
}

function saveBookmarks(bookmarks) {
    state.bookmarks = bookmarks;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('git_tr_bookmarks', JSON.stringify(bookmarks));
    }
    updateFavoritesCountUI();
}

function updateFavoritesCountUI() {
    if (elements.favoritesCount) {
        elements.favoritesCount.textContent = state.bookmarks ? state.bookmarks.length : 0;
    }
}

function isBookmarked(repo) {
    if (!repo) return false;
    const name = repo.name || repo.full_name;
    return (state.bookmarks || []).some(b => (b.name || b.full_name) === name);
}

function toggleBookmark(repo) {
    if (!repo) return;
    const name = repo.name || repo.full_name;
    let bookmarks = getBookmarks();
    const exists = bookmarks.some(b => (b.name || b.full_name) === name);
    
    if (exists) {
        bookmarks = bookmarks.filter(b => (b.name || b.full_name) !== name);
        showToast(`${name} favorilerden çıkarıldı.`);
    } else {
        const domainInfo = getSmartDomainExplanation(repo);
        bookmarks.push({
            name: repo.name,
            owner: repo.owner ? (repo.owner.login || repo.owner) : '',
            stars: repo.stars || repo.stargazers_count || '0',
            language: repo.language || 'Kod',
            description: repo.description || '',
            turkishTitle: domainInfo.turkishTitle || repo.turkishTitle || '',
            turkishSummary: domainInfo.turkishSummary || repo.turkishSummary || '',
            whyUseful: domainInfo.whyUseful || repo.whyUseful || '',
            beginnerExplanation: domainInfo.beginnerExplanation || repo.beginnerExplanation || '',
            howToUse: repo.howToUse || generateDefaultInstructions(repo.name, repo.owner ? (repo.owner.login || repo.owner) : '', repo.language),
            githubUrl: repo.githubUrl || repo.html_url || `https://github.com/${repo.owner}/${repo.name}`
        });
        showToast(`${name} favorilere eklendi! ⭐`);
    }
    saveBookmarks(bookmarks);
    updateModalBookmarkBtn(repo);
    renderCuratedRepos();
}

function updateModalBookmarkBtn(repo) {
    if (!elements.modalBookmarkBtn) return;
    const bookmarked = isBookmarked(repo);
    elements.modalBookmarkBtn.textContent = bookmarked ? '⭐ Favorilerden Çıkar' : '☆ Favorilere Ekle';
    elements.modalBookmarkBtn.classList.toggle('active', bookmarked);
}

function filterByLanguage(repos) {
    if (!state.languageFilter || state.languageFilter === 'all') return repos;
    return repos.filter(repo => {
        const lang = (repo.language || '').toLowerCase();
        const target = state.languageFilter.toLowerCase();
        if (target === 'c++') return lang.includes('c++') || lang.includes('c');
        return lang.includes(target);
    });
}

// 3. Curated Repositories Rendering & Filtering
async function renderCuratedRepos() {
    elements.curatedGrid.innerHTML = '';
    
    if (state.curatedFilter === 'favorites') {
        const favs = filterByLanguage(state.bookmarks || []);
        if (favs.length === 0) {
            showCuratedEmptyState('Favoriniz Bulunmuyor', 'Favorilerinize henüz proje eklemediniz. Proje kartlarındaki yıldız ikonuna tıklayarak favorilerinize ekleyebilirsiniz.');
            return;
        }
        favs.forEach((repo, idx) => {
            const card = createRepoCard(repo, true, false);
            elements.curatedGrid.appendChild(card);
        });
        return;
    }

    if (state.curatedFilter === 'weekly') {
        elements.curatedGrid.innerHTML = `
            <div class="status-indicator" style="display: flex; grid-column: 1 / -1; justify-content: center; padding: 2rem;">
                <span class="spinner"></span>
                <span class="status-text">GitHub'dan bu haftanın en popüler 100 projesi yükleniyor...</span>
            </div>
        `;
        try {
            const rawRepos = await fetchWeeklyPopularRepos();
            const repos = filterByLanguage(rawRepos);
            elements.curatedGrid.innerHTML = '';
            if (repos && repos.length > 0) {
                repos.forEach((repo, idx) => {
                    const isLocked = !state.isSubscribed && idx > 2;
                    const card = createRepoCard(repo, false, isLocked);
                    elements.curatedGrid.appendChild(card);
                });
            } else {
                showCuratedEmptyState('Sonuç Bulunamadı', 'Seçilen dilde popüler proje bulunamadı.');
            }
        } catch (e) {
            console.error(e);
            showCuratedEmptyState('Hata Oluştu', 'Proje verileri çekilirken bir hata ile karşılaşıldı.');
        }
        return;
    }

    if (state.curatedFilter === 'starred') {
        elements.curatedGrid.innerHTML = `
            <div class="status-indicator" style="display: flex; grid-column: 1 / -1; justify-content: center; padding: 2rem;">
                <span class="spinner"></span>
                <span class="status-text">GitHub'dan en çok yıldız alan 100 proje yükleniyor...</span>
            </div>
        `;
        try {
            const rawRepos = await fetchMostStarredRepos();
            const repos = filterByLanguage(rawRepos);
            elements.curatedGrid.innerHTML = '';
            if (repos && repos.length > 0) {
                repos.forEach((repo, idx) => {
                    const isLocked = !state.isSubscribed && idx > 2;
                    const card = createRepoCard(repo, false, isLocked);
                    elements.curatedGrid.appendChild(card);
                });
            } else {
                showCuratedEmptyState('Sonuç Bulunamadı', 'Seçilen dilde en çok yıldız alan proje bulunamadı.');
            }
        } catch (e) {
            console.error(e);
            showCuratedEmptyState('Hata Oluştu', 'Proje verileri çekilirken bir hata ile karşılaşıldı.');
        }
        return;
    }

    if (state.curatedFilter === 'Agent') {
        await renderMergedCategory('Agent', fetchAgentRepos, "GitHub'dan en popüler yapay zeka ajan projeleri yükleniyor...");
        return;
    }

    if (state.curatedFilter === 'Skills') {
        await renderMergedCategory('Skills', fetchSkillsRepos, "GitHub'dan en popüler MCP ve Yetenek (Skills) projeleri yükleniyor...");
        return;
    }

    const categoryRepos = state.curatedFilter === 'all' 
        ? CURATED_REPOSITORIES 
        : CURATED_REPOSITORIES.filter(repo => repo.tags.includes(state.curatedFilter));
        
    const filteredRepos = filterByLanguage(categoryRepos);

    if (filteredRepos.length === 0) {
        showCuratedEmptyState('Kategori Boş', 'Bu kategoride seçilen filtreye uygun proje bulunmuyor.');
        return;
    }

    filteredRepos.forEach((repo, idx) => {
        // Lock every item after index 2 if they are not subscribed
        const isLocked = !state.isSubscribed && idx > 2;
        const card = createRepoCard(repo, true, isLocked);
        elements.curatedGrid.appendChild(card);
    });
}

async function renderMergedCategory(categoryName, fetchFunc, loadingText) {
    elements.curatedGrid.innerHTML = `
        <div class="status-indicator" style="display: flex; grid-column: 1 / -1; justify-content: center; padding: 2rem;">
            <span class="spinner"></span>
            <span class="status-text">${loadingText}</span>
        </div>
    `;
    try {
        const curated = CURATED_REPOSITORIES.filter(repo => repo.tags.includes(categoryName));
        const apiRepos = await fetchFunc();
        
        // Merge without duplicates (curated takes precedence)
        const merged = [...curated];
        apiRepos.forEach(apiRepo => {
            const exists = curated.some(c => 
                c.name.toLowerCase() === apiRepo.name.toLowerCase() && 
                (c.owner || '').toLowerCase() === (apiRepo.owner.login || apiRepo.owner || '').toLowerCase()
            );
            if (!exists) {
                merged.push(apiRepo);
            }
        });

        const filtered = filterByLanguage(merged);
        
        elements.curatedGrid.innerHTML = '';
        if (filtered.length > 0) {
            filtered.forEach((repo, idx) => {
                const isLocked = !state.isSubscribed && idx > 2;
                const isCurated = curated.some(c => 
                    c.name.toLowerCase() === repo.name.toLowerCase() && 
                    (c.owner || '').toLowerCase() === (repo.owner.login || repo.owner || '').toLowerCase()
                );
                const card = createRepoCard(repo, isCurated, isLocked);
                elements.curatedGrid.appendChild(card);
            });
        } else {
            showCuratedEmptyState('Sonuç Bulunamadı', 'Seçilen dilde proje bulunamadı.');
        }
    } catch (e) {
        console.error(e);
        showCuratedEmptyState('Hata Oluştu', 'Proje verileri çekilirken bir hata ile karşılaşıldı.');
    }
}

function showCuratedEmptyState(title, desc) {
    elements.curatedGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
            <span class="empty-icon">⚠️</span>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;
}

function initFilters() {
    updateFavoritesCountUI();
    
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.curatedFilter = btn.getAttribute('data-category');
            renderCuratedRepos();
        });
    });

    elements.langFilterBadges.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.langFilterBadges.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.languageFilter = btn.getAttribute('data-lang');
            renderCuratedRepos();
        });
    });
}

function createRepoCard(repo, isCurated, isLocked = false) {
    const card = document.createElement('div');
    card.className = isLocked ? 'repo-card locked' : 'repo-card';

    const domainInfo = getSmartDomainExplanation(repo);
    const repositoryOwner = isCurated ? repo.owner : (repo.owner ? (repo.owner.login || repo.owner) : '');
    const repositoryTitle = isCurated ? `${repo.owner} / ${repo.name}` : (repo.full_name || `${repositoryOwner}/${repo.name}`);
    const turkishTitle = isCurated ? (domainInfo.turkishTitle || repo.turkishTitle) : (repo.turkishTitle || domainInfo.turkishTitle);
    const repositoryDescription = isCurated ? (domainInfo.turkishSummary || repo.turkishSummary) : (domainInfo.turkishSummary || repo.description || 'Açıklama bulunmuyor.');
    const bookmarked = isBookmarked(repo);

    card.innerHTML = `
        <div class="card-bookmark-star ${bookmarked ? 'active' : ''}" title="Favorilere Ekle/Çıkar" role="button">
            ${bookmarked ? '⭐' : '☆'}
        </div>
        <div class="card-top">
            <div class="card-header">
                <span class="repo-lang-badge">${escapeHtml(repo.language || 'Kod')}</span>
                <span class="repo-stars">⭐ ${escapeHtml(repo.stars || repo.stargazers_count || '0')}</span>
            </div>
            <h3 class="repo-title">${escapeHtml(repositoryTitle || 'İsimsiz proje')}</h3>
            <h4 class="repo-tr-title">${escapeHtml(turkishTitle || 'Yazılım Projesi')}</h4>
            <p class="repo-desc">${escapeHtml(repositoryDescription)}</p>
        </div>
        <div class="card-footer">
            <span class="card-action-hint">Detayları Gör ➔</span>
        </div>
        ${isLocked ? `
        <div class="card-lock-overlay">
            <div class="lock-badge">🔒</div>
            <div class="lock-text">Premium Üyelik</div>
        </div>
        ` : ''}
    `;
    
    const starBtn = card.querySelector('.card-bookmark-star');
    starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(repo);
    });

    card.addEventListener('click', () => {
        if (isLocked) {
            // Trigger subscription activation modal
            openPaymentModal();
        } else {
            openRepoDetail(repo, isCurated);
        }
    });
    
    return card;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

// 4. Search and Link Detection Logic
function initSearch() {
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    elements.suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            elements.searchInput.value = tag.textContent;
            performSearch();
        });
    });
}

// Parse GitHub input to detect URL or Owner/Repo
function parseGitHubInput(input) {
    const trimmed = input.trim();
    // Match full URL: http(s)://(www.)github.com/owner/repo
    const urlRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/i;
    // Match owner/repo
    const pathRegex = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/i;
    
    let match = trimmed.match(urlRegex);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    
    match = trimmed.match(pathRegex);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    
    return null;
}

async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    // UI state loading
    elements.searchEmptyState.style.display = 'none';
    elements.liveGrid.innerHTML = '';
    elements.liveStatus.style.display = 'flex';
    
    const parsed = parseGitHubInput(query);
    
    try {
        if (parsed) {
            // Direct Repository Fetch
            elements.liveStatus.querySelector('.status-text').textContent = `${parsed.owner}/${parsed.repo} bilgileri çekiliyor...`;
            const repoData = await fetchGitHubRepo(parsed.owner, parsed.repo);
            elements.liveStatus.style.display = 'none';
            if (repoData) {
                // If not subscribed, click leads to payment modal
                const isLocked = !state.isSubscribed;
                const card = createRepoCard(repoData, false, isLocked);
                elements.liveGrid.appendChild(card);
            } else {
                showEmptyState('Proje Bulunamadı', 'Girdiğiniz GitHub bağlantısı geçerli bir projeyi işaret etmiyor olabilir.');
            }
        } else {
            // Search Query
            elements.liveStatus.querySelector('.status-text').textContent = `"${query}" ile ilgili projeler aranıyor...`;
            const results = await searchGitHub(query);
            elements.liveStatus.style.display = 'none';
            if (results && results.length > 0) {
                results.forEach(repo => {
                    const isLocked = !state.isSubscribed;
                    const card = createRepoCard(repo, false, isLocked);
                    elements.liveGrid.appendChild(card);
                });
            } else {
                showEmptyState('Sonuç Bulunamadı', 'Aramanızla eşleşen popüler bir GitHub projesi bulunamadı.');
            }
        }
    } catch (error) {
        elements.liveStatus.style.display = 'none';
        showEmptyState('Hata Oluştu', 'GitHub API sınırı aşılmış olabilir veya internet bağlantınızı kontrol etmeniz gerekebilir.');
        console.error(error);
    }
}

function showEmptyState(title, desc) {
    elements.liveGrid.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">⚠️</span>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;
}

// GitHub API: Get Single Repo
async function fetchGitHubRepo(owner, repo) {
    const cacheKey = `repo_${owner}_${repo}`.toLowerCase();
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('GitHub API Error');
    }
    const data = await res.json();
    
    // Save to Cache
    saveToSearchCache(cacheKey, data);
    return data;
}

// GitHub API: Search Repositories
async function searchGitHub(query) {
    const cacheKey = `search_${query}`.toLowerCase();
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`);
    if (!res.ok) throw new Error('GitHub API Error');
    const data = await res.json();
    const items = data.items || [];
    
    // Save to Cache
    saveToSearchCache(cacheKey, items);
    return items;
}

// GitHub API: Fetch Weekly Popular Repositories
async function fetchWeeklyPopularRepos() {
    const cacheKey = 'weekly_popular_repos';
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString().split('T')[0];
    const query = `created:>${dateString}`;
    
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`);
    if (!res.ok) throw new Error('GitHub API Error');
    const data = await res.json();
    const items = data.items || [];
    
    // Save to Cache
    saveToSearchCache(cacheKey, items);
    return items;
}

// GitHub API: Fetch Most Starred Repositories (Top 100)
async function fetchMostStarredRepos() {
    const cacheKey = 'most_starred_repos';
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const res = await fetch(`https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=100`);
    if (!res.ok) throw new Error('GitHub API Error');
    const data = await res.json();
    const items = data.items || [];
    
    // Save to Cache
    saveToSearchCache(cacheKey, items);
    return items;
}

// GitHub API: Fetch AI Agent-related Repositories
async function fetchAgentRepos() {
    const cacheKey = 'agent_repos';
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const query = 'agent OR agents OR autonomous-agent OR AI-agent';
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`);
    if (!res.ok) throw new Error('GitHub API Error');
    const data = await res.json();
    const items = data.items || [];
    
    saveToSearchCache(cacheKey, items);
    return items;
}

// GitHub API: Fetch MCP & Skills-related Repositories
async function fetchSkillsRepos() {
    const cacheKey = 'skills_repos';
    if (state.searchCache[cacheKey]) {
        return state.searchCache[cacheKey];
    }
    
    const query = 'mcp-server OR claude-skills OR agent-skills OR "model-context-protocol" OR "claude-code"';
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`);
    if (!res.ok) throw new Error('GitHub API Error');
    const data = await res.json();
    const items = data.items || [];
    
    saveToSearchCache(cacheKey, items);
    return items;
}



function saveToSearchCache(key, value) {
    state.searchCache[key] = value;
    // Limit cache size in localStorage (keep max 30 items)
    const keys = Object.keys(state.searchCache);
    if (keys.length > 30) {
        delete state.searchCache[keys[0]];
    }
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('git_tr_search_cache', JSON.stringify(state.searchCache));
    }
}

// 5. Translation & AI Summarization Engine
async function translateAndSummarize(repo) {
    const originalDesc = repo.description || 'No description provided.';
    const lang = repo.language || 'yazılım dili';
    
    // If Gemini Key is present, run deep analysis
    if (state.geminiApiKey) {
        try {
            return await fetchGeminiSummary(repo);
        } catch (e) {
            console.warn('Gemini API call failed, falling back to MyMemory translate.', e);
            // Fallback to translation API on error
        }
    }
    
    // Fallback Translation (Smart Domain Classifier Engine + MyMemory)
    try {
        const translatedSummary = await fetchMyMemoryTranslation(originalDesc);
        const domainInfo = getSmartDomainExplanation(repo);
        const setupInstructions = generateDefaultInstructions(repo.name, repo.owner ? (repo.owner.login || repo.owner) : '', repo.language);
        
        return {
            turkishTitle: domainInfo.turkishTitle || (repo.name.charAt(0).toUpperCase() + repo.name.slice(1) + " Projesi"),
            turkishSummary: (translatedSummary && !translatedSummary.includes('MYMEMORY')) ? translatedSummary : domainInfo.turkishSummary,
            whyUseful: domainInfo.whyUseful,
            beginnerExplanation: domainInfo.beginnerExplanation,
            howToUse: setupInstructions + "\n\n# 💡 Daha detaylı yapay zeka analizleri için Ayarlar sekmesinden ücretsiz Gemini API anahtarınızı ekleyin!"
        };
    } catch (error) {
        console.error('Translation fallback failed.', error);
        const domainInfo = getSmartDomainExplanation(repo);
        return {
            turkishTitle: domainInfo.turkishTitle,
            turkishSummary: domainInfo.turkishSummary,
            whyUseful: domainInfo.whyUseful,
            beginnerExplanation: domainInfo.beginnerExplanation,
            howToUse: generateDefaultInstructions(repo.name, repo.owner ? (repo.owner.login || repo.owner) : '', repo.language)
        };
    }
}

// Call Google Gemini API
async function fetchGeminiSummary(repo) {
    const prompt = `You are GitTürkçe, a highly skilled software engineer and tech educator. Analyze the following GitHub repository and explain it in Turkish for developers and complete beginners. 
CRITICAL RULE: DO NOT use generic boilerplate sentences like 'bu araç yapboz parçası gibidir' or 'tekerleği yeniden icat etmemek'. Provide realistic, highly specific explanations tailored strictly to this repository's actual domain, purpose, and technology stack.

Output the response strictly as a JSON object, with no markdown code block backticks (like \`\`\`json) and no other text around it.

Expected JSON Structure:
{
  "turkishTitle": "Short, catchy Turkish title specific to this repo (2-5 words)",
  "turkishSummary": "A simplified, highly specific 2-3 sentence explanation of what this exact tool does in Turkish",
  "whyUseful": "Explanation of why this tool is useful, what exact problem it solves, and why developers use it (2-3 sentences in Turkish)",
  "beginnerExplanation": "A very detailed, simple explanation (written for an absolute beginner) explaining what this specific project does, what real-world problem it solves, and a realistic concrete example in Turkish (3-4 sentences with <strong>Gerçekçi Örnek:</strong> emphasis)",
  "howToUse": "Step-by-step setup and run commands with explanations in Turkish"
}

Repository Details:
- Name: ${repo.name}
- Owner: ${repo.owner ? (repo.owner.login || repo.owner) : ''}
- Language: ${repo.language || 'Not specified'}
- English Description: ${repo.description || 'None'}
- Stargazers: ${repo.stargazers_count || repo.stars || 'Many'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        })
    });
    
    if (!response.ok) {
        throw new Error('Gemini API request failed');
    }
    
    const resultData = await response.json();
    const rawText = resultData.candidates[0].content.parts[0].text;
    
    // Parse response
    return JSON.parse(rawText.trim());
}

// Call Free MyMemory Translation API
async function fetchMyMemoryTranslation(text) {
    if (!text || text === 'No description provided.') return 'Açıklama bulunmuyor.';
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation request failed');
    const data = await res.json();
    return data.responseData.translatedText || text;
}

// Smart script generation based on language
function generateDefaultInstructions(repoName, owner, language) {
    const cloneCmd = `git clone https://github.com/${owner}/${repoName}.git\ncd ${repoName}`;
    
    if (!language) return `# Projeyi klonlayın:\n${cloneCmd}`;
    
    const lang = language.toLowerCase();
    
    if (lang === 'javascript' || lang === 'typescript') {
        return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Bağımlılıkları yükleyin:\nnpm install\n\n# 3. Uygulamayı başlatın:\nnpm run dev`;
    } else if (lang === 'python') {
        return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Bağımlılıkları kurun:\npip install -r requirements.txt\n\n# 3. Çalıştırın:\npython main.py`;
    } else if (lang === 'rust') {
        return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Derleyin ve çalıştırın:\ncargo run`;
    } else if (lang === 'go') {
        return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Bağımlılıkları indirin:\ngo mod download\n\n# 3. Çalıştırın:\ngo run main.go`;
    } else if (lang === 'c++' || lang === 'c') {
        return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Derleme klasörü oluşturun:\nmkdir build && cd build\n\n# 3. CMake ile derleyin:\ncmake ..\nmake`;
    }
    
    return `# 1. Projeyi klonlayın:\n${cloneCmd}\n\n# 2. Projenin ${language} gereksinimlerine göre çalıştırın.`;
}

// 6. Modal Window Control
function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (elements.detailModal.classList.contains('active')) closeModal();
        if (elements.paymentModal.classList.contains('active')) closePaymentModal();
    });
    
    // Copy code button inside modal
    elements.btnCopyCode.addEventListener('click', () => {
        const codeText = elements.modalHowToUse.textContent;
        navigator.clipboard.writeText(codeText).then(() => {
            showToast('Kurulum adımları panoya kopyalandı!');
        }).catch(() => {
            showToast('Kopyalama başarısız oldu.', true);
        });
    });

    // Modal Bookmark Button
    if (elements.modalBookmarkBtn) {
        elements.modalBookmarkBtn.addEventListener('click', () => {
            if (state.currentSelectedRepo) {
                toggleBookmark(state.currentSelectedRepo);
            }
        });
    }

    // VS Code Open Button
    if (elements.modalOpenVsCode) {
        elements.modalOpenVsCode.addEventListener('click', () => {
            if (!state.currentSelectedRepo) return;
            const repo = state.currentSelectedRepo;
            const owner = repo.owner ? (repo.owner.login || repo.owner) : '';
            const url = repo.githubUrl || repo.html_url || `https://github.com/${owner}/${repo.name}`;
            window.location.href = `vscode://vscode.git/clone?url=${encodeURIComponent(url)}`;
            showToast('VS Code açılıyor... 💻');
        });
    }

    // Clone Command Copy Button
    if (elements.modalCopyClone) {
        elements.modalCopyClone.addEventListener('click', () => {
            if (!state.currentSelectedRepo) return;
            const repo = state.currentSelectedRepo;
            const owner = repo.owner ? (repo.owner.login || repo.owner) : '';
            const url = repo.githubUrl || repo.html_url || `https://github.com/${owner}/${repo.name}`;
            const cloneCmd = `git clone ${url}.git`;
            navigator.clipboard.writeText(cloneCmd).then(() => {
                showToast('Clone komutu kopyalandı! 📋');
            });
        });
    }

    // Share Summary Button
    if (elements.modalShareSummary) {
        elements.modalShareSummary.addEventListener('click', () => {
            if (!state.currentSelectedRepo) return;
            const repo = state.currentSelectedRepo;
            const domainInfo = getSmartDomainExplanation(repo);
            const title = domainInfo.turkishTitle || repo.turkishTitle || repo.name;
            const summary = domainInfo.turkishSummary || repo.turkishSummary || repo.description;
            const owner = repo.owner ? (repo.owner.login || repo.owner) : '';
            const url = repo.githubUrl || repo.html_url || `https://github.com/${owner}/${repo.name}`;
            
            const shareText = `🚀 GitTürkçe Proje İncelemesi: ${repo.name}\n📌 Başlık: ${title}\n💡 Özet: ${summary}\n⭐ Yıldız: ${repo.stars || repo.stargazers_count || '0'} | 🌐 Dili: ${repo.language || 'Kod'}\n🔗 Link: ${url}`;
            
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Proje özeti panoya kopyalandı! 📤');
            });
        });
    }
}

async function openRepoDetail(repo, isCurated) {
    state.currentSelectedRepo = repo;
    
    // Fill basic details immediately
    const ownerName = isCurated ? repo.owner : (repo.owner.login || repo.owner);
    const repoName = isCurated ? repo.name : repo.name;
    const defaultBranch = repo.default_branch || 'main';
    
    elements.modalRepoTitle.textContent = `${ownerName} / ${repoName}`;
    elements.modalRepoLang.textContent = repo.language || 'Kod';
    elements.modalRepoStarsCount.textContent = `⭐ ${repo.stars || repo.stargazers_count || '0'}`;
    if (elements.modalRepoForks) elements.modalRepoForks.textContent = `🔱 ${repo.forks_count || repo.forks || '1.2k'}`;
    if (elements.modalRepoLicense) elements.modalRepoLicense.textContent = `📜 ${repo.license ? (repo.license.spdx_id || repo.license.name || 'MIT') : 'MIT'}`;
    if (elements.modalRepoUpdated) elements.modalRepoUpdated.textContent = `📅 ${repo.updated_at ? new Date(repo.updated_at).toLocaleDateString('tr-TR') : 'Güncel'}`;
    
    elements.modalRepoLink.href = repo.githubUrl || repo.html_url || `https://github.com/${ownerName}/${repoName}`;
    elements.modalDownloadZip.href = `https://github.com/${ownerName}/${repoName}/archive/refs/heads/${defaultBranch}.zip`;
    elements.modalEnDesc.textContent = repo.description || 'No description available.';
    
    updateModalBookmarkBtn(repo);
    
    // Visual show loading state for generated translations
    elements.modalRepoTrTitle.textContent = 'Yapay Zeka Analiz Ediyor...';
    elements.modalTrSummary.textContent = 'Açıklamalar Türkçeye çevriliyor ve analiz ediliyor...';
    elements.modalWhyUseful.textContent = 'Analiz ediliyor...';
    elements.modalBeginnerExplanation.textContent = 'Analiz ediliyor...';
    elements.modalHowToUse.textContent = '# Yükleniyor...';
    
    // Open Modal
    elements.detailModal.classList.add('active');
    elements.detailModal.inert = false;
    elements.detailModal.setAttribute('aria-hidden', 'false');
    elements.modalClose.focus();
    
    const domainInfo = getSmartDomainExplanation(repo);
    if (isCurated) {
        // Pre-populated / Smart Domain knowledge
        elements.modalRepoTrTitle.textContent = domainInfo.turkishTitle || repo.turkishTitle;
        elements.modalTrSummary.textContent = domainInfo.turkishSummary || repo.turkishSummary;
        elements.modalWhyUseful.textContent = domainInfo.whyUseful || repo.whyUseful;
        elements.modalBeginnerExplanation.innerHTML = repo.beginnerExplanation || domainInfo.beginnerExplanation;
        elements.modalHowToUse.textContent = repo.howToUse;
    } else {
        // Live data: needs API translation / smart domain classifier fallback
        const aiData = await translateAndSummarize(repo);
        
        elements.modalRepoTrTitle.textContent = aiData.turkishTitle || domainInfo.turkishTitle;
        elements.modalTrSummary.textContent = aiData.turkishSummary || domainInfo.turkishSummary;
        elements.modalWhyUseful.textContent = aiData.whyUseful || domainInfo.whyUseful;
        elements.modalBeginnerExplanation.innerHTML = aiData.beginnerExplanation || domainInfo.beginnerExplanation;
        elements.modalHowToUse.textContent = aiData.howToUse;
    }
}

const REPO_SPECIFIC_KNOWLEDGE = {
    "build-your-own-x": {
        turkishTitle: "Kendi Teknolojini Sıfırdan İnşa Et",
        turkishSummary: "Veritabanlarından işletim sistemlerine kadar favori teknolojilerinizi sıfırdan nasıl kodlayacağınızı öğreten devasa bir açık kaynak rehberidir.",
        whyUseful: "Hazır kütüphanelerin arkasındaki çalışma mantığını derinlemesine kavramanızı sağlar ve sizi sıradan bir kod yazardan kıdemli mimara dönüştürür.",
        beginnerExplanation: "Bu proje, yazılımcıların kullandığı popüler teknolojileri (kendi veritabanını, kendi oyun motorunu veya web tarayıcısını) adım adım sıfırdan yazmanızı sağlayan rehberler sunar.<br><br><strong>Gerçekçi Örnek:</strong> Tıpkı bir sürücünün sadece araba sürmeyi değil, motorun her bir pistonunun nasıl çalıştığını öğrenip kendi aracını inşa etmesi gibidir."
    },
    "awesome": {
        turkishTitle: "Harika Konu ve Araç Listeleri",
        turkishSummary: "Yazılım dünyasındaki tüm programlama dilleri, teknolojiler ve konular hakkında topluluk tarafından seçilmiş en iyi kaynak ve araç listeleridir.",
        whyUseful: "Yeni bir teknolojiye başlarken kaliteli kütüphane ve eğitim bulma sürecinde saatlerce arama yapma derdine son verir.",
        beginnerExplanation: "Yazılım dünyasındaki her konu (Python, Yapay Zeka, Oyun Geliştirme vb.) için en iyi derslerin, kitapların ve araçların kürasyon yapıldığı ana kütüphanedir.<br><br><strong>Gerçekçi Örnek:</strong> Bir şehre gittiğinizde sadece en iyi restoranları ve gezilecek yerleri gösteren rehber kitapçık gibidir."
    },
    "freeCodeCamp": {
        turkishTitle: "Ücretsiz İnteraktif Yazılım Eğitimi",
        turkishSummary: "Sıfırdan web geliştirme, matematik, veri analizi ve bilgisayar bilimi öğrenmenizi sağlayan dünyanın en büyük ücretsiz kodlama platformudur.",
        whyUseful: "Pahalı kurslara veya okullara ihtiyaç duymadan, doğrudan tarayıcı üzerinden interaktif olarak kod yazarak geliştirici olmanıza imkan tanır.",
        beginnerExplanation: "Sıfırdan yazılıma başlamak isteyenler için adım adım dersler, kodlama egzersizleri ve sertifika projeleri sunar.<br><br><strong>Gerçekçi Örnek:</strong> Kodlama derslerini adım adım çözüp, yaptığınız projeler sonucunda uluslararası geçerliliği olan ücretsiz sertifikalar kazanırsınız."
    },
    "public-apis": {
        turkishTitle: "Ücretsiz Kullanılabilir API Listesi",
        turkishSummary: "Hava durumundan finansal verilere, oyunlardan müzik servislerine kadar geliştiricilerin ücretsiz kullanabileceği harici API servisleri koleksiyonudur.",
        whyUseful: "Kendi projenize canlı hava durumu, döviz kurları veya spor skorları gibi verileri sıfırdan veri toplamadan tek tıkla eklemenizi sağlar.",
        beginnerExplanation: "Uygulamalarınızın dış dünyadan veri çekmesini sağlayan ücretsiz kapıların (API) listesidir.<br><br><strong>Gerçekçi Örnek:</strong> Bir mobil uygulama yaparken canlı hava durumunu göstermek istediğinizde, Meteoroloji'nin sağladığı ücretsiz API adresini bu listeden bulup projenize bağlarsınız."
    },
    "free-programming-books": {
        turkishTitle: "Ücretsiz Programlama Kitapları Rehberi",
        turkishSummary: "Dünyanın dört bir yanından ücretsiz olarak erişilebilen yüzlerce dildeki yazılım kitapları, ders notları ve eğitim videoları arşivdir.",
        whyUseful: "Yazılım öğrenirken pahalı teknik kitaplara bütçe ayırmadan, toplulukça doğrulanmış en güncel kaynaklara yasal ve ücretsiz ulaşmanızı sağlar.",
        beginnerExplanation: "Tüm dünyadaki yazılımcıların bağışladığı ve derlediği devasa bir dijital yazılım kütüphanesidir.<br><br><strong>Gerçekçi Örnek:</strong> Python veya C++ öğrenmek istediğinizde, aradığınız konunun en detaylı Türkçe ve İngilizce kitaplarını PDF veya web sayfası formatında ücretsiz okuyabilirsiniz."
    },
    "openclaw": {
        turkishTitle: "Kişisel Otonom Yapay Zeka Asistanı",
        turkishSummary: "Tüm işletim sistemlerinde çalışan, kendi sunucunuzda veya bilgisayarınızda kişisel işlerinizi yürüten otonom yapay zeka sistemidir.",
        whyUseful: "Şirket verilerinizi dışarı aktarmadan, kendi kontrolünüz altında çalışan özel bir AI sekreteri oluşturmanızı sağlar.",
        beginnerExplanation: "Bilgisayarınızda çalışan, sizin verdiğiniz görevleri (dosya düzenleme, rapor yazma, e-posta taslağı hazırlama) kendi başına yürüten bir yardımcıdır.<br><br><strong>Gerçekçi Örnek:</strong> 'Masaüstündeki tüm PDF'leri tarihlerine göre klasörle' dediğinizde bu işlemi otomatik olarak gerçekleştiren dijital asistanınızdır."
    },
    "developer-roadmap": {
        turkishTitle: "Yazılımcı Kariyer Yol Haritaları",
        turkishSummary: "Frontend, Backend, DevOps, AI Engineer gibi alanlarda sırasıyla hangi teknolojilerin öğrenilmesi gerektiğini gösteren görsel haritalardır.",
        whyUseful: "Yazılıma yeni başlayanların hangi teknolojiyi hangi sırayla öğreneceği konusundaki kafa karışıklığını tamamen giderir.",
        beginnerExplanation: "Yazılım dünyasında kaybolmadan hedefinize ulaşmanız için adım adım çizilmiş kariyer haritalarıdır.<br><br><strong>Gerçekçi Örnek:</strong> 'Frontend Geliştirici olmak istiyorum' dediğinizde; önce HTML, sonra CSS, ardından JavaScript ve React öğrenmeniz gerektiğini adım adım işaret eder."
    },
    "system-design-primer": {
        turkishTitle: "Sistem Tasarımı ve Mimari Rehberi",
        turkishSummary: "Milyonlarca kullanıcılı ölçeklenebilir sistemlerin (YouTube, WhatsApp, Twitter vb.) nasıl tasarlanacağını anlatan rehberdir.",
        whyUseful: "Yazılım mülakatlarına hazırlanmanızı ve yüksek trafikli sistemlerin arkasındaki sunucu, veritabanı ve yük dengeleme mantıklarını kavramınızı sağlar.",
        beginnerExplanation: "Bir web sitesine aynı anda 100 bin kişi girdiğinde sunucuların çökmemesi için sistemin nasıl kurgulanacağını öğretir.<br><br><strong>Gerçekçi Örnek:</strong> Trendyol Efsane Cuma indirimlerinde milyonlarca kişinin aynı anda alışveriş yapabilmesini sağlayan veritabanı ve sunucu mimarisini tasarlama rehberidir."
    },
    "coding-interview-university": {
        turkishTitle: "Yazılım Mülakatlarına Hazırlık Rehberi",
        turkishSummary: "Google, Amazon, Meta gibi teknoloji devlerinin teknik mülakatlarını kazanmak için hazırlanan bilgisayar bilimi çalışma planıdır.",
        whyUseful: "Bilgisayar bilimleri mühendisliği müfredatını özetleyerek büyük şirketlerin mülakat sorularına eksiksiz hazırlanmanızı sağlar.",
        beginnerExplanation: "Dünyanın en büyük teknoloji şirketlerinde yazılımcı olarak işe girmek için çalışmanız gereken konuların tam müfredatıdır.<br><br><strong>Gerçekçi Örnek:</strong> Veri yapıları, algoritmalar ve problem çözme tekniklerini adım adım çalışarak teknik mülakatları geçmenize yardımcı olur."
    },
    "awesome-python": {
        turkishTitle: "Harika Python Kütüphaneleri Koleksiyonu",
        turkishSummary: "Python dilinde geliştirilmiş en başarılı web çerçeveleri, yapay zeka araçları ve veri analizi kütüphaneleri kataloğudur.",
        whyUseful: "Python projenizde bir ihtiyacınız olduğunda (örneğin resim işleme veya Excel okuma) en kaliteli kütüphaneyi anında seçmenizi sağlar.",
        beginnerExplanation: "Python programlama dili ile yapılabilecek her iş için yazılmış en iyi hazır paketlerin kategorize edilmiş listesidir.<br><br><strong>Gerçekçi Örnek:</strong> Python ile bir web sitesi yapacaksanız Django/Flask, veri analizi yapacaksanız Pandas/NumPy kütüphanelerini bu listeden bularak doğrudan kullanırsınız."
    },
    "awesome-selfhosted": {
        turkishTitle: "Kendi Sunucunda Barındırılabilir Yazılımlar",
        turkishSummary: "Google Drive, Trello, Spotify gibi bulut servislerinin kendi bilgisayarınızda veya sunucunuzda ücretsiz çalıştırabileceğiniz açık kaynak muadilleridir.",
        whyUseful: "Aylık abonelik ücretleri ödemeden ve verilerinizi üçüncü taraf şirketlere vermeden kendi bulut servislerinizi kurmanızı sağlar.",
        beginnerExplanation: "Evdeki eski bir bilgisayarı kendi kişisel bulut sunucunuza dönüştürmenizi sağlayan ücretsiz yazılımlar listesidir.<br><br><strong>Gerçekçi Örnek:</strong> Google Fotoğraflar yerine evdeki bilgisayarınıza Nextcloud kurarak tüm telefon fotoğraflarınızı kendi sunucunuza ücretsiz ve sınırsız yedekleyebilirsiniz."
    },
    "react": {
        turkishTitle: "React Kullanıcı Arayüzü Kütüphanesi",
        turkishSummary: "Meta tarafından geliştirilen, web sayfalarını bağımsız yeniden kullanılabilir bileşenlerle inşa etmeyi sağlayan en popüler arayüz kütüphanesidir.",
        whyUseful: "Tüm web sayfasını yeniden yüklemek yerine sadece değişen bileşeni güncelleyerek web sitelerinin mobil uygulama kadar hızlı çalışmasını sağlar.",
        beginnerExplanation: "Bir web sayfasını tek parça bir duvar kağıdı gibi değil, lego parçaları gibi tasarlamanızı sağlar. Sayfadaki her bir kutu, buton veya menü kendi içinde bağımsız bir bileşendir.<br><br><strong>Gerçekçi Örnek:</strong> Instagram'da bir gönderiyi beğendiğinizde sayfanın tamamı yenilenmez, sadece kalp ikonu kırmızı olur ve sayı 1 artar. React tam olarak bu anlık güncellemeleri yönetir."
    },
    "linux": {
        turkishTitle: "Linux İşletim Sistemi Çekirdeği",
        turkishSummary: "Dünyadaki sunucuların, süper bilgisayarların ve Android cihazların üzerinde çalıştığı açık kaynaklı işletim sistemi çekirdeğidir.",
        whyUseful: "Windows veya macOS lisans ücretlerine bağımlı kalmadan; son derece güvenli, virüs bulaşmayan ve aylarca çökmeden çalışabilen sunucu altyapıları kurmayı sağlar.",
        beginnerExplanation: "Bilgisayarın donanımı (işlemci, bellek, disk) ile yazılımlar arasındaki iletişimi sağlayan ana motor parçasıdır.<br><br><strong>Gerçekçi Örnek:</strong> Google, Netflix, Trendyol gibi milyonlarca kullanıcısı olan dev hizmetlerin arka plandaki sunucuları kesintisiz hizmet vermek için Linux üzerinde çalışır."
    },
    "n8n": {
        turkishTitle: "Kodsuz İş Akışı ve Servis Otomasyonu",
        turkishSummary: "Farklı internet servislerini (Gmail, Slack, Sheets, Trello) kod yazmadan birbirine bağlayıp otomasyonlar kurmanızı sağlayan açık kaynaklı platformdur.",
        whyUseful: "İnsanların elle yaptığı sürükle-bırak, veri kopyalama ve bildirim atma gibi tekrarlayan rutin işleri arka planda 7/24 otomatik çalışan dijital iş akışlarına çevirir.",
        beginnerExplanation: "Tıpkı bir dijital bant sistemi gibi, bir olay gerçekleştiğinde (örneğin e-posta geldiğinde) sonraki adımları otomatik tetikler.<br><br><strong>Gerçekçi Örnek:</strong> Şirket e-postanıza bir fatura PDF'i geldiğinde, n8n bu dosyayı Google Drive'a kaydeder, tutarı Excel tablosuna ekler ve Slack kanalından muhasebeye mesaj gönderir."
    },
    "ollama": {
        turkishTitle: "Yerel Yapay Zeka Model Sunucusu",
        turkishSummary: "Bilgisayarınıza internete bağlı olmadan, tamamen yerel olarak çalışabilen yapay zeka modelleri (ChatGPT benzeri zekalar) kurmanızı sağlayan bir köprüdür.",
        whyUseful: "Verilerinizi gizli tutarak ve internet bağlantısına ihtiyaç duymadan kendi bilgisayarınızın gücüyle çalışan ücretsiz yapay zekalara sahip olmanızı sağlar.",
        beginnerExplanation: "Telefonunuza bir oyun yükleyip internetiniz kapalıyken bile oynamak gibi, yapay zekayı da tamamen kendi cihazınıza indirip internet bağımsız konuşabilmenizi sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Gizli bir şirket belgesini veya özel kodlarınızı internetteki bir servise göndermeden, tamamen kendi bilgisayarınızda Ollama ile çalışan LLaMA modeli üzerinden analiz edebilirsiniz."
    },
    "yt-dlp": {
        turkishTitle: "Gelişmiş Video ve Ses İndirme Aracı",
        turkishSummary: "YouTube ve 1000'den fazla siteden komut satırı üzerinden en yüksek kalitede video ve ses indirmeyi sağlayan açık kaynaklı araçtır.",
        whyUseful: "Web sitelerindeki reklamlı, virüslü veya sınırlandırmalı video dönüştürücülere ihtiyaç duymadan, doğrudan terminal üzerinden orijinal kalitede indirme yapmanızı sağlar.",
        beginnerExplanation: "Komut satırına sadece video linkini yapıştırarak videoyu MP4 formatında veya doğrudan MP3 ses dosyası olarak bilgisayarınıza kaydetmenizi sağlar.<br><br><strong>Gerçekçi Örnek:</strong> 100 videoluk bir müzik oynatma listesini veya uzun bir ders videosunu tek bir komutla en yüksek ses kalitesinde MP3 olarak bilgisayarınıza indirebilirsiniz."
    },
    "AutoGPT": {
        turkishTitle: "Otonom Görev Yürüten Yapay Zeka",
        turkishSummary: "Belirttiğiniz karmaşık bir hedefi başarmak için kendi kendine internette araştırma yapan, dosyalar oluşturan ve adımları kendi planlayan otonom bir yapay zeka ajanıdır.",
        whyUseful: "Tekrarlayan pazar araştırması, dosya analizi veya içerik derleme işlerinde insan müdahalesine gerek duymadan sonuca ulaşılmasını sağlar.",
        beginnerExplanation: "Sizin verdiğiniz bir hedef doğrultusunda kendi kendine adımlar atan dijital bir araştırmacıdır.<br><br><strong>Gerçekçi Örnek:</strong> 'Bana 2026'nın en iyi 5 yazılım dilini araştır ve rapor hazırla' dediğinizde; interneti tarar, verileri derler ve rapor belgesi olarak bilgisayarınıza kaydeder."
    },
    "vscode": {
        turkishTitle: "Microsoft Kod Editörü (VS Code)",
        turkishSummary: "Microsoft tarafından geliştirilen, hafif, çok hızlı ve geniş eklenti desteğiyle özelleştirilebilen dünyanın en popüler kaynak kod editörüdür.",
        whyUseful: "Yazılım geliştirirken kod renklendirme, hata tespiti, otomatik tamamlama ve Git entegrasyonu sunarak kod yazma verimini katlar.",
        beginnerExplanation: "Yazılımcıların kodlarını yazdığı gelişmiş bir kelime işlemci (Word benzeri ama koda özel) aracıdır.<br><br><strong>Gerçekçi Örnek:</strong> Kod yazarken yaptığınız imla hatalarını renkli olarak uyarır, fonksiyon isimlerini siz yazarken otomatik tamamlar ve projenizi tek tıkla çalıştırmanızı sağlar."
    },
    "transformers": {
        turkishTitle: "Hugging Face Yapay Zeka Modelleri Kütüphanesi",
        turkishSummary: "ChatGPT, BERT, LLaMA gibi dünyaca ünlü yapay zeka modellerini Python projelerinize birkaç satır kodla entegre etmenizi sağlayan standart kütüphanedir.",
        whyUseful: "Devasa yapay zeka modellerini sıfırdan eğitmek yerine, önceden eğitilmiş en güçlü dil ve görsel modellerini doğrudan kendi uygulamanızda çalıştırmanızı sağlar.",
        beginnerExplanation: "Hazır yapay zeka zekalarını projenize bir eklenti gibi bağlamanızı imkanlı kılar.<br><br><strong>Gerçekçi Örnek:</strong> Müşteri yorumlarını analiz edip hangilerinin olumlu hangilerinin şikayet olduğunu tespit eden veya uzun makaleleri 2 cümlede özetleyen bir yapay zeka uygulamasını hızlıca hazırlayabilirsiniz."
    },
    "stable-diffusion-webui": {
        turkishTitle: "Yerel AI Görsel Üretim Web Arayüzü",
        turkishSummary: "Bilgisayarınızda metin komutlarından yüksek kalitede görseller üreten Stable Diffusion modelini tarayıcı üzerinden kullanmanızı sağlanan arayüzdür.",
        whyUseful: "Midjourney gibi ücretli servislere bağımlı olmadan kendi ekran kartınız üzerinden sınırsız ve ücretsiz sanatsal görseller üretmenizi sağlar.",
        beginnerExplanation: "Yazdığınız Türkçe veya İngilizce kelimeleri dijital tablolara ve fotoğraflara dönüştüren kişisel görsel stüdyonuzdur.<br><br><strong>Gerçekçi Örnek:</strong> 'Uzayda yürüyen siberpunk bir kedi' metnini girerek saniyeler içinde benzersiz dijital çizimler ve yüksek çözünürlüklü fotoğraflar ürettirebilirsiniz."
    },
    "markitdown": {
        turkishTitle: "Belgeleri Yapay Zeka Formatına Çevirici",
        turkishSummary: "Microsoft tarafından geliştirilen; PDF, Word, Excel, PowerPoint ve resim dosyalarını yapay zekaların (LLM) okuyabileceği Markdown metnine dönüştüren araçtır.",
        whyUseful: "Karmaşık şirket içi dökümanları ve tabloları yapay zeka modellerine eksiksiz veri olarak besleme sürecini saniyelere indirir.",
        beginnerExplanation: "Farklı formatlardaki tüm belgelerinizi yapay zekanın anlayacağı tek bir düz metin diline çevirir.<br><br><strong>Gerçekçi Örnek:</strong> 100 sayfalık karmaşık bir PDF sunumunu tek bir komutla yapay zekaya aktarabileceğiniz temiz Markdown belgesine dönüştürür."
    },
    "prompts.chat": {
        turkishTitle: "Harika ChatGPT Komutları Koleksiyonu",
        turkishSummary: "Yapay zeka modellerinden (ChatGPT, Claude vb.) en doğru yanıtları almak için hazırlanmış özelleştirilmiş komut (prompt) kütüphanesidir.",
        whyUseful: "Yapay zekayı belirli bir uzmanlık rolüne sokarak sıradan cevaplar yerine profesyonel çıktılar elde etmenizi sağlar.",
        beginnerExplanation: "Yapay zekaya doğru soruları sormanızı sağlayan hazır rol oynama cümleleri koleksiyonudur.<br><br><strong>Gerçekçi Örnek:</strong> Yapay zekaya 'Sen 20 yıllık bir İngilizce öğretmenisin, benimle B2 seviyesinde konuş ve hatalarımı düzelt' komutunu vererek etkileşimli dil pratiği yapabilirsiniz."
    },
    "ohmyzsh": {
        turkishTitle: "Terminal Özelleştirme ve Eklenti Çerçevesi",
        turkishSummary: "Zsh komut satırını özelleştiren, renkli temalar, otomatik kod tamamlama ve git kısayol eklentileri sunan popüler bir araçtır.",
        whyUseful: "Geliştiricilerin terminaldeki çalışma hızını artırır, hangi git dalında olduğunu ve komut geçmişini renklendirerek görünür kılar.",
        beginnerExplanation: "Sıkıcı siyah-beyaz komut satırınızı renkli, akıllı ve hızlı bir çalışma alanına dönüştürür.<br><br><strong>Gerçekçi Örnek:</strong> Komut yazarken ilk iki harfini yazdığınızda geçmişteki komutlarınızı otomatik önerir ve git projenizin durumunu ikonlarla terminalde gösterir."
    },
    "bootstrap": {
        turkishTitle: "Bootstrap Mobil Uyumlu HTML/CSS Çerçevesi",
        turkishSummary: "Dünyanın en popüler mobil öncelikli responsive web sitesi geliştirme ve stil kütüphanesidir.",
        whyUseful: "Sıfırdan CSS stilleri yazmak yerine hazır butonlar, navigasyon çubukları, modallar ve ızgara sistemleri sunarak web sitesi tasarımını çok hızlandırır.",
        beginnerExplanation: "Web siteniz için hazır mobilya takımı gibidir. Tasarımla saatlerce uğraşmadan şık butonlar ve menüler eklemenizi sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Telefon ekranında da bilgisayar ekranında da kusursuz görünen esnek bir web sayfasını hazır yapı bloklarıyla yarım saatte kurabilirsiniz."
    },
    "flutter": {
        turkishTitle: "Flutter Çapraz Platform Mobil UI Kit",
        turkishSummary: "Google tarafından geliştirilen; tek bir kod tabanıyla iOS, Android, Web ve Masaüstü uygulamaları inşa etmeyi sağlayan çerçevedir.",
        whyUseful: "Aynı uygulamayı hem iPhone hem de Android için ayrı ayrı yazma zorunluluğunu kaldırır, maliyet ve süreci yarı yarıya azaltır.",
        beginnerExplanation: "Tek bir dilde (Dart) kod yazarak aynı uygulamanın hem App Store'da hem Google Play Store'da çalışmasını sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Bir yemek siparişi uygulaması yazarken tek kodla hem iPhone kullanıcılarına hem Samsung kullanıcılarına aynı kalitede uygulama sunarsınız."
    },
    "vue": {
        turkishTitle: "Vue.js İlerici JavaScript Çerçevesi",
        turkishSummary: "Kullanıcı arayüzleri inşa etmek için geliştirilen, öğrenmesi son derece kolay ve performanslı bir JavaScript kütüphanesidir.",
        whyUseful: "Web sitenize adım adım entegre edilebilir; küçük bir form kontrolünden devasa tek sayfalık uygulamalara (SPA) kadar esnekçe büyür.",
        beginnerExplanation: "Web sayfalarındaki dinamik alanları (sepet tutarı, canlı arama sonuçları vb.) çok az kod yazarak yönetmenizi sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Bir e-ticaret sitesinde sepetinize ürün eklediğinizde sayfa yenilenmeden sağ üstteki sepet tutarının anında güncellenmesini sağlar."
    }
};

function getSmartDomainExplanation(repo) {
    const name = (repo.name || '').toLowerCase();
    const desc = (repo.description || '').toLowerCase();
    const lang = repo.language || 'Yazılım';
    const topics = Array.isArray(repo.topics) ? repo.topics.join(' ').toLowerCase() : '';
    const fullText = `${name} ${desc} ${topics}`;

    // 1. Check if repo is in curated knowledge base
    if (REPO_SPECIFIC_KNOWLEDGE[repo.name]) {
        return REPO_SPECIFIC_KNOWLEDGE[repo.name];
    }
    
    // 2. Domain classification based on keywords
    if (fullText.includes('agent') || fullText.includes('autonomous') || fullText.includes('llm') || fullText.includes('gpt') || fullText.includes('ai assistant')) {
        return {
            turkishTitle: `${repo.name} Yapay Zeka Ajanı`,
            turkishSummary: `Bu proje, yapay zeka modellerinin kendi kendine mantık yürütmesini ve karmaşık otonom görevleri yapmasını sağlayan bir sistemdir.`,
            whyUseful: `Tekrarlayan araştırmaları, dosya işlemlerini ve veri analizlerini insan müdahalesi olmadan yapay zekaya yaptırmanızı sağlar.`,
            beginnerExplanation: `Bu araç, yapay zekanın sadece sorulara cevap vermekle kalmayıp sizin yerinize çok adımlı görevleri yürütmesini sağlar.<br><br><strong>Gerçekçi Örnek:</strong> 'Bana güncel haberleri derle ve özet rapor çıkar' dediğinizde internette arama yapıp rapor belgesi oluşturan dijital bir asistandır.`
        };
    }
    
    if (fullText.includes('mcp') || fullText.includes('skill') || fullText.includes('tool') || fullText.includes('plugin') || fullText.includes('extension')) {
        return {
            turkishTitle: `${repo.name} Yetenek & Entegrasyon Aracı`,
            turkishSummary: `Bu araç, mevcut sistemlere veya yapay zeka modellerine ek yetenekler, bağlantılar ve işlevler kazandıran bir modüldür.`,
            whyUseful: `Sıfırdan bağlantı mantığı yazmak yerine, uygulamanıza veya ajanınıza hazır yeni yetenekler (dosya okuma, API bağlama vb.) eklemenizi sağlar.`,
            beginnerExplanation: `Tıpkı akıllı telefonunuza yeni bir uygulama indirip ekstra özellik kazandırmak gibi, bu modül de sisteminize yeni bir yetenek ekler.<br><br><strong>Gerçekçi Örnek:</strong> Yapay zekanıza veritabanındaki verileri doğrudan sorgulama veya terminalde komut çalıştırma yeteneği kazandırır.`
        };
    }

    if (fullText.includes('react') || fullText.includes('vue') || fullText.includes('ui') || fullText.includes('frontend') || fullText.includes('css') || fullText.includes('component')) {
        return {
            turkishTitle: `${repo.name} Arayüz (UI) Kütüphanesi`,
            turkishSummary: `Bu proje, modern web sayfaları ve kullanıcı arayüzü bileşenleri (butonlar, menüler, kartlar) geliştirmek için tasarlanmıştır.`,
            whyUseful: `Sayfa yenilenmesine gerek kalmadan dinamik ve hızlı çalışan kullanıcı arayüzleri inşa etmenizi kolaylaştırır.`,
            beginnerExplanation: `Web sitenizi tek parça tasarlamak yerine lego parçaları gibi bağımsız bileşenler halinde oluşturmanızı sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Bir sitede bildirim ikonuna basıldığında sayfa yenilenmeden bildirim kutusunun yumuşak bir animasyonla açılmasını sağlar.`
        };
    }

    if (fullText.includes('database') || fullText.includes('db') || fullText.includes('sql') || fullText.includes('redis') || fullText.includes('mongo') || fullText.includes('storage')) {
        return {
            turkishTitle: `${repo.name} Veritabanı Servisi`,
            turkishSummary: `Bu proje, uygulama verilerini yüksek hızda depolamak, sorgulamak ve güvenle saklamak için geliştirilmiş bir veritabanı çözümüdür.`,
            whyUseful: `Binlerce kullanıcının anlık verilerini milisaniyeler içinde çökmeksizin kaydetmenize ve aradığınız bilgiye anında ulaşmanıza imkan tanır.`,
            beginnerExplanation: `Kullanıcı şifreleri, alışveriş sepetleri veya mesajlaşma geçmişi gibi tüm bilgilerin güvenle saklandığı dijital kasadır.<br><br><strong>Gerçekçi Örnek:</strong> Bir e-ticaret sitesinde arama kutusuna 'ayakkabı' yazdığınızda milyonlarca ürün arasından doğru ürünleri milisaniyeler içinde önünüze getirir.`
        };
    }

    if (fullText.includes('cli') || fullText.includes('terminal') || fullText.includes('command') || fullText.includes('shell') || fullText.includes('script')) {
        return {
            turkishTitle: `${repo.name} Komut Satırı (CLI) Aracı`,
            turkishSummary: `Bu araç, komut satırı (terminal) üzerinden geliştirici süreçlerini otomatikleştiren ve hızlı işlemler yapmayı sağlayan bir yardımcıdır.`,
            whyUseful: `Grafik arayüzlerle saatler sürecek tekrarlayan işleri tek bir komut satırı cümlesiyle saniyeler içinde tamamlamanızı sağlar.`,
            beginnerExplanation: `Fareyle tıklamak yerine siyah ekran (terminal) üzerinden tek satırlık komutlarla hızlı işlemler yapmanızı sağlar.<br><br><strong>Gerçekçi Örnek:</strong> Masaüstünüzdeki 500 adet fotoğrafı tek bir komutla boyutlandırıp web formatına dönüştürmenize imkan tanır.`
        };
    }

    if (fullText.includes('security') || fullText.includes('auth') || fullText.includes('crypto') || fullText.includes('vulnerability') || fullText.includes('audit')) {
        return {
            turkishTitle: `${repo.name} Güvenlik & Doğrulama Modülü`,
            turkishSummary: `Bu proje, yazılımlardaki güvenlik açıklarını tespit etmek, şifreleme yapmak veya kullanıcı yetkilerini yönetmek için geliştirilmiştir.`,
            whyUseful: `Uygulamalarınızın yetkisiz kişilerin erişimine, şifre çalınmasına veya dış siber saldırılara karşı korumalı kalmasını sağlar.`,
            beginnerExplanation: `Yazılımınızın etrafına örülen dijital bir güvenlik duvarıdır.<br><br><strong>Gerçekçi Örnek:</strong> Kullanıcı giriş yaparken şifrelerin güvenli biçimde kırılması imkansız kodlara dönüştürülerek veritabanında saklanmasını sağlar.`
        };
    }

    if (fullText.includes('api') || fullText.includes('http') || fullText.includes('rest') || fullText.includes('graphql') || fullText.includes('sdk')) {
        return {
            turkishTitle: `${repo.name} Servis Entegrasyon Bağlantısı`,
            turkishSummary: `Bu proje, farklı yazılımların ve web servislerinin birbirleriyle veri alışverişi yapmasını sağlayan bir bağlantı katmanıdır.`,
            whyUseful: `Harici sistemlere (ödeme sistemleri, haritalar, sosyal medya) uygulamanız üzerinden güvenle bağlanmanızı sağlar.`,
            beginnerExplanation: `İki farklı yazılımın birbiriyle konuşmasını sağlayan dijital bir tercümandır.<br><br><strong>Gerçekçi Örnek:</strong> Sitenize 'Google ile Giriş Yap' butonu eklerken Google sunucularıyla güvenle iletişim kurulmasını sağlar.`
        };
    }

    // Default fallback - Domain-aware by Primary Language
    return {
        turkishTitle: `${repo.name.charAt(0).toUpperCase() + repo.name.slice(1)} Projesi`,
        turkishSummary: repo.description ? `Bu proje, ${lang} ekosisteminde geliştirilmiş: ${repo.description}` : `Bu proje, ${lang} geliştiricileri için hazırlanmış açık kaynaklı bir araçtır.`,
        whyUseful: `Bu araç ${lang} projelerinde geliştirme sürecini hızlandırmak, tekrarlayan mantıkları basitleştirmek ve standartlara uygun kod yazmak için tercih edilir.`,
        beginnerExplanation: `Bu proje, <strong>${escapeHtml(lang)}</strong> ekosisteminde geliştiricilerin işlerini kolaylaştıran açık kaynaklı bir araçtır.<br><br><strong>Gerçekçi Örnek:</strong> Projenizde sıfırdan karmaşık bir özellik yazmak yerine, bu hazır açık kaynaklı modülü entegre ederek zamandan tasarruf edebilir ve güvenilir bir altyapı kullanabilirsiniz.`
    };
}

function closeModal() {
    elements.detailModal.classList.remove('active');
    elements.detailModal.setAttribute('aria-hidden', 'true');
    elements.detailModal.inert = true;
    state.currentSelectedRepo = null;
}

// 7. Toast Notification Utility
let toastTimeout;
function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.style.background = isError ? 'rgba(239, 68, 68, 0.9)' : 'rgba(168, 85, 247, 0.9)';
    elements.toast.classList.add('active');
    
    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('active');
    }, 2500);
}

// 8. Premium & Payment Management
function initPremium() {
    if (typeof document === 'undefined') return;

    // Show/hide UI sections based on active subscription
    refreshSubscriptionUI();

    elements.paymentModalClose.addEventListener('click', closePaymentModal);
    elements.paymentModal.addEventListener('click', (e) => {
        if (e.target === elements.paymentModal) closePaymentModal();
    });

    // Real-time synchronization: Card Holder
    elements.cardHolderInput.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        elements.previewCardHolder.textContent = val || 'AD SOYAD';
    });

    // Real-time synchronization: Card Number
    elements.cardNumberInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = '';
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += val[i];
        }
        e.target.value = formatted;
        elements.previewCardNumber.textContent = formatted || '•••• •••• •••• ••••';
    });

    // Real-time synchronization: Expiry Date
    elements.cardExpiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        e.target.value = val;
        elements.previewCardExpiry.textContent = val || 'AA/YY';
    });

    // Handle checkout submission
    elements.paySubmitBtn.addEventListener('click', () => {
        const holder = elements.cardHolderInput.value.trim();
        const number = elements.cardNumberInput.value.replace(/\s+/g, '');
        const expiry = elements.cardExpiryInput.value.trim();
        const cvc = elements.cardCvcInput.value.trim();

        if (holder.length < 5) {
            showToast('Lütfen kart sahibinin adını tam girin.', true);
            return;
        }
        if (number.length !== 16) {
            showToast('Lütfen 16 haneli kart numarasını tam girin.', true);
            return;
        }
        if (expiry.length !== 5 || !expiry.includes('/')) {
            showToast('Lütfen geçerli son kullanma tarihi girin (AA/YY).', true);
            return;
        }
        if (cvc.length !== 3) {
            showToast('Lütfen 3 haneli güvenlik kodunu (CVC) girin.', true);
            return;
        }

        // Simulating loading overlay
        elements.paySubmitBtn.textContent = '🔒 Ödeme Alınıyor...';
        elements.paySubmitBtn.disabled = true;

        setTimeout(() => {
            setPremiumSession('Demo ödeme kullanıcısı');
            
            elements.paySubmitBtn.textContent = 'Demo Ödemeyi Tamamla (99 TL)';
            elements.paySubmitBtn.disabled = false;
            
            closePaymentModal();
            refreshSubscriptionUI();
            renderCuratedRepos();
            
            // Auto generate license code for feedback simulation
            const generatedLicense = 'GTR-' + Math.floor(10000 + Math.random() * 90000);
            showToast(`💎 Tebrikler! Abone oldunuz. Lisans Anahtarınız: ${generatedLicense}`);
        }, 1500);
    });

    // License activation logic
    elements.activateLicenseBtn.addEventListener('click', () => {
        const license = elements.licenseKeyInput.value.trim();
        if (/^GTR-\d{5}$/.test(license)) {
            setPremiumSession('Lisans kullanıcısı');
            refreshSubscriptionUI();
            renderCuratedRepos();
            showToast('🔑 Lisans anahtarı başarıyla doğrulandı! Premium aktifleşti.');
            elements.licenseKeyInput.value = '';
        } else {
            showToast('Geçersiz lisans kodu. Örnek biçim: GTR-12345', true);
        }
    });

    // Toggle views: Show Login Form
    elements.toggleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.premiumSubscriptionContainer.hidden = true;
        elements.premiumLoginContainer.hidden = false;
        elements.premiumLoginError.textContent = '';
        elements.premiumEmailInput.focus();
    });

    // Toggle views: Show Pricing / Register Form
    elements.toggleRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPremiumSubscriptionView();
    });

    // Handle Premium Login Submission
    elements.premiumLoginContainer.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = elements.premiumEmailInput.value.trim();
        const password = elements.premiumPasswordInput.value;
        const validation = validatePremiumLogin(email, password);

        elements.premiumLoginError.textContent = validation.message || '';
        if (!validation.isValid) {
            showToast(validation.message, true);
            return;
        }

        // Simulating authentication delay
        elements.premiumLoginSubmitBtn.textContent = '🔑 Giriş Yapılıyor...';
        elements.premiumLoginSubmitBtn.disabled = true;

        setTimeout(() => {
            elements.premiumLoginSubmitBtn.textContent = '🔑 Premium Giriş Yap';
            elements.premiumLoginSubmitBtn.disabled = false;

            setPremiumSession(email.toLowerCase());
            elements.premiumEmailInput.value = '';
            elements.premiumPasswordInput.value = '';
            elements.premiumLoginError.textContent = '';
            showPremiumSubscriptionView();
            refreshSubscriptionUI();
            renderCuratedRepos();
            showToast('Premium demo hesabına giriş yapıldı.');
        }, 500);
    });
}

function validatePremiumLogin(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { isValid: false, message: 'Geçerli bir e-posta adresi girin.' };
    }

    if (String(password || '').length < 6) {
        return { isValid: false, message: 'Şifre en az 6 karakter olmalıdır.' };
    }

    if (normalizedEmail !== DEMO_PREMIUM_ACCOUNT.email || password !== DEMO_PREMIUM_ACCOUNT.password) {
        return { isValid: false, message: 'E-posta veya şifre hatalı. Demo hesap bilgilerini kullanın.' };
    }

    return { isValid: true, message: '' };
}

function setPremiumSession(email) {
    state.isSubscribed = true;
    state.premiumEmail = email;
    localStorage.setItem(PREMIUM_STORAGE_KEY, 'true');
    localStorage.setItem(PREMIUM_EMAIL_STORAGE_KEY, email);
}

function clearPremiumSession() {
    state.isSubscribed = false;
    state.premiumEmail = '';
    localStorage.removeItem(PREMIUM_STORAGE_KEY);
    localStorage.removeItem(PREMIUM_EMAIL_STORAGE_KEY);
}

function showPremiumSubscriptionView() {
    elements.premiumLoginContainer.hidden = true;
    elements.premiumSubscriptionContainer.hidden = false;
}

function refreshSubscriptionUI() {
    if (typeof document === 'undefined') return;

    if (state.isSubscribed) {
        if (isElectron) {
            elements.premiumStatusSection.innerHTML = `
                <div class="api-status-badge active" style="margin-bottom: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <span class="status-dot"></span>
                    <span>Masaüstü Sürümü — Sınırsız &amp; Ücretsiz</span>
                </div>
            `;
            if (elements.premiumActivationSection) {
                elements.premiumActivationSection.style.display = 'none';
            }
        } else {
            elements.premiumStatusSection.innerHTML = `
                <div class="api-status-badge active" style="margin-bottom: 0;">
                    <span class="status-dot"></span>
                    <span>Premium erişim aktif${state.premiumEmail ? ` — ${escapeHtml(state.premiumEmail)}` : ''}</span>
                </div>
                <button id="premium-logout-btn" class="secondary-btn" style="margin-top: 1rem; width: 100%;">
                    Premium Çıkış Yap
                </button>
            `;
            if (elements.premiumActivationSection) {
                elements.premiumActivationSection.style.display = 'none';
            }
            document.getElementById('premium-logout-btn').addEventListener('click', () => {
                clearPremiumSession();
                refreshSubscriptionUI();
                renderCuratedRepos();
                showToast('Premium oturumu kapatıldı.');
            });
        }
    } else {
        elements.premiumStatusSection.innerHTML = `
            <button id="open-pay-modal-btn" class="primary-btn" style="width: 100%; font-size: 1.1rem; padding: 1rem;">
                💳 Hemen Abone Ol (99 TL)
            </button>
        `;
        if (elements.premiumActivationSection) {
            elements.premiumActivationSection.style.display = 'block';
        }
        // Re-bind click event
        document.getElementById('open-pay-modal-btn').addEventListener('click', openPaymentModal);
    }
}

function openPaymentModal() {
    elements.paymentModal.classList.add('active');
    elements.paymentModal.inert = false;
    elements.paymentModal.setAttribute('aria-hidden', 'false');
    // Clear inputs
    elements.cardHolderInput.value = '';
    elements.cardNumberInput.value = '';
    elements.cardExpiryInput.value = '';
    elements.cardCvcInput.value = '';
    elements.previewCardHolder.textContent = 'AD SOYAD';
    elements.previewCardNumber.textContent = '•••• •••• •••• ••••';
    elements.previewCardExpiry.textContent = 'AA/YY';
    elements.paymentModalClose.focus();
}

function closePaymentModal() {
    elements.paymentModal.classList.remove('active');
    elements.paymentModal.setAttribute('aria-hidden', 'true');
    elements.paymentModal.inert = true;
}

// Global reference for inline buttons in template strings
if (typeof window !== 'undefined') {
    window.openPaymentModal = openPaymentModal;
}

// Node Exports for Testing
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        parseGitHubInput,
        generateDefaultInstructions,
        validatePremiumLogin,
        escapeHtml,
        fetchWeeklyPopularRepos,
        fetchMostStarredRepos,
        fetchAgentRepos,
        fetchSkillsRepos,
        getSmartDomainExplanation,
        REPO_SPECIFIC_KNOWLEDGE,
        state
    };
}
