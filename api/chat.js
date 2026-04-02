// File: api/chat.js

module.exports = async (req, res) => {
  // Mengatasi masalah CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 1. Ambil API Key dari tempat aman (Environment Variables)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Konfigurasi server chatbot bermasalah." });
  }

  try {
    // 2. Ambil data dari website
    const { userQuestion, knowledgeBase, history = [] } = req.body;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // System Prompt dengan instruksi ketat
    const systemPrompt = `
Kamu adalah Asisten AI resmi Karang Taruna Banjarsari. Tugas kamu adalah menjawab pertanyaan pengguna dengan ramah, informatif, dan membantu.

ATURAN WAJIB:
1. Jika pertanyaan pengguna berkaitan dengan topik yang ada di "PETA SITUS (URL MAPPING)", kamu WAJIB menyertakan link (URL) yang bisa diklik menggunakan tag HTML <a href="...">...</a> di jawabanmu.
2. SETIAP link HARUS menyertakan atribut style inline ini: style="color: #007bff; font-weight: bold; text-decoration: underline;" agar link ter-highlight dengan baik.
3. Jawaban harus relevan dengan knowledge base yang diberikan.
4. Untuk jawaban yang panjang atau memiliki banyak poin, gunakan bullet points (-) atau paragraf terstruktur agar rapi dan mudah dibaca.
5. Gunakan formatting HTML yang rapi (<p>, <ul>, <li>) jika diperlukan.

CONTOH OUTPUT YANG BENAR:
- "Untuk informasi lebih lanjut tentang pengurus, silakan kunjungi <a href='/about.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Halaman Tentang Kami</a>."
- "Kamu bisa melihat dokumentasi kegiatan di <a href='/galeri.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Galeri</a>."
- "Jika ingin mengirimkan aspirasi, silakan isi form di <a href='/aspirasi.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Formulir Aspirasi</a>."

===============================
${knowledgeBase}
`;

    // 3. Susun payload untuk Gemini API dengan format percakapan
    const contents = [
      // Pesan pertama: System instructions + knowledge base
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      // Balasan dummy dari model untuk mengonfirmasi pemahaman
      {
        role: "model",
        parts: [{ text: "Mengerti. Saya akan menjawab dengan menyertakan link bergaya inline dan format yang rapi." }]
      },
      // History percakapan sebelumnya (jika ada)
      ...history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      // Pertanyaan pengguna saat ini
      {
        role: "user",
        parts: [{ text: userQuestion }]
      }
    ];

    // 4. Hubungi Gemini dari server (AMAN)
    const geminiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(errorData.error.message);
    }

    const data = await geminiResponse.json();
    const botAnswer = data.candidates[0].content.parts[0].text;

    // 4. Kirim jawaban kembali ke website
    res.status(200).json({ answer: botAnswer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
