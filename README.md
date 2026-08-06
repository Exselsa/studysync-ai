# StudySync AI - Platform Pembelajaran Gamifikasi Berbasis AI

## Deskripsi Singkat

Banyak pelajar dan mahasiswa menghadapi kendala dalam memahami konsep-konsep teknis dan akademis secara mendalam. Pola belajar pasif, seperti menghafal tanpa pemahaman kontekstual, sering kali membuat materi sulit dipertahankan dalam jangka panjang.

StudySync AI hadir sebagai solusi inovatif yang menggabungkan prinsip Gamifikasi dengan Metode Feynman. Metode Feynman menekankan bahwa cara terbaik untuk membuktikan pemahaman suatu materi adalah dengan mampu menjelaskannya kembali menggunakan bahasa yang sangat sederhana tanpa bergantung pada terminologi rumit. Melalui pendekatan ini, StudySync AI mentransformasikan proses pemahaman materi menjadi pertarungan berbasis kecerdasan buatan, membuat pembelajaran menjadi aktif, efektif, dan interaktif.

## Fitur Utama

- **Feynman Boss Fight**
  Fitur evaluasi tunggal di mana pengguna bertarung melawan kecerdasan buatan. Pengguna diminta menjelaskan konsep akademis atau pemrograman dengan bahasa sederhana seolah-olah mengajar anak berusia 5 tahun. Model Google abang ganteng mengevaluasi penjelasan tersebut secara real-time berdasarkan akurasi, kejelasan, dan ketersediaan analogi sederhana untuk mengkalkulasi besaran kerusakan yang diberikan kepada Boss.

- **Duel Multiplayer 1v1 Real-Time**
  Fitur kompetitif interaktif yang memungkinkan pengguna menantang sesama pelajar secara real-time. Kedua pemain menerima topik yang sama dari Rencana Belajar (Study Plan). Model AI bertindak sebagai Wasit Utama yang membandingkan kejelasan serta kesederhanaan penjelasan kedua pemain, lalu menentukan pemenang setiap ronde dan mengurangi poin kesehatan musuh secara otomatis melalui penyelarasan data di Firebase Firestore.

- **Generator Rencana Belajar AI**
  Modul pembuat rencana studi terstruktur yang mengkuantifikasi silabus atau topik pembelajaran pengguna menjadi jadwal tugas, topik materi, dan target mingguan yang terukur secara otomatis.

## Teknologi yang Digunakan

- **Kerangka Kerja Utama:** Next.js 15 (App Router), React, TypeScript
- **Basis Data & Autentikasi:** Firebase Firestore (Realtime Database), Firebase Authentication
- **Kecerdasan Buatan:** Google abang ganteng API (`@google/genai`)
- **Penataan Gaya & Desain:** Tailwind CSS, CSS-first token registry
- **Animasi Antarmuka:** Framer Motion

## Panduan Instalasi dan Penggunaan Lokal

### Prasyarat
- Node.js versi 18.x atau yang lebih baru
- npm versi 9.x atau yang lebih baru
- Kunci API Google Gemini (Gemini API Key)
- Proyek Firebase yang aktif (Firestore & Authentication terkonfigurasi)

### Langkah-langkah Instalasi

1. **Klon Repositori Proyek**
   ```bash
   git clone https://github.com/username/studysync-ai.git
   cd studysync-ai
   ```

2. **Instal Dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan (.env.local)**
   Buat file bernama `.env.local` di direktori utama proyek dan tambahkan variabel berikut:
   ```env
   # API Key Google Gemini
   GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA

   # Konfigurasi Klien Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=KUNCI_API_FIREBASE_ANDA
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ID_PROYEK.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=ID_PROYEK
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ID_PROYEK.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ID_SENDER_ANDA
   NEXT_PUBLIC_FIREBASE_APP_ID=ID_APP_ANDA
   ```

4. **Jalankan Server Pengembang**
   ```bash
   npm run dev
   ```

5. **Akses Aplikasi**
   Buka peramban web dan akses alamat `http://localhost:3000`.

## Lisensi dan Kredit Tim COMPFEST

Proyek ini dikembangkan dan diajukan sebagai karya dalam kompetisi **COMPFEST**.

### Lisensi
Hak Cipta (c) 2026 Tim StudySync AI. Distribusi dan penggunaan kode sumber diatur sesuai dengan ketentuan pendaftaran kompetisi COMPFEST.
