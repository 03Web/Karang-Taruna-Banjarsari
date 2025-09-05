// document.addEventListener("turbo:load", () => {
//   // --- KOMPONEN 1: PENGATURAN DASAR (Google Gemini API) ---
//   const GOOGLE_AI_API_KEY = "AIzaSyApjIgQTu2rYY0h-tcDviFLerXb61WIR8s"; // Ganti dengan Kunci API Anda
//   const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

//   // --- KOMPONEN 2: "PENGETAHUAN" WEBSITE (Diperbarui dari versi DeepSeek) ---
//   const KNOWLEDGE_BASE = `
//       ================================
//       INFORMASI UMUM ORGANISASI
//       ================================
//       - Nama Organisasi: Karang Taruna Banjarsari, Temanggung.
//       - Deskripsi: Organisasi kepemudaan yang menjadi wadah bagi para generasi muda untuk berkembang, berkreasi, dan berkontribusi secara positif bagi lingkungan dan masyarakat Desa Banjarsari.
//       - Visi: Menjadi organisasi pemuda yang mandiri, kreatif, inovatif, dan menjadi pilar utama dalam Pembudayaan Desa dan pembangunan kesejahteraan sosial di Desa Banjarsari.
//       - Misi:
//           - Mengembangkan potensi dan kreativitas pemuda di berbagai bidang.
//           - Menyelenggarakan kegiatan sosial, keagamaan, Kesenian dan olahraga.
//           - Membangun kemitraan strategis dengan berbagai pihak.
//           - Menjaga kelestarian lingkungan dan kearifan lokal.
//       - Alamat Sekretariat: Q5RQ+5R5, Unnamed Road, Banjarsari, Kec. Kandangan, Kabupaten Temanggung, Jawa Tengah 56281.
//       - Email: karangtaruna.banjarsari@email.com.
//       - Sosial Media:
//           - Instagram: @kartarbanjarr
//           - TikTok: Belum tersedia.
//           - YouTube: Belum tersedia.

//       ================================
//       STRUKTUR ORGANISASI LENGKAP
//       ================================
//       PENGURUS INTI:
//       - Penasehat: Sunirman, S.Ag
//       - Penanggung Jawab: Suryono, S.Pd
//       - Ketua: Andri Apriyanto
//       - Wakil: Yunita Sari
//       - Sekretaris: Dimas Suryo L.
//       - Bendahara: Yudi Arum S.

//       BIDANG-BIDANG & SELURUH ANGGOTANYA:
//       1.  **Bidang Sosial**:
//           - Koordinator: Isrofi
//           - Anggota: Mulyono, Mas Udi, Nana Mustakimah, Sifa Amadea P.
//       2.  **Bidang Perekonomian dan Kewirausahaan**:
//           - Koordinator: Dani Indri S.
//           - Anggota: Tri Arifin, Harniyati, Amalis Saliyati.
//       3.  **Bidang Olahraga dan Seni Budaya**:
//           - Koordinator: M. Ardan Maulana
//           - Anggota: Satria Nindy W., Iswanto heru, Wisnu, Puput.
//       4.  **Bidang Media**:
//           - Koordinator: Haidar Daffa
//           - Anggota: Azizah Melan, Indra Kurniawan.
//       5.  **Bidang Lingkungan Hidup Dan Kebersihan**:
//           - Koordinator: Yogi Ivan
//           - Anggota: Ibnu, Adit, Rezel, Jojo.
//       6.  **Bidang Agama Islam**:
//           - Koordinator: Iswanto
//           - Anggota: Aji, Aifa Nurul A.
//       7.  **Bidang Agama Kristen**:
//           - Koordinator: Margaretha
//           - Anggota: Amazia+(admin web), Agatha, Nessa.
//       8.  **Bidang Keamanan**:
//           - Koordinator: Budi Santoso
//           - Anggota: Rendi Sikun, Satria Juang W., Beni Nurhidayat, Sendi, Imas, Enggar.
//       9.  **Bidang Pendidikan**:
//           - Koordinator: Arlin fatoni
//           - Anggota: Doni ismail.
//       10. **Bidang Organisasi Dan Kaderisasi**:
//           - Koordinator: Ari Aflian
//           - Anggota: Titik, M. Nur Fauzi.

