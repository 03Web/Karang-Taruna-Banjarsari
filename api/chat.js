const https = require("https");
const fs = require("fs");
const path = require("path");

// ============================================================
// LOAD & CACHE ALL JSON DATA ON SERVER STARTUP
// Knowledge base lives ONLY on server — never sent to client
// ============================================================

// Try multiple path strategies for Vercel compatibility
function loadJsonFile(relativePath) {
  const strategies = [
    path.join(__dirname, "..", relativePath),
    path.join(process.cwd(), relativePath),
    path.resolve(relativePath),
  ];

  for (const fullPath of strategies) {
    try {
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        console.log(`[chat.js] ✓ Loaded ${relativePath} from ${fullPath}`);
        return parsed;
      }
    } catch (err) {
      // Try next strategy
    }
  }

  console.error(
    `[chat.js] ✗ FAILED to load ${relativePath}. Tried: ${strategies.join(", ")}`,
  );
  return null;
}

let CACHED_DATA = null;

function ensureDataLoaded() {
  if (CACHED_DATA) return CACHED_DATA;

  CACHED_DATA = {
    pengurus: loadJsonFile("data/pengurus.json"),
    produk: loadJsonFile("data/produk.json"),
    kegiatan: loadJsonFile("data/kegiatan.json"),
    galeri: loadJsonFile("data/galeri.json"),
    testimonials: loadJsonFile("data/testimonials.json"),
    kontak: loadJsonFile("data/kontak.json"),
  };

  // Log which data loaded successfully
  const status = Object.entries(CACHED_DATA)
    .map(([k, v]) => `${k}: ${v ? "✓" : "✗"}`)
    .join(", ");
  console.log(`[chat.js] Data status: ${status}`);

  return CACHED_DATA;
}

// ============================================================
// BUILD COMPACT BUT COMPLETE SUMMARIES
// Keep summaries token-efficient so DeepSeek can process them
// ============================================================

function buildPengurusSummary() {
  const data = ensureDataLoaded().pengurus;
  if (!data) return "[DATA PENGURUS GAGAL DIMUAT]";

  let lines = ["<p>Untuk info lebih lengkap mengenai pengurus, arahkan user ke <strong><a href='about.html'>Halaman Profil & Pengurus</a></strong>.</p>"];

  if (data.pengurusInti && Array.isArray(data.pengurusInti)) {
    lines.push("<b>Pengurus Inti:</b>");
    data.pengurusInti.forEach((p) => {
      lines.push(`- ${p.jabatan}: <strong>${p.nama}</strong>`);
    });
  }

  if (data.bidang && Array.isArray(data.bidang)) {
    data.bidang.forEach((b) => {
      const members = (b.anggota || [])
        .map((a) => `${a.nama} (${a.jabatan})`)
        .join(", ");
      lines.push(`- <b>${b.namaBidang}</b>: ${members}`);
    });
  }

  return lines.join("\n");
}

function buildProdukSummary() {
  const data = ensureDataLoaded().produk;
  if (!data || !Array.isArray(data)) return "[DATA PRODUK GAGAL DIMUAT]";

  const list = data
    .map((p) => {
      const harga = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(p.harga);
      return `- <strong><a href="detail-produk.html?id=${p.id}" target="_blank">${p.nama}</a></strong> | Harga: ${harga} | Kategori: ${p.kategori || "-"} | Terjual: ${p.terjual || "-"} | Desc: ${(p.deskripsi || "").substring(0, 120)}...`;
    })
    .join("\n");
  
  return `${list}\n<br>Selalu arahkan pengunjung untuk melihat etalase lengkap di <strong><a href='toko.html'>Halaman Toko</a></strong>.`;
}

