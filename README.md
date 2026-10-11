# GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni

GitTürkçe, GitHub üzerinde yayınlanan ve yazılımcıların/öğrencilerin işine yarayacak popüler ve güncel açık kaynak kodlu projeleri keşfetmeyi, Türkçeye çevirmeyi ve herkesin anlayabileceği sade bir dille açıklamayı amaçlayan modern bir web uygulamasıdır.

## 🚀 Özellikler (Features)

1. **Özenle Seçilmiş Popüler Projeler (Curated Hub):** Yapay Zeka, Web Geliştirme, Mobil/Masaüstü ve Geliştirici Araçları gibi kategorilerde 100 seçkin projenin hazır Türkçe özetleri, kullanım alanları ve kurulum adımları. Ajanlar (Agent) ve Yetenekler (Skills) kategorileri GitHub API'den canlı çekilir.
2. **Canlı GitHub Arama ve Link Tespiti:** Arama kutusuna yazılan anahtar kelimeleri arar veya doğrudan yapıştırılan bir GitHub linkini (URL) algılayıp detaylarını çeker.
3. **Akıllı Çeviri Motoru (MyMemory Fallback):** İngilizce açıklamaları ücretsiz ve anahtarsız MyMemory API üzerinden anlık olarak Türkçeye çevirir.
4. **Gemini Yapay Zeka Entegrasyonu:** Ayarlar sekmesinden eklenebilen ücretsiz bir Gemini API Anahtarı ile projeleri derinlemesine analiz eder; sade bir dille "Nedir?", "Neden Yararlıdır?" ve "Nasıl Başlanır?" adımlarını otonom üretir.
5. **Kurulum ve İndirme Paneli:** Beğenilen projeleri ZIP olarak indirme butonu ve projenin diline göre otomatik üretilen terminal kurulum komutları (kopyalama özellikli).
6. **Responsive Tasarım:** Telefon, tablet ve bilgisayarlardan kolayca erişilebilir, göz yormayan karanlık tema (Dark Mode) ve glassmorphism görsel stili.
7. **Haftanın En Popüler 100 GitHub Projesi:** Son 7 günde oluşturulmuş ve en yüksek yıldız almış projeleri GitHub API üzerinden gerçek zamanlı çekip listeleyen yeni sekme.
8. **macOS Masaüstü Uygulaması (Electron):** Web ve masaüstü sürümlerinde tüm özellikler ücretsizdir.
9. **En Çok Yıldız Alan 100 Proje:** Tüm zamanların en çok yıldız alan projelerini GitHub API üzerinden listeleyen sekme.
10. **Favoriler:** Proje kartından veya detay panelinden favoriye ekleme/çıkarma; favoriler tarayıcıda (`localStorage`) saklanır ve "Favorilerim" filtresinde listelenir.
11. **Dile Göre Süzme:** Proje listesini programlama diline göre filtreleme.
12. **Proje Detay Eylemleri:** Depoyu VS Code'da klonlamak için açma, `git clone` komutunu kopyalama ve Türkçe proje özetini paylaşma.
13. **Projeye Özel Türkçe Açıklamalar:** Bilinen projeler için elle yazılmış, bilinmeyenler için alan tespitiyle (yapay zeka ajanı, veritabanı vb.) üretilen sade Türkçe açıklamalar.

---

## 🛠️ Kurulum ve Çalıştırma (Installation & Usage)

Uygulama herhangi bir sunucu veya derleme adımı gerektirmeden doğrudan tarayıcıda çalışabilir.

### Yerel Olarak Çalıştırma (Web):
1. Depoyu klonlayın ve klasöre girin:
   ```bash
   git clone https://github.com/owner/repo-name.git
   cd repo-name
   ```
2. Bağımlılıkları kurun:
   ```bash
   npm install
   ```
3. Tarayıcınızda `index.html` dosyasını doğrudan açın VEYA yerel geliştirme sunucusu başlatın:
   ```bash
   python3 -m http.server 8000
   ```