//       ================================
//       DATA PEMUDA PEMUDI BANJARSARI
//       ================================
//       - Total Keseluruhan: 154 orang.
//       - PEMUDA PEMUDI RT 01 (Jumlah: 35 orang): Sekar Asti Sani, Pranto, Islah, Amalis Saliyati, Beni, Arga Rian, M Imam Fauzi, Henik, Heru, Ipan, Afif C, Imas, Enggar, Awang, Vania, Wisnu, Shiva Amadea M, Ardan M, Titik Tiara, Vina Sinta, Wulan Agustina, M Aditya, Anam, Silvia, Rudi, Andri Ap, Mul, Diky Candra, Dika Irawan, Danar, Heri Widi Kurniawan, Willy Kurniawan, Rizky Yulia, Eka Kusuma, Naisya Happy.
//       - PEMUDA PEMUDI RT 02 (Jumlah: 25 orang): Didin, Naila Putri, Puji Purwanto, Aji Saka M, Wisnu Widi W, M Ibnu Hiban, Aifa Nuraini, Nana Mustaqimah, Danang Irawan, Indra Kurniawan, Doni Ismail, Revina Eka, Fardan Putra, Sugondo, Alwa Fiq A, Suyanto, M Naswa, Satria Nindya, Satria Juang, Iswanto, Supriyono, Lina Anggraeni, Dede Afi, V dM Nur a. Fauzi, Ahmad Ardi Cahyo.
//       - PEMUDA PEMUDI RT 03 (Jumlah: 36 orang): Rendy Gunawan, Sarmo Ipin, Angga, Harni, Takim, Isrofi, Anggi, Daniel, Fatihan, Arga, Daudi, Kevin, Ari Aflian, Amazia, Rezel, Irawan JR, Agus Munir, Agus Setiawan, Suntoko, Rifa, Ngateno, Musin, Zaki, Zahra, Nisa, Farha Kumala, Hanan, Zidan, Afiq, Alvi Nasroh, Fahim, Yusuf, Budi, Rifki, Parno, Maelandri Alfiyan.
//       - PEMUDA PEMUDI RT 04 (Jumlah: 28 orang): Roni, Sandi, Anang, Dimas, Diajeng Gendis, Fafa, Nila, Aldi, Ferlina Margha Retha, Eka Davi, Cindy Aurelia, Dava, Azizah Melan, Via, Nuril, Dani, Yudi, Miftahiyatul Jannah, Agatha, Yohan, Arlin Fatoni, Pendik, Yunita Sari, Arjuna, Nayla, Sugeng, Ipan, Hasan.
//       - PEMUDA PEMUDI RT 05 (Jumlah: 30 orang): Eva, Aji, Puput Setyasih, Endro, Alfizin, Iman Safi'i, Amin, Risa, Umatul, Laela, Pi'i, Udi, Ma'ruf, Afifah, Aziz, Angga, Sabil, Tri Hartanto, Apis, Adam, Yuris, Aven Ngesti Sawidi, Tanto, Iqin, Yuli, Fiki Nia, Johan Ngesti Avendi, Sendy, Santoso, Oliv.

//       ================================
//       DETAIL LENGKAP KEGIATAN & ARTIKEL
//       ================================

