# GitTürkçe - Türkçe GitHub Kaşifi & Çevirmeni

GitTürkçe, GitHub üzerinde yayınlanan ve yazılımcıların/öğrencilerin işine yarayacak popüler ve güncel açık kaynak kodlu projeleri keşfetmeyi, Türkçeye çevirmeyi ve herkesin anlayabileceği sade bir dille açıklamayı amaçlayan modern bir web uygulamasıdır.

## 🚀 Özellikler (Features)

1. **Özenle Seçilmiş Popüler Projeler (Curated Hub):** Yapay Zeka, Web Geliştirme, Mobil/Masaüstü ve Geliştirici Araçları gibi kategorilerde en popüler 12 projenin hazır Türkçe özetleri, kullanım alanları ve kurulum adımları.
2. **Canlı GitHub Arama ve Link Tespiti:** Arama kutusuna yazılan anahtar kelimeleri arar veya doğrudan yapıştırılan bir GitHub linkini (URL) algılayıp detaylarını çeker.
3. **Akıllı Çeviri Motoru (MyMemory Fallback):** İngilizce açıklamaları ücretsiz ve anahtarsız MyMemory API üzerinden anlık olarak Türkçeye çevirir.
4. **Gemini Yapay Zeka Entegrasyonu:** Ayarlar sekmesinden eklenebilen ücretsiz bir Gemini API Anahtarı ile projeleri derinlemesine analiz eder; sade bir dille "Nedir?", "Neden Yararlıdır?" ve "Nasıl Başlanır?" adımlarını otonom üretir.
5. **Kurulum ve İndirme Paneli:** Beğenilen projeleri ZIP olarak indirme butonu ve projenin diline göre otomatik üretilen terminal kurulum komutları (kopyalama özellikli).
6. **Responsive Tasarım:** Telefon, tablet ve bilgisayarlardan kolayca erişilebilir, göz yormayan premium karanlık tema (Dark Mode) ve glassmorphism görsel stili.

---

## 🛠️ Kurulum ve Çalıştırma (Installation & Usage)

Uygulama herhangi bir sunucu veya derleme adımı gerektirmeden doğrudan tarayıcıda çalışabilir.

### Yerel Olarak Çalıştırma:
1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/owner/repo-name.git
   cd repo-name
   ```
2. Tarayıcınızda `index.html` dosyasını çift tıklayarak doğrudan açın VEYA yerel bir geliştirme sunucusu başlatın:
   ```bash
   # Python ile hızlı sunucu başlatmak için:
   python3 -m http.server 8000
   ```
   Ardından tarayıcınızdan `http://localhost:8000` adresine gidin.

---

## 🧪 Testler (Testing)

Projede core fonksiyonları (URL ayrıştırma, kurulum komutları üretimi) test etmek için Jest framework'ü kuruludur.

Testleri çalıştırmak için:
1. Gerekli paketleri kurun:
   ```bash
   npm install
   ```
2. Test paketini koşturun:
   ```bash
   npm test
   ```

---

## 📜 Değişiklik Günlüğü (Changelog)

### v1.0.0 (2026-06-23)
- Projenin ilk sürümü yayınlandı.
- 12 seçkin projenin Türkçe veritabanı (`data.js`) oluşturuldu.
- Canlı GitHub API arama ve tekil URL tespiti eklendi.
- MyMemory API ile standart Türkçe çeviri desteği kuruldu.
- Gemini API ile yapay zeka tabanlı akıllı özetleme özelliği eklendi.
- ZIP indirme ve akıllı kod kopyalama terminalleri modal paneline entegre edildi.
- Responsive, parıltılı mor/cyan karanlık tema tasarımı tamamlandı.
- GitHub Actions CI test akış hattı kuruldu.