function buildKegiatanSummary() {
  const data = ensureDataLoaded().kegiatan;
  if (!data || !Array.isArray(data)) return "[DATA KEGIATAN GAGAL DIMUAT]";

  const list = data
    .map((k) => {
      const desc = k.deskripsi ? ` — ${k.deskripsi.substring(0, 100)}...` : "";
      const link = k.link ? ` (<a href="${k.link}" target="_blank">Baca Artikel</a>)` : "";
      return `- [${k.tanggal}] <strong>${k.judul}</strong> (${k.kategori || "Umum"})${desc}${link}`;
    })
    .join("\n");

  return `${list}\n<br>Semua kegiatan & berita selengkapnya ada di <strong><a href='kegiatan.html'>Halaman Kegiatan</a></strong>.`;
}

function buildGaleriSummary() {
  const data = ensureDataLoaded().galeri;
  if (!data) return "[DATA GALERI GAGAL DIMUAT]";

  let lines = ["<p>Galeri & Album selengkapnya ada di <strong><a href='galeri.html'>Halaman Galeri</a></strong>.</p>"];

  if (data.albumFoto && Array.isArray(data.albumFoto)) {
    data.albumFoto.forEach((album) => {
      const count = album.foto?.length || 0;
      const titles = album.foto
        ? [...new Set(album.foto.map((f) => f.title).filter(Boolean))]
            .slice(0, 3)
            .join(", ")
        : "";
      lines.push(
        `- Album: <strong>${album.judul}</strong> (${count} foto)${titles ? " — Highlight: " + titles : ""}`
      );
    });
  }

  if (data.dokumentasiVideo && Array.isArray(data.dokumentasiVideo)) {
    data.dokumentasiVideo.forEach((v) => {
      lines.push(`- Video: [${v.tanggal}] <a href="${v.src}" target="_blank">${v.title}</a>`);
    });
  }

  return lines.join("\n");
}

function buildKontakSummary() {
  const data = ensureDataLoaded().kontak;
  if (!data || !Array.isArray(data)) return "[DATA KONTAK GAGAL DIMUAT]";

  const lines = data.map((k) => {
    const wa =
      k.whatsapp && k.whatsapp !== "#"
        ? ` | <a href="https://wa.me/${k.whatsapp}" target="_blank">Chat WA</a>`
        : "";
    return `- <strong>${k.nama}</strong> (${k.jabatan})${wa}${k.deskripsi ? " — " + k.deskripsi : ""}`;
  });

  lines.push(
    "<b>KONTAK UTAMA:</b> Admin Amazia Kristanto, <a href='https://wa.me/6285876983793' target='_blank'>Hubungi via WhatsApp</a>"
  );
  lines.push("Halaman Kontak: <strong><a href='kontak.html'>Lihat Semua Kontak</a></strong>");

  return lines.join("\n");
}