//       **1. GEBYAR MERDEKA 2025 (HUT RI ke-80)**
//       - **Nama Acara:** "GEBYAR MERDEKA 17 AGUSTUS 2025"
//       - **Deskripsi:** Perayaan akbar HUT RI ke-80 untuk memperkokoh persatuan, membangkitkan gotong royong, dan merayakan keberagaman.
//       - **Tanggal Pelaksanaan:** 13, 14, dan 15 Agustus 2025.
//       - **Lokasi:** Lapangan Bola Voli Banjarsari dan Aula Balai Desa Banjarsari.
//       - **Kategori Lomba Anak-Anak (SMP ke Bawah):**
//           - Adu Ketangkasan: Estafet Kelereng, Balap Karung, Ular Tangga Suit, Kuk Jeru, Tiup Gelas Plastik.
//           - Kerja Sama Tim: Futsal (tim 5 orang), Estafet Air.
//           - Klasik 17-an: Lomba Makan Kerupuk.
//       - **Kategori Lomba Dewasa:**
//           - Olahraga & Strategi: Bola Voli (PA/PI), Bulu Tangkis Blabak (Tunggal Putri, Ganda Putra, Ganda Campuran), Catur (PI), Tenis Meja (PI).
//           - Permainan Tradisional: Gobak Sodor (PA/PI), Gapyak.
//           - Hiburan & Kekompakan: Karaoke Duet (Lagu Bebas), Estafet Air, Makan Kerupuk.
//       - **Jadwal Rinci Harian:**
//           - **Rabu, 13 Agustus 2025 (14:00 - Selesai):** Lomba Makan Kerupuk, Estafet Air, Estafet Kelereng, Futsal Anak.
//           - **Rabu, 13 Agustus 2025 (19:00 - Selesai):** Catur (PI), Tenis Meja (PI).
//           - **Kamis, 14 Agustus 2025 (14:00 - Selesai):** Ular Tangga Suit, Mpok Jeru, Balap Karung, Tiup Gelas Plastik, Gapyak (PA/PI), Gobak Sodor (PA/PI).
//           - **Jumat, 15 Agustus 2025 (14:00 - Selesai):** Bola Voli (PA/PI), Balap Karung.
//           - **Jumat, 15 Agustus 2025 (19:00 - Selesai):** Bulu Tangkis Blabak (Tunggal Khusus Putri, Ganda Putra, Ganda Campuran).
//       - **Hadiah:** Juara 1, 2, dan 3 untuk lomba anak-anak, dan perebutan gelar JUARA UMUM ANTAR RT.

//       **2. Semarak Kemerdekaan 17 Agustus 2024 (HUT RI ke-79)**
//       - **Deskripsi:** Rangkaian acara untuk memeriahkan HUT RI ke-79 yang disambut antusias oleh warga.
//       - **Tanggal Pelaksanaan:** 17 Agustus 2024.
//       - **Jenis Lomba yang Diadakan:** Lomba makan kerupuk, balap karung, dan panjat pinang.
//       - **Tujuan:** Mempererat tali silaturahmi dan memupuk semangat gotong royong.

//       **3. Artikel Lainnya di Website:**
//       - **Bendera One Piece, Abad yang Hilang, dan Sensor Sejarah di Indonesia:** Sebuah artikel analogi tentang keresahan bendera anime yang dianggap simbol pemberontakan.
//       - **Lampu Merah Pengangguran Sarjana:** Membahas keresahan tentang disrupsi AI yang menggantikan pekerjaan level pemula (entry-level).

//       ================================
//       INFORMASI & PENGUMUMAN (BERDASARKAN CONTOH)
//       ================================
//       - **Jadwal Rapat Pleno Persiapan HUT RI ke-80:** Akan diadakan pada Sabtu, 19 Juli 2025, pukul 19:30 WIB di Balai Desa Banjarsari. Kehadiran seluruh koordinator seksi sangat diharapkan.
//       - **Pendaftaran Lomba Cerdas Cermat:** Telah dibuka hingga tanggal 25 Juli 2025.
//       - **Update Desain Kaos Resmi Karang Taruna 2025:** Ada sedikit penyesuaian pada desain akhir kaos, informasi pre-order akan diinfokan lebih lanjut.

//       ================================
//       GALERI FOTO & VIDEO
//       ================================
//       **Album Foto:**
//       - **Part of Karang Taruna Banjarsari 2020/2024:** Berisi 10+ foto. Termasuk kegiatan Halal Bihalal, Angkringan, olahraga di lapangan (sepak bola/bal-balan), dan wisata.
//       - **Part of Karang Taruna Banjarsari 2025:** Berisi 4+ foto. Termasuk rapat anggota dan kegiatan di balik layar (behind the scene) pembuatan film pendek untuk 17 agustusan 2025.
//       - **Kesenian:** Berisi 4+ foto. Termasuk dokumentasi pementasan tari tradisional dan kesenian topeng ireng.

//       **Dokumentasi Video (diurutkan dari terbaru):**
//       - Video Kegiatan Mei 2025 (Tanggal: 2025-08-05)
//       - Video Tari Topeng Ireng (Tanggal: 2024-08-03)
//       - Video Kegiatan Mei (Tanggal: 2024-08-02)
//       - Video Kegiatan April (Tanggal: 2010-08-01)

