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
    const { userQuestion, knowledgeBase } = req.body;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `${knowledgeBase}\n\nPERTANYAAN PENGGUNA:\n"${userQuestion}"`;

    // 3. Hubungi Gemini dari server (AMAN)
    const geminiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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
