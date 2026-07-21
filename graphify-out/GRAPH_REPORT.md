# Graph Report - zealous-goodall  (2026-07-16)

## Corpus Check
- 8 files · ~14,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 88 nodes · 128 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e79f6f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_app.js|app.js]]
- [[_COMMUNITY_app.test.js|app.test.js]]
- [[_COMMUNITY_GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni|GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni]]
- [[_COMMUNITY_renderCuratedRepos|renderCuratedRepos]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_rules|rules]]
- [[_COMMUNITY_eslint.config.js|eslint.config.js]]
- [[_COMMUNITY_main.js|main.js]]
- [[_COMMUNITY_data.js|data.js]]

## God Nodes (most connected - your core abstractions)
1. `renderCuratedRepos()` - 8 edges
2. `initPremium()` - 8 edges
3. `performSearch()` - 7 edges
4. `refreshSubscriptionUI()` - 7 edges
5. `scripts` - 7 edges
6. `createRepoCard()` - 6 edges
7. `escapeHtml()` - 5 edges
8. `saveToSearchCache()` - 5 edges
9. `translateAndSummarize()` - 5 edges
10. `showToast()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `initPremium()` --calls--> `renderCuratedRepos()`  [EXTRACTED]
  app.js → app.js  _Bridges community 3 → community 0_
- `renderCuratedRepos()` --calls--> `fetchMostStarredRepos()`  [EXTRACTED]
  app.js → app.js  _Bridges community 3 → community 1_

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.20
Nodes (16): closeModal(), closePaymentModal(), DEMO_PREMIUM_ACCOUNT, fetchGeminiSummary(), fetchMyMemoryTranslation(), generateDefaultInstructions(), initModal(), initPremium() (+8 more)

### Community 1 - "app.test.js"
Cohesion: 0.24
Nodes (10): fetchGitHubRepo(), fetchMostStarredRepos(), fetchWeeklyPopularRepos(), initSearch(), parseGitHubInput(), performSearch(), saveToSearchCache(), searchGitHub() (+2 more)

### Community 2 - "GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni"
Cohesion: 0.18
Nodes (10): 2026-07-02, 2026-07-16, 📜 Değişiklik Günlüğü (Changelog), GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni, 🛠️ Kurulum ve Çalıştırma (Installation & Usage), Masaüstü (macOS) Uygulaması Olarak Çalıştırma:, 🧪 Testler (Testing), v1.0.0 (2026-06-23) (+2 more)

### Community 3 - "renderCuratedRepos"
Cohesion: 0.27
Nodes (10): clearPremiumSession(), createRepoCard(), escapeHtml(), getCuratedFallbackBeginnerExplanation(), initFilters(), openPaymentModal(), openRepoDetail(), refreshSubscriptionUI() (+2 more)

### Community 4 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, jest, modulePathIgnorePatterns, keywords, license, main, name (+1 more)

### Community 5 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, electron, electron-packager, eslint, @eslint/js, globals, html-validate, jest

### Community 6 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build:mac, build:mac:universal, lint, start, test, validate:html

### Community 7 - "rules"
Cohesion: 0.40
Nodes (4): extends, rules, no-inline-style, prefer-native-element

## Knowledge Gaps
- **38 isolated node(s):** `extends`, `no-inline-style`, `prefer-native-element`, `DEMO_PREMIUM_ACCOUNT`, `state` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `extends`, `no-inline-style`, `prefer-native-element` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._