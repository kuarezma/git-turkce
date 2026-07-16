# GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni

GitTürkçe, GitHub üzerinde yayınlanan ve yazılımcıların/öğrencilerin işine yarayacak popüler ve güncel açık kaynak kodlu projeleri keşfetmeyi, Türkçeye çevirmeyi ve herkesin anlayabileceği sade bir dille açıklamayı amaçlayan modern bir web uygulamasıdır.

## 🚀 Özellikler (Features)

1. **Özenle Seçilmiş Popüler Projeler (Curated Hub):** Yapay Zeka, Web Geliştirme, Mobil/Masaüstü ve Geliştirici Araçları gibi kategorilerde en popüler 12 projenin hazır Türkçe özetleri, kullanım alanları ve kurulum adımları.
2. **Canlı GitHub Arama ve Link Tespiti:** Arama kutusuna yazılan anahtar kelimeleri arar veya doğrudan yapıştırılan bir GitHub linkini (URL) algılayıp detaylarını çeker.
3. **Akıllı Çeviri Motoru (MyMemory Fallback):** İngilizce açıklamaları ücretsiz ve anahtarsız MyMemory API üzerinden anlık olarak Türkçeye çevirir.
4. **Gemini Yapay Zeka Entegrasyonu:** Ayarlar sekmesinden eklenebilen ücretsiz bir Gemini API Anahtarı ile projeleri derinlemesine analiz eder; sade bir dille "Nedir?", "Neden Yararlıdır?" ve "Nasıl Başlanır?" adımlarını otonom üretir.
5. **Kurulum ve İndirme Paneli:** Beğenilen projeleri ZIP olarak indirme butonu ve projenin diline göre otomatik üretilen terminal kurulum komutları (kopyalama özellikli).
6. **Responsive Tasarım:** Telefon, tablet ve bilgisayarlardan kolayca erişilebilir, göz yormayan premium karanlık tema (Dark Mode) ve glassmorphism görsel stili.
7. **Premium Demo Girişi:** Form doğrulaması, hatalı giriş geri bildirimi, kalıcı demo oturumu ve güvenli çıkış akışı. Demo hesap: `premium@gitturkce.com` / `premium123`.
8. **Haftanın En Popüler 100 GitHub Projesi:** Son 7 günde oluşturulmuş ve en yüksek yıldız almış projeleri GitHub API üzerinden gerçek zamanlı çekip listeleyen yeni sekme.
9. **macOS Masaüstü Uygulaması (Electron):** Web sürümündeki premium kilitleri devre dışı bırakan, tüm özellikleri sınırsız ve ücretsiz sunan masaüstü sürümü.

> **Not:** Premium giriş, ödeme ve lisans özellikleri bu statik sürümde tanıtım amaçlıdır. Gerçek üyelik, ödeme ve yetkilendirme için sunucu tarafı kimlik doğrulama ve ödeme sağlayıcısı entegrasyonu gerekir.

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
   Paketlenen uygulama `dist/` klasörü altına kaydedilecektir.

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

### 2026-07-16
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