### Masaüstü (macOS) Uygulaması Olarak Çalıştırma:
1. Geliştirme modunda başlatın:
   ```bash
   npm start
   ```
2. macOS uygulaması (.app) olarak paketleyin:
   ```bash
   npm run build:mac
   ```
   Apple Silicon (M1/M2/M3/M4) için optimize edilmiş uygulama `dist/GitTurkce-darwin-arm64/` klasörüne kaydedilir.

   Intel + Apple Silicon birlikte desteklemek için:
   ```bash
   npm run build:mac:universal
   ```

3. **Uygulama açılmıyorsa (macOS):** İmzasız uygulamalarda macOS güvenlik uyarısı çıkabilir. Çözüm:
   - Finder'da uygulamaya sağ tıklayıp **Aç** seçeneğini kullanın (ilk seferde).
   - Veya Terminal'de: `xattr -cr dist/GitTurkce-darwin-arm64/GitTurkce.app`
   - Uygulamayı internetten indirdiyseniz karantina özniteliğini kaldırmak gerekir.

---

## 🧪 Testler (Testing)

Projede core fonksiyonları (URL ayrıştırma, kurulum komutları üretimi) test etmek için Jest framework'ü kuruludur.

Testleri çalıştırmak için:
1. Gerekli paketleri kurun:
   ```bash
   npm install
   ```
2. Kalite kontrollerini çalıştırın:
   ```bash
   npm run validate:html
   npm run lint
   npm test
   ```

---

## 📜 Değişiklik Günlüğü (Changelog)

### 2026-10-12
- Premium, üyelik, ödeme ve kart kilitleri kaldırıldı; web ve Electron uygulamasında tüm özellikler ücretsiz.

### 2026-07-21
- Favoriler, dile göre süzme, VS Code'da açma, klon komutu kopyalama ve proje özeti paylaşma eklendi.
- Projeye özel ve alan tespitli Türkçe açıklama motoru eklendi.
- ESLint `no-unused-vars` uyarıları giderildi; kart başlıkları, kelime kırma ve filtre düzeni responsive olarak düzeltildi.

### 2026-07-16
- "Ajanlar" ve "Yetenekler" kategorileri ile "En Çok Yıldız Alan 100" sekmesi eklendi; veriler GitHub API'den canlı çekiliyor.
- macOS (Electron) masaüstü sürümü geçişi tamamlandı.
- Masaüstü modunda premium üyelik ve kilit sistemini devre dışı bırakan entegrasyon yapıldı.
- Son 7 günün en popüler 100 projesini gerçek zamanlı getiren "Haftalık Popüler 100" sekmesi eklendi.
- API çağrıları için Jest birim testleri eklendi ve tüm kalite kontrolleri başarıyla tamamlandı.

### 2026-07-02
- Premium demo üye girişi, doğrulama, oturum durumu ve çıkış akışı tamamlandı.
- Herhangi bir e-posta/şifreyle premium erişimin açılmasına neden olan doğrulama hatası giderildi.
- Modal HTML yapısı, klavye erişimi ve ekran okuyucu görünürlüğü düzeltildi.
- Harici proje verileri ve yerel oturum bilgisinde HTML enjeksiyonu koruması eklendi.
- ESLint, HTML doğrulama ve premium giriş birim testleri eklendi.

### v1.0.0 (2026-06-23)
- Projenin ilk sürümü yayınlandı.
- 12 seçkin projenin Türkçe veritabanı (`data.js`) oluşturuldu.
- Canlı GitHub API arama ve tekil URL tespiti eklendi.
- MyMemory API ile standart Türkçe çeviri desteği kuruldu.
- Gemini API ile yapay zeka tabanlı akıllı özetleme özelliği eklendi.
- ZIP indirme ve akıllı kod kopyalama terminalleri modal paneline entegre edildi.
- Responsive, parıltılı mor/cyan karanlık tema tasarımı tamamlandı.
