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

// Application State
const state = {
    activeTab: 'panel-curated',
    geminiApiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('git_tr_gemini_key') : '') || '',
    curatedFilter: 'all',
    isSubscribed: (typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_STORAGE_KEY) === 'true' : false),
    premiumEmail: (typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_EMAIL_STORAGE_KEY) : '') || '',
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
    modalRepoTitle: document.getElementById('modal-repo-title'),
    modalRepoTrTitle: document.getElementById('modal-repo-tr-title'),
    modalRepoLink: document.getElementById('modal-repo-link'),
    modalTrSummary: document.getElementById('modal-tr-summary'),
    modalWhyUseful: document.getElementById('modal-why-useful'),
    modalHowToUse: document.getElementById('modal-how-to-use'),
    modalDownloadZip: document.getElementById('modal-download-zip'),
    modalEnDesc: document.getElementById('modal-en-desc'),
    btnCopyCode: document.getElementById('btn-copy-code'),
    
    // Premium Panel & Modals
    premiumStatusSection: document.getElementById('premium-status-section'),
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

// 3. Curated Repositories Rendering & Filtering
function renderCuratedRepos() {
    elements.curatedGrid.innerHTML = '';
    
    const filteredRepos = state.curatedFilter === 'all' 
        ? CURATED_REPOSITORIES 
        : CURATED_REPOSITORIES.filter(repo => repo.tags.includes(state.curatedFilter));
        
    filteredRepos.forEach((repo, idx) => {
        // Lock every item after index 2 if they are not subscribed
        const isLocked = !state.isSubscribed && idx > 2;
        const card = createRepoCard(repo, true, isLocked);
        elements.curatedGrid.appendChild(card);
    });
}

function initFilters() {
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.curatedFilter = btn.getAttribute('data-category');
            renderCuratedRepos();
        });
    });
}

