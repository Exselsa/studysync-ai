# 🚀 StudySync-AI — All-in-One AI-Powered Adaptive Learning Ecosystem

Platform ekosistem belajar adaptif berbasis **Generative AI**, **Gamifikasi**, dan **Kolaborasi Real-Time** yang dikembangkan untuk kompetisi **BITSMIKRO Innovative Vibecode**.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Framework**: Next.js 15 (App Router, React 19)
* **Bahasa Pemrograman**: TypeScript
* **Styling & UI Systems**: Tailwind CSS v4, Lucide React, Framer Motion, GSAP
* **Design System**: Pitch Obsidian & Electric Cyan (`shadcn/ui` primitives & custom glassmorphic aesthetics)
* **Database & Auth**: Firebase (Firestore & Firebase Authentication)
* **AI Engine**: Google Gemini API (`@google/genai`)
* **Real-Time Communication**: WebRTC Voice Chat

---

## 💻 Prasyarat Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan sistem komputer Anda memenuhi persyaratan berikut:
* **Node.js**: Versi `18.x` atau yang lebih baru
* **Package Manager**: `npm` (bawaan Node.js)

---

## ⚡ Panduan Langkah Instalasi & Memulai Aplikasi

Ikuti urutan langkah berikut untuk mengeksekusi dan menjalankan aplikasi di lingkungan lokal:

### 1. Ekstrak File ZIP
Ekstrak berkas `studysync-ai.zip` ke dalam direktori/folder pilihan Anda.

### 2. Buka Terminal & Masuk ke Folder Proyek
Buka terminal (Command Prompt, PowerShell, atau Terminal) lalu navigasikan ke folder proyek:
```bash
cd studysync-ai
3. Instalasi Dependencies
Jalankan perintah berikut untuk mengunduh seluruh pustaka dan dependensi yang dibutuhkan:

Bash
npm install
4. Konfigurasi Environment Variables
Catatan: File .env.local yang berisi kredensial aktif Firebase dan Google Gemini API sudah disertakan di dalam paket proyek ini untuk kemudahan pengujian (Plug & Play). Anda tidak perlu menyusun API Key dari awal.

Jika ingin memeriksa atau mengubah konfigurasi, file .env.local memiliki struktur sebagai berikut:

Cuplikan kode
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
5. Jalankan Server Development
Eksekusi server lokal dengan perintah:

Bash
npm run dev
6. Buka Aplikasi di Browser
Buka browser pilihan Anda dan akses tautan berikut:

Plaintext
http://localhost:3000
🗺️ Peta Navigasi & Modul Utama Aplikasi
/ — Landing Page: Presentasi interaktif dengan animasi GSAP ScrollTrigger dan hero section.

/dashboard — Main Dashboard: Ringkasan analisis belajar (Streak, Jam Belajar, Cognitive Index).

/dashboard/plan — AI Study Plan Generator: Unggah materi (PDF/DOCX) dan pembuatan jadwal harian otomatis.

/dashboard/tutor — Contextual AI Tutor: Asisten AI interaktif 24/7 dengan streaming response.

/dashboard/meet — Collaborative Study Meet: Ruang belajar kelompok berbasis WebRTC voice.

/dashboard/boss-fight — Boss Fight & 1v1 Arena: Kuis gamifikasi interaktif dengan indikator HP real-time.

/dashboard/settings — Account Settings: Pengaturan akun, preferensi AI, dan manajemen profil.

📁 Struktur Folder Utama Proyek
Plaintext
studysync-ai/
├── src/
│   ├── app/                # App Router (Pages, Layouts, & API Routes)
│   │   ├── dashboard/      # Rute-rute modul utama platform
│   │   ├── page.tsx        # Landing Page utama
│   │   └── layout.tsx      # Root layout & providers
│   ├── components/         # Komponen UI Reusable (VoiceChat, Arena, Uploader, dll.)
│   └── lib/                # Konfigurasi Firebase, Gemini Client, & Utility Functions
├── public/                 # Aset statis (Gambar, Logo, Ikon)
├── .env.local              # File konfigurasi API Key aktif
├── README.md               # Dokumentasi instalasi aplikasi
└── package.json            # Daftar dependensi & script proyek

---

**Langkah Membuat File di Antigravity IDE / VS Code:**
1. Buka file `README.md` di panel kiri (*Explorer*). Jika belum ada, buat file baru di folder paling luar proyek dan beri nama `README.md`.
2. Tempelkan seluruh teks di atas.
3. Tekan `Ctrl + S` untuk menyimpan.