const https = require("https");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    return sendError(res, "Kunci API chatbot belum dikonfigurasi. Hubungi admin.");
  }

  const { userQuestion, history: convHistory = [], stream = false } = req.body || {};

  if (!userQuestion || typeof userQuestion !== "string" || !userQuestion.trim()) {
    return res.status(400).json({ error: "Pertanyaan tidak boleh kosong." });
  }

  // Build system prompt with knowledge base
  const systemPrompt = buildSystemPrompt();

  // Build messages for DeepSeek
  const messages = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history (limit to last 10 exchanges)
  const recentHistory = convHistory.slice(-10);
  for (const msg of recentHistory) {
    if (msg && msg.role && msg.content) {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content),
      });
    }
  }

  // Add current question
  messages.push({ role: "user", content: userQuestion.trim() });

  if (stream) {
    return handleStreaming(res, messages, DEEPSEEK_API_KEY);
  }

  // Non-streaming fallback
  return handleNonStreaming(res, messages, DEEPSEEK_API_KEY);
};

function handleStreaming(res, messages, apiKey) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const payload = JSON.stringify({
    model: "deepseek-chat",
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const options = {
    hostname: "api.deepseek.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const reqDeep = https.request(options, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      let errBody = "";
      apiRes.on("data", (d) => (errBody += d));
      apiRes.on("end", () => {
        sendSSE(res, "error", { error: parseAPIError(errBody) });
        res.end();
      });
      return;
    }

    let fullContent = "";

    sendSSE(res, "status", { message: "AI sedang menjawab...", state: "streaming" });

    apiRes.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        if (line === "data: [DONE]") {
          sendSSE(res, "done", { answer: fullContent });
          continue;
        }

        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              sendSSE(res, "chunk", { content: delta.content });
            }
          } catch (e) {
            // Skip malformed SSE lines
          }
        }
      }
    });

    apiRes.on("end", () => {
      if (!fullContent) {
        sendSSE(res, "error", { error: "AI tidak mengembalikan jawaban." });
      }
      res.end();
    });

    apiRes.on("error", () => {
      sendSSE(res, "error", { error: "Koneksi ke AI terputus." });
      res.end();
    });
  });

  reqDeep.on("error", (err) => {
    sendSSE(res, "error", { error: "Gagal menghubungi server AI: " + err.message });
    res.end();
  });

  reqDeep.write(payload);
  reqDeep.end();
}

function handleNonStreaming(res, messages, apiKey) {
  const payload = JSON.stringify({
    model: "deepseek-chat",
    messages,
    stream: false,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const options = {
    hostname: "api.deepseek.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const reqDeep = https.request(options, (apiRes) => {
    let body = "";
    apiRes.on("data", (d) => (body += d));
    apiRes.on("end", () => {
      if (apiRes.statusCode !== 200) {
        return res.status(apiRes.statusCode || 500).json({ error: parseAPIError(body) });
      }
      try {
        const parsed = JSON.parse(body);
        const answer = parsed.choices?.[0]?.message?.content || "";
        res.status(200).json({ answer });
      } catch (e) {
        res.status(500).json({ error: "Respons AI tidak valid." });
      }
    });
  });

  reqDeep.on("error", (err) => {
    res.status(500).json({ error: "Gagal menghubungi server AI: " + err.message });
  });

  reqDeep.write(payload);
  reqDeep.end();
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendError(res, message) {
  res.status(500).json({ error: message });
}

function parseAPIError(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed.error?.message || parsed.message || "DeepSeek API mengembalikan error.";
  } catch (e) {
    return raw.substring(0, 200) || "DeepSeek API error.";
  }
}

function buildSystemPrompt() {
  return `Anda adalah AI Assistant resmi untuk website Karang Taruna Banjarsari, Temanggung, Jawa Tengah.

TUGAS ANDA:
- Jawab pertanyaan pengguna tentang Karang Taruna Banjarsari dengan akurat, singkat, dan ramah.
- Arahkan pengguna ke halaman website yang relevan (tentang, kegiatan, galeri, aspirasi, kontak, toko, artikel).
- Gunakan bahasa Indonesia yang sopan dan mudah dipahami.
- Jika tidak tahu jawaban, katakan dengan jujur dan sarankan pengguna menghubungi pengurus melalui halaman kontak.

INFORMASI WEBSITE:
Website ini berisi informasi tentang Karang Taruna Banjarsari termasuk:
- **Profil & Pengurus**: Struktur organisasi, visi misi, pengurus inti
- **Kegiatan**: Program kerja, agenda, event, dokumentasi kegiatan
- **Galeri**: Foto dan video dokumentasi
- **Aspirasi**: Form untuk mengirim saran, masukan, atau ide
- **Kontak**: Alamat sekretariat, email, WhatsApp, peta lokasi
- **Toko**: Produk dan merchandise Karang Taruna
- **Artikel**: Berita dan informasi terbaru

ATURAN:
- Jangan membuat informasi fiktif tentang Karang Taruna.
- Jika pertanyaan tentang detail spesifik (nama pengurus, tanggal kegiatan, dll) yang tidak Anda ketahui, arahkan ke halaman terkait di website.
- Tetap fokus pada topik Karang Taruna Banjarsari.
- Jawab dalam bahasa Indonesia.
- Gunakan format HTML sederhana untuk jawaban (p, ul, li, br, strong) jika diperlukan.`;
}