function createRepoCard(repo, isCurated, isLocked = false) {
    const card = document.createElement('div');
    card.className = isLocked ? 'repo-card locked' : 'repo-card';

    const repositoryTitle = isCurated ? `${repo.owner} / ${repo.name}` : repo.full_name;
    const repositoryDescription = isCurated ? repo.turkishSummary : (repo.description || 'Açıklama bulunmuyor.');
    
    card.innerHTML = `
        <div class="card-top">
            <div class="card-header">
                <span class="repo-lang-badge">${escapeHtml(repo.language || 'Kod')}</span>
                <span class="repo-stars">⭐ ${escapeHtml(repo.stars || '0')}</span>
            </div>
            <h3 class="repo-title">${escapeHtml(repositoryTitle || 'İsimsiz proje')}</h3>
            <h4 class="repo-tr-title">${escapeHtml(repo.turkishTitle || 'Yükleniyor...')}</h4>
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

function saveToSearchCache(key, value) {
    state.searchCache[key] = value;
    // Limit cache size in localStorage (keep max 30 items)
    const keys = Object.keys(state.searchCache);
    if (keys.length > 30) {
        delete state.searchCache[keys[0]];
    }
    localStorage.setItem('git_tr_search_cache', JSON.stringify(state.searchCache));
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
    
    // Fallback Translation (MyMemory Translation API)
    try {
        const translatedSummary = await fetchMyMemoryTranslation(originalDesc);
        
        // Auto-generate instructions based on primary language
        const setupInstructions = generateDefaultInstructions(repo.name, repo.owner.login || repo.owner, repo.language);
        
        return {
            turkishTitle: repo.name.charAt(0).toUpperCase() + repo.name.slice(1) + " Kütüphanesi",
            turkishSummary: translatedSummary,
            whyUseful: `Bu araç ${lang} ekosisteminde geliştiricilerin işlerini kolaylaştırmayı ve süreçleri hızlandırmayı amaçlayan açık kaynaklı bir kütüphanedir.`,
            howToUse: setupInstructions + "\n\n# 💡 Daha detaylı yapay zeka analizleri için Ayarlar sekmesinden ücretsiz Gemini API anahtarınızı ekleyin!"
        };
    } catch (error) {
        console.error('Translation fallback failed.', error);
        return {
            turkishTitle: repo.name + " Projesi",
            turkishSummary: `İngilizce Açıklama: ${originalDesc} (Çeviri hatası oluştu)`,
            whyUseful: "Bu projenin Türkçe açıklaması oluşturulamadı. Detaylar için orijinal İngilizce açıklamaya bakabilirsiniz.",
            howToUse: generateDefaultInstructions(repo.name, repo.owner.login || repo.owner, repo.language)
        };
    }
}

// Call Google Gemini API
async function fetchGeminiSummary(repo) {
    const prompt = `You are GitTürkçe, a highly skilled software engineer. Analyze the following GitHub repository and explain it in Turkish for developers and students. 
Provide a clear, readable, and highly accurate description. You must output the response strictly as a JSON object, with no markdown code block backticks (like \`\`\`json) and no other text around it.

Expected JSON Structure:
{
  "turkishTitle": "Short, catchy Turkish title (2-5 words)",
  "turkishSummary": "A simplified, easy-to-understand explanation of what the tool is in Turkish (2-3 sentences)",
  "whyUseful": "Explanation of why this tool is useful, who needs it, and the value it adds (2-3 sentences in Turkish)",
  "howToUse": "Step-by-step setup and run commands with explanations in Turkish"
}

Repository Details:
- Name: ${repo.name}
- Owner: ${repo.owner.login || repo.owner}
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
    elements.modalRepoLink.href = repo.githubUrl || repo.html_url;
    elements.modalDownloadZip.href = `https://github.com/${ownerName}/${repoName}/archive/refs/heads/${defaultBranch}.zip`;
    elements.modalEnDesc.textContent = repo.description || 'No description available.';
    
    // Visual show loading state for generated translations
    elements.modalRepoTrTitle.textContent = 'Yapay Zeka Analiz Ediyor...';
    elements.modalTrSummary.textContent = 'Açıklamalar Türkçeye çevriliyor ve analiz ediliyor...';
    elements.modalWhyUseful.textContent = 'Analiz ediliyor...';
    elements.modalHowToUse.textContent = '# Yükleniyor...';
    
    // Open Modal
    elements.detailModal.classList.add('active');
    elements.detailModal.inert = false;
    elements.detailModal.setAttribute('aria-hidden', 'false');
    elements.modalClose.focus();
    
    if (isCurated) {
        // Pre-populated data
        elements.modalRepoTrTitle.textContent = repo.turkishTitle;
        elements.modalTrSummary.textContent = repo.turkishSummary;
        elements.modalWhyUseful.textContent = repo.whyUseful;
        elements.modalHowToUse.textContent = repo.howToUse;
    } else {
        // Live data: needs API translation
        const aiData = await translateAndSummarize(repo);
        
        elements.modalRepoTrTitle.textContent = aiData.turkishTitle;
        elements.modalTrSummary.textContent = aiData.turkishSummary;
        elements.modalWhyUseful.textContent = aiData.whyUseful;
        elements.modalHowToUse.textContent = aiData.howToUse;
    }
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
        elements.premiumStatusSection.innerHTML = `
            <div class="api-status-badge active" style="margin-bottom: 0;">
                <span class="status-dot"></span>
                <span>Premium erişim aktif${state.premiumEmail ? ` — ${escapeHtml(state.premiumEmail)}` : ''}</span>
            </div>
            <button id="premium-logout-btn" class="secondary-btn" style="margin-top: 1rem; width: 100%;">
                Premium Çıkış Yap
            </button>
        `;
        document.getElementById('premium-logout-btn').addEventListener('click', () => {
            clearPremiumSession();
            refreshSubscriptionUI();
            renderCuratedRepos();
            showToast('Premium oturumu kapatıldı.');
        });
    } else {
        elements.premiumStatusSection.innerHTML = `
            <button id="open-pay-modal-btn" class="primary-btn" style="width: 100%; font-size: 1.1rem; padding: 1rem;">
                💳 Hemen Abone Ol (99 TL)
            </button>
        `;
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
        state
    };
}