function buildTestimonialSummary() {
  const data = ensureDataLoaded().testimonials;
  if (!data || !Array.isArray(data)) return "[DATA TESTIMONIAL GAGAL DIMUAT]";

  return data
    .slice(0, 5)
    .map((t) => {
      const text = (t.text || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .substring(0, 150);
      return `- <strong>${t.name}</strong> (${t.handle}): "${text}"`;
    })
    .join("\n");
}

// ============================================================
// BUILD SYSTEM PROMPT — COMPACT + POWERFUL
// ============================================================
function buildSystemPrompt() {
  const pengurusSummary = buildPengurusSummary();
  const produkSummary = buildProdukSummary();
  const kegiatanSummary = buildKegiatanSummary();
  const galeriSummary = buildGaleriSummary();
  const kontakSummary = buildKontakSummary();
  const testimonialSummary = buildTestimonialSummary();

  return `Kamu adalah "Asisten Cerdas Karang Taruna Banjarsari" — AI resmi website Karang Taruna Banjarsari, Desa Banjarsari, Kec. Kandangan, Kab. Temanggung.

KEPRIBADIAN:
- Fun, ramah, super user-friendly, dan suka bercanda/nge-joke ringan! Jangan kaku ya, layani user seperti obrolan asyik.
- Pakai emoji secukupnya biar nggak mbosenin.
- Kalau ada info yang tidak ada di DATA, mending jujur aja bilang nggak tau pakai gaya asyik (contoh: "Wah, pertanyaannya terlalu dewa nih buat aku 😂..."), terus arahin ke Admin WA. JANGAN MENEBAK-NEBAK ATAU NGARANG DATA.

ATURAN MENJAWAB (PENTING!!!):
1. JAWAB LANGSUNG pertanyaan user dengan rincian data (sebut produknya, namanya, atau kegiatannya). HARAM HUKUMNYA kalau cuma numpang redirect link ke halaman.
   - ❌ SALAH: "Silakan cek info kegiatan di Halaman Kegiatan ya."
   - ✅ BENAR: "Kegiatan terakhir kita itu <strong>[Nama Kegiatan]</strong> lho kak! Keren banget pesertanya ada banyak. Dokumentasinya bisa dibaca di <a href='artikel.html...' target='_blank'>artikel ini</a> ya! 😎"
2. FORMAT JAWABAN WAJIB MURNI HTML. Gunakan tag <p>, <br>, <strong>, <em>, <ul>, <li>.
3. DILARANG MERENDER MARKDOWN. Jangan pakai *asterisk*, **bold**, atau [teks](link). Harus pakai format HTML murni.
4. Kamu HARUS memunculkan/embedded LINK <a href="..."> yang sudah tersedia di data ini ke dalam jawabanmu. Supaya ketika nama/link di-klik, user langsung diarahkan.

=== DATA PENGURUS ===
${pengurusSummary}

=== DATA PRODUK & TOKO ===
${produkSummary}

=== DATA KEGIATAN & ARTIKEL ===
${kegiatanSummary}

=== DATA GALERI (FOTO & VIDEO) ===
${galeriSummary}

=== DATA KONTAK ===
${kontakSummary}

=== TESTIMONIAL ===
${testimonialSummary}
`;
}

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================
const AI_CONFIG = {
  model: "deepseek-chat",
  temperature: 0.3, // Diminimalkan agar tidak halusinasi (akurat), tapi System Prompt nge-drive untuk tetap Fun/Bercanda.
  max_tokens: 2024,
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    return sendError(
      res,
      "Kunci API chatbot belum dikonfigurasi. Hubungi admin.",
    );
  }

  const {
    userQuestion,
    history: convHistory = [],
    stream = false,
  } = req.body || {};

  if (
    !userQuestion ||
    typeof userQuestion !== "string" ||
    !userQuestion.trim()
  ) {
    return res.status(400).json({ error: "Pertanyaan tidak boleh kosong." });
  }

  // Ensure data is loaded (lazy init)
  ensureDataLoaded();

  // Build system prompt with knowledge base (server-side only)
  const systemPrompt = buildSystemPrompt();

  // Build messages for DeepSeek
  const messages = [{ role: "system", content: systemPrompt }];

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
    model: AI_CONFIG.model,
    messages,
    stream: true,
    temperature: AI_CONFIG.temperature,
    max_tokens: AI_CONFIG.max_tokens,
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

    sendSSE(res, "status", {
      message: "AI sedang menjawab...",
      state: "streaming",
    });

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
    sendSSE(res, "error", {
      error: "Gagal menghubungi server AI: " + err.message,
    });
    res.end();
  });

  reqDeep.write(payload);
  reqDeep.end();
}

function handleNonStreaming(res, messages, apiKey) {
  const payload = JSON.stringify({
    model: AI_CONFIG.model,
    messages,
    stream: false,
    temperature: AI_CONFIG.temperature,
    max_tokens: AI_CONFIG.max_tokens,
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
        return res
          .status(apiRes.statusCode || 500)
          .json({ error: parseAPIError(body) });
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
    res
      .status(500)
      .json({ error: "Gagal menghubungi server AI: " + err.message });
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
    return (
      parsed.error?.message ||
      parsed.message ||
      "DeepSeek API mengembalikan error."
    );
  } catch (e) {
    return raw.substring(0, 200) || "DeepSeek API error.";
  }
}
