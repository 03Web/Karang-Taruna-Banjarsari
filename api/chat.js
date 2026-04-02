// File: api/chat.js

const fs = require("fs");
const path = require("path");

const KNOWLEDGE_PAYLOAD_PATH = path.join(
  process.cwd(),
  "js",
  "encrypted_output.txt",
);
const KNOWLEDGE_SECRET_KEY =
  process.env.CHATBOT_KNOWLEDGE_KEY || "KTA_Banjarsari2025_SecureKey";

let cachedKnowledgeBase = null;

function xorCipher(text, key) {
  let result = "";

  for (let i = 0; i < text.length; i += 1) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    );
  }

  return result;
}

function loadKnowledgeBase() {
  if (cachedKnowledgeBase) {
    return cachedKnowledgeBase;
  }

  const encryptedPayload = fs.readFileSync(KNOWLEDGE_PAYLOAD_PATH, "utf8").trim();

  if (!encryptedPayload) {
    throw new Error("Payload knowledge chatbot kosong.");
  }

  const encryptedText = Buffer.from(encryptedPayload, "base64").toString();
  cachedKnowledgeBase = xorCipher(encryptedText, KNOWLEDGE_SECRET_KEY);

  if (!cachedKnowledgeBase.includes("INFORMASI UMUM ORGANISASI")) {
    throw new Error("Knowledge chatbot gagal didekripsi.");
  }

  return cachedKnowledgeBase;
}

module.exports = async (req, res) => {
  // Mengatasi masalah CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 1. Ambil API Key dari tempat aman (Environment Variables)
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    return res
      .status(500)
      .json({ error: "Konfigurasi server chatbot bermasalah." });
  }

  try {
    // 2. Ambil data dari website
    const { userQuestion, history = [] } = req.body;
    const API_URL = "https://api.deepseek.com/v1/chat/completions";
    const knowledgeBase = loadKnowledgeBase();
    const safeHistory = Array.isArray(history) ? history : [];

    if (typeof userQuestion !== "string" || !userQuestion.trim()) {
      return res.status(400).json({ error: "Pertanyaan pengguna tidak valid." });
    }

    const normalizedQuestion = userQuestion.trim();

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
- "Untuk informasi lebih lanjut tentang pengurus, silakan kunjungi <a href='about.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Halaman Tentang Kami</a>."
- "Kamu bisa melihat dokumentasi kegiatan di <a href='galeri.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Galeri</a>."
- "Jika ingin mengirimkan aspirasi, silakan isi form di <a href='aspirasi.html' style="color: #007bff; font-weight: bold; text-decoration: underline;">Formulir Aspirasi</a>."

===============================
${knowledgeBase}
`;

    // 3. Susun payload untuk DeepSeek API dengan format percakapan
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...safeHistory.map((msg) => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: normalizedQuestion,
      },
    ];

    // 4. Hubungi DeepSeek API
    const deepseekResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.json();
      throw new Error(
        errorData.error?.message || "Gagal menghubungi DeepSeek API",
      );
    }

    const data = await deepseekResponse.json();
    const botAnswer = data.choices[0].message.content;

    // 5. Kirim jawaban kembali ke website
    res.status(200).json({ answer: botAnswer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};