//       ================================
//       NARAHUBUNG & KONTAK RESMI
//       ================================
//       - **Andri Apri (Ketua Umum):**
//           - **Tugas:** Informasi umum, kerja sama, dan kemitraan.
//           - **WhatsApp:** 6285712414558
//       - **Yunita (Wakil Ketua):**
//           - **Tugas:** Informasi umum, kerja sama, dan seputar kegiatan.
//           - **WhatsApp:** 6288233496802
//       - **Amazia (Admin Website):**
//           - **Tugas:** Seputar website, penambahan konten, laporan bug/error, atau saran.
//           - **WhatsApp:** 6285876983793
// `;

//   // Ambil elemen-elemen dari HTML
//   const sendBtn = document.getElementById("send-chat-btn");
//   const chatInput = document.getElementById("chat-input");
//   const chatWindow = document.getElementById("chat-window");
//   const openBtn = document.getElementById("open-chatbot-btn");
//   const closeBtn = document.getElementById("close-chatbot");
//   const chatbotContainer = document.getElementById("chatbot-container");

//   if (!sendBtn) return; // Hentikan jika elemen chatbot tidak ada

//   // Fungsi buka/tutup chatbot
//   openBtn.addEventListener("click", () => {
//     chatbotContainer.style.display = "flex";
//     openBtn.style.display = "none";
//   });
//   closeBtn.addEventListener("click", () => {
//     chatbotContainer.style.display = "none";
//     openBtn.style.display = "block";
//   });

//   // --- KOMPONEN 3: "JEMBATAN" PENGHUBUNG KE AI ---
//   async function getAiResponse(userQuestion) {
//     const prompt = `
// Anda adalah KartaBot, AI partner yang analitis, proaktif, dan memiliki pemahaman mendalam untuk website Karang Taruna Banjarsari. Anda bukan sekadar asisten, melainkan seorang partner yang cerdas bagi pengunjung. Misi Anda adalah membantu pengguna menjelajahi, menghubungkan, dan memahami semua informasi terkait Karang Taruna secara menyeluruh.

// ================================
// PRINSIP KECERDASAN UTAMA (WAJIB DIIKUTI)
// ================================

// 1.  **PENALARAN & INFERENSI (Berpikir, Jangan Hanya Mencari):**
//     * Tugas utama Anda adalah menghubungkan informasi dari 'KNOWLEDGE_BASE' untuk menjawab pertanyaan yang jawabannya tidak eksplisit.
//     * **Contoh Skenario:** Jika pengguna bertanya, "Siapa yang harus saya hubungi untuk pendaftaran lomba voli?", Anda HARUS mampu menyimpulkan. Berdasarkan KNOWLEDGE_BASE, voli adalah bagian dari 'Bidang Olahraga & Seni Budaya' yang dikoordinatori oleh 'M. Ardan Maulana', dan untuk info kegiatan umum bisa menghubungi 'Yunita'. Maka, jawaban ideal Anda adalah, "Untuk pendaftaran lomba voli, Anda bisa mencoba menghubungi Koordinator Bidang Olahraga, yaitu M. Ardan Maulana. Atau untuk informasi umum seputar kegiatan, bisa juga menghubungi Wakil Ketua, Yunita (6288233496802)." Jangan hanya bilang "tidak ada info pendaftaran".

// 2.  **SINTESIS & GAMBARAN BESAR (Menyajikan Peta Informasi):**
//     * Saat ditanya pertanyaan umum (misal: "Apa saja kegiatan Karang Taruna?"), jangan hanya daftar acara. Anda HARUS **menyintesis kegiatannya berdasarkan tujuannya**.
//     * **Contoh Jawaban Ideal:** "Karang Taruna Banjarsari punya banyak kegiatan keren! Secara garis besar, program kami fokus pada:
//         - **Perayaan & Komunitas:** Seperti 'Gebyar Merdeka 2025' untuk merayakan HUT RI dan mempererat warga. 🇮🇩
//         - **Pengembangan Anggota:** Kami punya banyak bidang, mulai dari Olahraga, Sosial, hingga Kewirausahaan untuk mengembangkan bakat pemuda."

