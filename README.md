# Dashboard Visualisasi Data Pasar Saham Indonesia

## Analisis Performa Saham Indonesia terhadap IHSG
### Visualisasi Relative Performance, Tren, dan Momentum Menggunakan MA20, MA50, dan Stochastic Oscillator

Proyek ini adalah dashboard finansial interaktif berbasis web statis (tanpa backend server) untuk menganalisis dan membandingkan performa 6 saham blue-chip Indonesia (`BBCA`, `BBRI`, `BMRI`, `TLKM`, `BREN`, `AMMN`) terhadap Indeks Harga Saham Gabungan (`IHSG`) sebagai acuan pasar.

---

## 1. Fitur Utama

- **OKX Inspired Dark Theme**: Desain profesional dengan tema gelap finansial minimalis, transisi halus, dan skema warna intuitif (Hijau untuk Bullish, Merah untuk Bearish).
- **KPI Dashboard Dinamais**:
  - Nilai IHSG saat ini dengan animasi *count up* angka.
  - Status pasar (*Bullish* jika IHSG di atas MA50, *Bearish* jika di bawah MA50).
  - *Top Outperformer* & *Top Underperformer* saham relatif terhadap IHSG dengan kalkulasi return otomatis.
- **Visualisasi Chart.js**:
  - **Chart 1 (Relative Performance)**: Grafik multiline perbandingan kinerja seluruh saham yang telah direbase ke nilai 100 untuk melihat saham mana yang mengungguli (*outperform*) atau tertinggal (*underperform*) dari IHSG.
  - **Chart 2 (Trend Analysis)**: Menampilkan Harga Penutupan, MA20, dan MA50 untuk mendeteksi tren bullish/bearish serta sinyal perpotongan (*Golden Cross* / *Death Cross*).
  - **Chart 3 (Momentum Analysis)**: Menampilkan Stochastic Oscillator (%K dan %D) dengan batas visual *Overbought* (80) dan *Oversold* (20) menggunakan garis referensi terputus-putus.
- **Ringkasan Analisis Otomatis**: Menghasilkan kesimpulan tertulis otomatis (insight dinamis) yang berubah sesuai saham yang dipilih dari dropdown filter.

---

## 2. Struktur Folder

```
indonesia-market-dashboard/
├── index.html            # File HTML utama untuk tata letak dashboard
├── style.css             # Tema warna OKX, layout Grid/Flexbox, dan responsivitas
├── app.js                # Logika Chart.js, KPI count-up, dan auto-insights
├── data/
│   ├── prices.json       # Data harga saham & indikator teknikal historis 252 hari
│   └── meta.json         # Metadata (pembaruan terakhir, return, status pasar, KPI)
├── scripts/
│   └── fetch_data.py     # Script Python untuk fetch data Yahoo Finance & hitung indikator
├── requirements.txt      # Dependensi Python
└── README.md             # Dokumentasi proyek
```

---

## 3. Cara Instalasi & Menjalankan Proyek

### Langkah 1: Persiapan Lingkungan Python
Pastikan Python 3 sudah terinstal pada sistem Anda. Masuk ke folder proyek dan instal dependensi Python:

```bash
pip install -r requirements.txt
```

### Langkah 2: Mengambil Data Pasar Terbaru
Jalankan script Python untuk mengunduh data real-time dari Yahoo Finance dan menghitung seluruh indikator teknikal (MA20, MA50, Stochastic):

```bash
python scripts/fetch_data.py
```
*Catatan: Script ini akan secara otomatis membuat folder `data/` serta memperbarui file `prices.json` dan `meta.json`.*

### Langkah 3: Menjalankan Server Lokal untuk Dashboard
Karena browser membatasi pembacaan file JSON lokal melalui protokol `file://` (kebijakan CORS), Anda harus menjalankan server lokal untuk membuka dashboard.

Jalankan server sederhana menggunakan modul bawaan Python:

```bash
python -m http.server 8000
```

Setelah server berjalan, buka browser dan akses URL:
```text
http://localhost:8000
```

---

## 4. Rumus dan Interpretasi Indikator Teknikal

### A. Rata-rata Bergerak (Moving Average)
- **MA20**: Rata-rata harga penutupan selama 20 hari perdagangan terakhir. Digunakan untuk mendeteksi tren jangka pendek.
- **MA50**: Rata-rata harga penutupan selama 50 hari perdagangan terakhir. Digunakan untuk mendeteksi tren jangka menengah.
  - **Golden Cross**: Terjadi saat harga penutupan atau MA jangka pendek memotong ke atas MA jangka panjang (indikator bullish).
  - **Death Cross**: Terjadi saat harga penutupan atau MA jangka pendek memotong ke bawah MA jangka panjang (indikator bearish).

### B. Stochastic Oscillator (14, 3, 3)
Formula untuk mengukur momentum harga:
- **Fast %K**:
  $$\%K_{\text{fast}} = 100 \times \frac{\text{Close} - L_{14}}{H_{14} - L_{14}}$$
  *Dimana $L_{14}$ adalah harga terendah dalam 14 hari terakhir dan $H_{14}$ adalah harga tertinggi dalam 14 hari terakhir.*
- **Slow %K** (%K yang ditampilkan pada chart):
  $$\%K = \text{Simple Moving Average } 3 \text{ Hari dari } \%K_{\text{fast}}$$
- **Slow %D** (%D yang ditampilkan pada chart):
  $$\%D = \text{Simple Moving Average } 3 \text{ Hari dari } \%K$$
  
**Interpretasi**:
- **%K dan %D > 80**: Kondisi *Overbought* (Jenuh Beli). Menandakan harga rentan koreksi.
- **%K dan %D < 20**: Kondisi *Oversold* (Jenuh Jual). Menandakan harga berpotensi memantul naik (*rebound*).

### C. Relative Performance (Rebase ke 100)
Seluruh harga penutupan saham disesuaikan menggunakan rumus:
$$\text{Rebased Price}_t = 100 \times \frac{\text{Close}_t}{\text{Close}_{\text{day 1}}}$$
Dengan rebase ini, semua grafik saham akan dimulai pada titik yang sama yaitu nilai 100 di hari ke-1, memungkinkan perbandingan langsung persentase kenaikan/penurunan harga antar saham dengan adil.

---

## 5. Responsivitas Layar
Desain antarmuka telah diuji agar responsif terhadap berbagai ukuran layar:
- **Desktop (>= 1200px)**: Grid KPI 4 kolom, Chart Utama penuh, Chart detail bersisian (2 kolom).
- **Tablet (768px - 1199px)**: Grid KPI 2 kolom, Chart detail ditumpuk secara vertikal (1 kolom).
- **Mobile (< 768px)**: Grid KPI 1 kolom, penyesuaian ukuran teks, select filter melebar penuh, dan padding lebih kecil.
