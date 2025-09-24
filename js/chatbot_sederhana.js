// File: js/chatbot_sederhana.js (Versi AMAN dan SIMPEL)

document.addEventListener("DOMContentLoaded", () => {
  // Tidak ada lagi API Key di sini!
  const API_URL = "/api/chat"; // Ini adalah alamat "penengah" yang kita buat tadi

  // --- Ambil elemen-elemen dari HTML ---
  const sendBtn = document.getElementById("send-chat-btn");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");
  const openBtn = document.getElementById("open-chatbot-btn");
  const closeBtn = document.getElementById("close-chatbot");
  const chatbotContainer = document.getElementById("chatbot-container");

  if (!sendBtn) return;

  // --- Fungsi buka/tutup ---
  openBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "flex";
    openBtn.style.display = "none";
  });
  closeBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "none";
    openBtn.style.display = "block";
  });

  // --- Fungsi yang sudah diubah ---
  async function getAiResponse(userQuestion) {
    if (typeof KNOWLEDGE_BASE === "undefined") {
      return "Error: Basis pengetahuan tidak dapat dimuat.";
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: userQuestion,
          knowledgeBase: KNOWLEDGE_BASE,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return `Maaf, terjadi kesalahan: ${
          data.error || "Gagal menghubungi server."
        }`;
      }
      return data.answer;
    } catch (error) {
      return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    }
  }

  // --- Sisa fungsi di bawah ini tidak perlu diubah ---
  const handleSendMessage = async () => {
    const question = chatInput.value.trim();
    if (!question) return;
    addMessageToWindow(question, "user-message");
    chatInput.value = "";
    addMessageToWindow("", "bot-message", true);
    const answer = await getAiResponse(question);
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    addMessageToWindow(answer, "bot-message");
  };

  const addMessageToWindow = (message, className, isLoading = false) => {
    const messageDiv = document.createElement("div");
    if (isLoading) {
      messageDiv.id = "loading-indicator";
      messageDiv.className = "bot-message";
      messageDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    } else {
      messageDiv.className = className;
      messageDiv.textContent = message;
    }
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });
});

// //__________________________________________________________________________________________________________________________________________________________
// File: js/chatbot_sederhana.js (Versi dengan DeepSeek API)

// File: js/chatbot_sederhana.js (Versi dengan DeepSeek API)

// --- KOMPONEN 1: PENGATURAN DASAR (DIUBAH UNTUK DEEPSEEK) ---
// document.addEventListener("DOMContentLoaded", () => {
//   // --- PENGATURAN DASAR ---
//   const DEEPSEEK_API_KEY = "sk-4918ff93e69548219197797500689dc6";
//   const API_URL = "https://api.deepseek.com/v1/chat/completions";

//   // --- Ambil elemen-elemen dari HTML ---
//   const sendBtn = document.getElementById("send-chat-btn");
//   const chatInput = document.getElementById("chat-input");
//   const chatWindow = document.getElementById("chat-window");
//   const openBtn = document.getElementById("open-chatbot-btn");
//   const closeBtn = document.getElementById("close-chatbot");
//   const chatbotContainer = document.getElementById("chatbot-container");

//   // Hentikan eksekusi jika elemen penting tidak ditemukan
//   if (
//     !sendBtn ||
//     !chatInput ||
//     !chatWindow ||
//     !openBtn ||
//     !closeBtn ||
//     !chatbotContainer
//   ) {
//     console.error(
//       "Salah satu elemen chatbot tidak ditemukan. Inisialisasi dibatalkan."
//     );
//     return;
//   }

//   // --- Fungsi untuk menampilkan dan menyembunyikan chatbot ---
//   openBtn.addEventListener("click", () => {
//     chatbotContainer.style.display = "flex";
//     openBtn.style.display = "none";
//   });

//   closeBtn.addEventListener("click", () => {
//     chatbotContainer.style.display = "none";
//     openBtn.style.display = "block";
//   });

//   // --- Fungsi untuk mendapatkan respon dari AI ---
//   async function getAiResponse(userQuestion) {
//     const system_prompt = `
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
// `;

//     const user_prompt = `
//             KNOWLEDGE_BASE:
//             ${KNOWLEDGE_BASE}

//             PERTANYAAN PENGGUNA:
//             "${userQuestion}"
//         `;

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
//         },
//         body: JSON.stringify({
//           model: "deepseek-chat",
//           messages: [
//             { role: "system", content: system_prompt },
//             { role: "user", content: user_prompt },
//           ],
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("API Error:", errorData);
//         return `Maaf, terjadi kesalahan dari API: ${errorData.error.message}`;
//       }

//       const data = await response.json();
//       return data.choices[0].message.content;
//     } catch (error) {
//       console.error("Gagal menghubungi AI:", error);
//       return "Terjadi kesalahan koneksi. Pastikan internet Anda stabil.";
//     }
//   }

//   // --- Fungsi untuk menangani pengiriman pesan ---
//   const handleSendMessage = async () => {
//     const question = chatInput.value.trim();
//     if (!question) return;

//     addMessageToWindow(question, "user-message");
//     chatInput.value = "";
//     addMessageToWindow("", "bot-message", true); // Menampilkan indikator loading

//     const answer = await getAiResponse(question);

//     document.getElementById("loading-indicator")?.remove(); // Hapus indikator loading
//     addMessageToWindow(answer, "bot-message");
//   };

//   // --- Fungsi untuk menambahkan pesan ke jendela chat ---
//   const addMessageToWindow = (message, className, isLoading = false) => {
//     const messageDiv = document.createElement("div");
//     messageDiv.className = className;

//     if (isLoading) {
//       messageDiv.id = "loading-indicator";
//       messageDiv.innerHTML = `
//         <div class="typing-indicator">
//           <span></span>
//           <span></span>
//           <span></span>
//         </div>
//       `;
//     } else {
//       messageDiv.textContent = message;
//     }

//     chatWindow.appendChild(messageDiv);
//     chatWindow.scrollTop = chatWindow.scrollHeight;
//   };

//   // --- Tambahkan event listeners ke tombol dan input ---
//   sendBtn.addEventListener("click", handleSendMessage);
//   chatInput.addEventListener("keypress", (e) => {
//     if (e.key === "Enter") {
//       handleSendMessage();
//     }
//   });
// });