// 3.  **KONEKSI TEMATIK (Menjadi Pemandu Informasi):**
//     * Ini adalah kemampuan **paling penting** Anda. Selalu cari benang merah yang menghubungkan berbagai informasi.
//     * Setelah menjawab pertanyaan tentang satu topik, secara proaktif tawarkan koneksi ke info lain yang relevan.
//     * **Contoh Skenario:** Jika pengguna bertanya tentang 'Jadwal Gebyar Merdeka', setelah Anda menjawab, tambahkan: "Jadwalnya seru ya! Acara ini dipusatkan di Lapangan Voli dan Balai Desa. Apakah Anda ingin tahu alamat detail lokasinya?"

// 4.  **PROAKTIF & ANTISIPATIF (Memperdalam Interaksi):**
//     * Setelah menjawab, selalu antisipasi pertanyaan lanjutan.
//     * **Contoh:** Setelah menjelaskan struktur organisasi, tawarkan: "Itu adalah struktur inti kami. Apakah ada bidang atau pengurus spesifik yang ingin Anda ketahui lebih lanjut, mungkin nomor kontaknya?"

// 5.  **MENANGANI KETIDAKPASTIAN (Secara Cerdas dan Jujur):**
//     * Jika informasi benar-benar tidak ada dan tidak bisa disimpulkan, berikan jawaban yang jujur namun tetap bermanfaat.
//     * **Contoh Fallback Ideal:** "Maaf, saya sudah menganalisis semua data yang ada, namun detail spesifik tentang iuran kas sepertinya belum tercatat di database saya. 🙏 Namun, jika ini terkait pendanaan acara, Anda bisa mencoba bertanya langsung ke Bendahara kami, Yudi Arum S."

// ================================
// FORMAT & GAYA PENYAJIAN
// ================================

// * **Gaya Bahasa:** Analitis, suportif, dan tetap santai. Gunakan bahasa Indonesia yang baik dan terstruktur. Anggap pengguna adalah warga atau teman yang ingin tahu lebih banyak.
// * **Format Jawaban (PENTING):** Gunakan Markdown secara ekstensif. Gunakan **bold** untuk penekanan, dan bullet points (\`-\`) atau numbering (\`1.\`) untuk daftar atau rincian agar mudah dibaca.
// * **Panduan Penggunaan Emoji (Kontekstual & Relevan):**
//     * **Diskusi & Analisis:** 🧠, 🤔, 🧐
//     * **Menghubungkan Informasi:** ✨, 🔗, 👉
//     * **Poin Penting & Jadwal:** 📌, 🎯, 🗓️
//     * **Semangat & Komunitas:** 🔥, 🇮🇩, 🤝, 🙌
//     * **Sapaan & Bantuan:** 👋, 😊
//     * **Saat Tidak Menemukan Jawaban:** 😅, 🙏

// Tujuan akhir Anda adalah mengubah setiap interaksi dari sekadar sesi tanya-jawab menjadi sebuah pengalaman yang informatif dan efisien bagi setiap pengguna website.

//             KNOWLEDGE_BASE:
//             ${KNOWLEDGE_BASE}

//             PERTANYAAN PENGGUNA:
//             "${userQuestion}"
//         `;

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
//       });

//       if (!response.ok) {
//         return "Maaf, sepertinya ada sedikit gangguan. Coba lagi beberapa saat ya.";
//       }

//       const data = await response.json();
//       return data.candidates[0].content.parts[0].text;
//     } catch (error) {
//       console.error("Gagal menghubungi AI:", error);
//       return "Terjadi kesalahan koneksi. Pastikan internet Anda stabil.";
//     }
//   }

//   const handleSendMessage = async () => {
//     const question = chatInput.value.trim();
//     if (!question) return;

//     addMessageToWindow(question, "user-message");
//     chatInput.value = "";

//     addMessageToWindow("", "bot-message", true); // Indikator loading

//     const answer = await getAiResponse(question);

//     document.getElementById("loading-indicator")?.remove(); // Hapus indikator loading
//     addMessageToWindow(answer, "bot-message");
//   };

//   const addMessageToWindow = (message, className, isLoading = false) => {
//     const messageDiv = document.createElement("div");
//     messageDiv.className = isLoading ? "loading-container" : className;

//     if (isLoading) {
//       messageDiv.id = "loading-indicator";
//       messageDiv.innerHTML = `
//       <div class="bot-message" style="display: inline-block; padding: 8px 12px;">
//         <div class="typing-indicator">
//           <span></span>
//           <span></span>
//           <span></span>
//         </div>
//       </div>
//     `;
//     } else {
//       messageDiv.textContent = message;
//     }

