const https = require("https");
const fs = require("fs");
const path = require("path");

// ============================================================
// LOAD & CACHE ALL JSON DATA ON SERVER STARTUP
// ============================================================
function loadJsonFile(relativePath) {
  try {
    const fullPath = path.join(__dirname, "..", relativePath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[chat.js] Warning: could not load ${relativePath}:`, err.message);
    return null;
  }
}

function loadTextFile(relativePath) {
  try {
    const fullPath = path.join(__dirname, "..", relativePath);
    return fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    console.warn(`[chat.js] Warning: could not load ${relativePath}:`, err.message);
    return null;
  }
}

const CACHED_DATA = {
  pengurus: loadJsonFile("data/pengurus.json"),
  produk: loadJsonFile("data/produk.json"),
  kegiatan: loadJsonFile("data/kegiatan.json"),
  galeri: loadJsonFile("data/galeri.json"),
  testimonials: loadJsonFile("data/testimonials.json"),
  kontak: loadTextFile("data/kontak.md"),
};

// ============================================================
// BUILD SUMMARY TEXTS FROM CACHED DATA
// ============================================================
function buildPengurusSummary() {
  const data = CACHED_DATA.pengurus;
  if (!data) return "Data pengurus tidak tersedia.";

  let lines = [];

  if (data.pengurusInti && Array.isArray(data.pengurusInti)) {
    lines.push("PENGURUS INTI:");
    data.pengurusInti.forEach((p) => {
      lines.push(`- ${p.jabatan}: ${p.nama}`);
    });
  }

  if (data.bidang && Array.isArray(data.bidang)) {
    lines.push("");
    lines.push("BIDANG-BIDANG:");
    data.bidang.forEach((b) => {
      const koordinator = b.anggota?.find((a) => a.jabatan === "Koordinator");
      const memberCount = b.anggota?.length || 0;
      lines.push(`- ${b.namaBidang} (Koordinator: ${koordinator?.nama || "Belum ada"}), ${memberCount} anggota`);
    });
  }

  return lines.join("\n");
}

function buildProdukSummary() {
  const data = CACHED_DATA.produk;
  if (!data || !Array.isArray(data)) return "Data produk tidak tersedia.";

  return data.map((p) => {
    const hargaFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p.harga);
    return `- ${p.nama} | ${hargaFormatted} | Kategori: ${p.kategori || "-"} | Lokasi: ${p.lokasi || "-"} | Rating: ${p.rating || "-"} | Terjual: ${p.terjual || "-"}`;
  }).join("\n");
}

function buildKegiatanSummary() {
  const data = CACHED_DATA.kegiatan;
  if (!data || !Array.isArray(data)) return "Data kegiatan tidak tersedia.";

  return data.slice(0, 15).map((k) => {
    return `- [${k.tanggal}] ${k.judul} (${k.kategori || "Umum"})`;
  }).join("\n");
}

function buildGaleriSummary() {
  const data = CACHED_DATA.galeri;
  if (!data) return "Data galeri tidak tersedia.";

  let lines = [];

  if (data.albumFoto && Array.isArray(data.albumFoto)) {
    lines.push("ALBUM FOTO:");
    data.albumFoto.forEach((album) => {
      const photoCount = album.foto?.length || 0;
      lines.push(`- ${album.judul} (${photoCount} foto)`);
    });
  }

  if (data.dokumentasiVideo && Array.isArray(data.dokumentasiVideo)) {
    lines.push("");
    lines.push("VIDEO DOKUMENTASI:");
    data.dokumentasiVideo.forEach((v) => {
      lines.push(`- [${v.tanggal}] ${v.title}`);
    });
  }

  return lines.join("\n");
}

function buildKontakSummary() {
  const data = CACHED_DATA.kontak;
  if (!data) return "Data kontak tidak tersedia.";
  return data;
}

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

  // Add conversation history (limit to last 15 messages)
  const recentHistory = convHistory.slice(-15);
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
  const pengurusSummary = buildPengurusSummary();
  const produkSummary = buildProdukSummary();
  const kegiatanSummary = buildKegiatanSummary();
  const galeriSummary = buildGaleriSummary();
  const kontakSummary = buildKontakSummary();

  return `Anda adalah AI Assistant resmi untuk website Karang Taruna Banjarsari, Temanggung, Jawa Tengah.

TUGAS ANDA:
- Jawab pertanyaan pengguna tentang Karang Taruna Banjarsari dengan akurat, singkat, dan ramah.
- Arahkan pengguna ke halaman website yang relevan (tentang, kegiatan, galeri, aspirasi, kontak, toko, artikel).
- Gunakan bahasa Indonesia yang sopan dan mudah dipahami.
- Jika tidak tahu jawaban, katakan dengan jujur dan sarankan pengguna menghubungi pengurus melalui halaman kontak.

=== DATA PENGURUS KARANG TARUNA BANJARSARI ===
${pengurusSummary}

=== PRODUK & TOKO ===
${produkSummary}

=== KEGIATAN & AGENDA ===
${kegiatanSummary}

=== GALERI & DOKUMENTASI ===
${galeriSummary}

=== KONTAK & LOKASI ===
${kontakSummary}

ATURAN:
- Gunakan DATA DI ATAS untuk menjawab pertanyaan spesifik (nama pengurus, harga produk, tanggal kegiatan, dll).
- Jangan membuat informasi fiktif. Jika data tidak ada di atas, arahkan ke halaman website terkait.
- Tetap fokus pada topik Karang Taruna Banjarsari.
- Jawab dalam bahasa Indonesia.
- Gunakan format HTML sederhana (p, ul, li, br, strong) jika diperlukan.`;
}