//     chatWindow.appendChild(messageDiv);
//     chatWindow.scrollTop = chatWindow.scrollHeight;
//   };

//   sendBtn.addEventListener("click", handleSendMessage);
//   chatInput.addEventListener("keypress", (e) => {
//     if (e.key === "Enter") {
//       handleSendMessage();
//     }
//   });
// });

// //__________________________________________________________________________________________________________________________________________________________
// File: js/chatbot_sederhana.js (Versi dengan DeepSeek API)

// --- KOMPONEN 1: PENGATURAN DASAR (DIUBAH UNTUK DEEPSEEK) ---
document.addEventListener("DOMContentLoaded", () => {
  // --- PENGATURAN DASAR ---
  const DEEPSEEK_API_KEY = "sk-4918ff93e69548219197797500689dc6";
  const API_URL = "https://api.deepseek.com/v1/chat/completions";

  // --- Ambil elemen-elemen dari HTML ---
  const sendBtn = document.getElementById("send-chat-btn");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");
  const openBtn = document.getElementById("open-chatbot-btn");
  const closeBtn = document.getElementById("close-chatbot");
  const chatbotContainer = document.getElementById("chatbot-container");

  // Hentikan eksekusi jika elemen penting tidak ditemukan
  if (
    !sendBtn ||
    !chatInput ||
    !chatWindow ||
    !openBtn ||
    !closeBtn ||
    !chatbotContainer
  ) {
    console.error(
      "Salah satu elemen chatbot tidak ditemukan. Inisialisasi dibatalkan."
    );
    return;
  }

  // --- Fungsi untuk menampilkan dan menyembunyikan chatbot ---
  openBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "flex";
    openBtn.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "none";
    openBtn.style.display = "block";
  });

  // --- Fungsi untuk mendapatkan respon dari AI ---
  async function getAiResponse(userQuestion) {
    const system_prompt = `
Anda adalah KartaBot, AI partner yang analitis, proaktif, dan memiliki pemahaman mendalam untuk website Karang Taruna Banjarsari. Anda bukan sekadar asisten, melainkan seorang partner yang cerdas bagi pengunjung. Misi Anda adalah membantu pengguna menjelajahi, menghubungkan, dan memahami semua informasi terkait Karang Taruna secara menyeluruh.

================================
PRINSIP KECERDASAN UTAMA (WAJIB DIIKUTI)
================================

1.  **PENALARAN & INFERENSI (Berpikir, Jangan Hanya Mencari):**
    * Tugas utama Anda adalah menghubungkan informasi dari 'KNOWLEDGE_BASE' untuk menjawab pertanyaan yang jawabannya tidak eksplisit.
    * **Contoh Skenario:** Jika pengguna bertanya, "Siapa yang harus saya hubungi untuk pendaftaran lomba voli?", Anda HARUS mampu menyimpulkan. Berdasarkan KNOWLEDGE_BASE, voli adalah bagian dari 'Bidang Olahraga & Seni Budaya' yang dikoordinatori oleh 'M. Ardan Maulana', dan untuk info kegiatan umum bisa menghubungi 'Yunita'. Maka, jawaban ideal Anda adalah, "Untuk pendaftaran lomba voli, Anda bisa mencoba menghubungi Koordinator Bidang Olahraga, yaitu M. Ardan Maulana. Atau untuk informasi umum seputar kegiatan, bisa juga menghubungi Wakil Ketua, Yunita (6288233496802)." Jangan hanya bilang "tidak ada info pendaftaran".

2.  **SINTESIS & GAMBARAN BESAR (Menyajikan Peta Informasi):**
    * Saat ditanya pertanyaan umum (misal: "Apa saja kegiatan Karang Taruna?"), jangan hanya daftar acara. Anda HARUS **menyintesis kegiatannya berdasarkan tujuannya**.
    * **Contoh Jawaban Ideal:** "Karang Taruna Banjarsari punya banyak kegiatan keren! Secara garis besar, program kami fokus pada:
        - **Perayaan & Komunitas:** Seperti 'Gebyar Merdeka 2025' untuk merayakan HUT RI dan mempererat warga. 🇮🇩
        - **Pengembangan Anggota:** Kami punya banyak bidang, mulai dari Olahraga, Sosial, hingga Kewirausahaan untuk mengembangkan bakat pemuda."

3.  **KONEKSI TEMATIK (Menjadi Pemandu Informasi):**
    * Ini adalah kemampuan **paling penting** Anda. Selalu cari benang merah yang menghubungkan berbagai informasi.
    * Setelah menjawab pertanyaan tentang satu topik, secara proaktif tawarkan koneksi ke info lain yang relevan.
    * **Contoh Skenario:** Jika pengguna bertanya tentang 'Jadwal Gebyar Merdeka', setelah Anda menjawab, tambahkan: "Jadwalnya seru ya! Acara ini dipusatkan di Lapangan Voli dan Balai Desa. Apakah Anda ingin tahu alamat detail lokasinya?"

4.  **PROAKTIF & ANTISIPATIF (Memperdalam Interaksi):**
    * Setelah menjawab, selalu antisipasi pertanyaan lanjutan.
    * **Contoh:** Setelah menjelaskan struktur organisasi, tawarkan: "Itu adalah struktur inti kami. Apakah ada bidang atau pengurus spesifik yang ingin Anda ketahui lebih lanjut, mungkin nomor kontaknya?"

5.  **MENANGANI KETIDAKPASTIAN (Secara Cerdas dan Jujur):**
    * Jika informasi benar-benar tidak ada dan tidak bisa disimpulkan, berikan jawaban yang jujur namun tetap bermanfaat.
    * **Contoh Fallback Ideal:** "Maaf, saya sudah menganalisis semua data yang ada, namun detail spesifik tentang iuran kas sepertinya belum tercatat di database saya. 🙏 Namun, jika ini terkait pendanaan acara, Anda bisa mencoba bertanya langsung ke Bendahara kami, Yudi Arum S."

================================
FORMAT & GAYA PENYAJIAN
================================

* **Gaya Bahasa:** Analitis, suportif, dan tetap santai. Gunakan bahasa Indonesia yang baik dan terstruktur. Anggap pengguna adalah warga atau teman yang ingin tahu lebih banyak.
* **Format Jawaban (PENTING):** Gunakan Markdown secara ekstensif. Gunakan **bold** untuk penekanan, dan bullet points (\`-\`) atau numbering (\`1.\`) untuk daftar atau rincian agar mudah dibaca.
* **Panduan Penggunaan Emoji (Kontekstual & Relevan):**
    * **Diskusi & Analisis:** 🧠, 🤔, 🧐
    * **Menghubungkan Informasi:** ✨, 🔗, 👉
    * **Poin Penting & Jadwal:** 📌, 🎯, 🗓️
    * **Semangat & Komunitas:** 🔥, 🇮🇩, 🤝, 🙌
    * **Sapaan & Bantuan:** 👋, 😊
    * **Saat Tidak Menemukan Jawaban:** 😅, 🙏

Tujuan akhir Anda adalah mengubah setiap interaksi dari sekadar sesi tanya-jawab menjadi sebuah pengalaman yang informatif dan efisien bagi setiap pengguna website.
`;

    const user_prompt = `
            KNOWLEDGE_BASE:
            ${KNOWLEDGE_BASE}

            PERTANYAAN PENGGUNA:
            "${userQuestion}"
        `;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        return `Maaf, terjadi kesalahan dari API: ${errorData.error.message}`;
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Gagal menghubungi AI:", error);
      return "Terjadi kesalahan koneksi. Pastikan internet Anda stabil.";
    }
  }

  // --- Fungsi untuk menangani pengiriman pesan ---
  const handleSendMessage = async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    addMessageToWindow(question, "user-message");
    chatInput.value = "";
    addMessageToWindow("", "bot-message", true); // Menampilkan indikator loading

    const answer = await getAiResponse(question);

    document.getElementById("loading-indicator")?.remove(); // Hapus indikator loading
    addMessageToWindow(answer, "bot-message");
  };

  // --- Fungsi untuk menambahkan pesan ke jendela chat ---
  const addMessageToWindow = (message, className, isLoading = false) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = className;

    if (isLoading) {
      messageDiv.id = "loading-indicator";
      messageDiv.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    } else {
      messageDiv.textContent = message;
    }

    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  // --- Tambahkan event listeners ke tombol dan input ---
  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });
});
