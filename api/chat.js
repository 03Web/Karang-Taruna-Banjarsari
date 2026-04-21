const https = require("https");
const fs = require("fs");
const path = require("path");
const DATA_BUNDLE = require("./data-bundle");

// ============================================================
// LOAD & CACHE ALL JSON DATA ON SERVER STARTUP
// Knowledge base lives ONLY on server — never sent to client
// ============================================================

// Try multiple path strategies for Vercel compatibility
function loadJsonFile(relativePath) {
  // Vercel: __dirname = /var/task/api, data should be at /var/task/data
  const strategies = [
    path.join(__dirname, "..", relativePath),  // /var/task/api/../data = /var/task/data
    path.join(__dirname, "../..", relativePath),  // /var/task/api/../.. = /var/task
    path.join(process.cwd(), relativePath),
    path.resolve(relativePath),
  ];

  console.log(`[chat.js] Trying to load ${relativePath}...`);

  for (const fullPath of strategies) {
    try {
      console.log(`[chat.js]   Checking: ${fullPath}`);
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        console.log(`[chat.js] ✓ Loaded ${relativePath} from ${fullPath}`);
        return parsed;
      } else {
        console.log(`[chat.js]   File not found: ${fullPath}`);
      }
    } catch (err) {
      console.log(`[chat.js]   Error reading ${fullPath}: ${err.message}`);
    }
  }

  console.error(
    `[chat.js] ✗ FAILED to load ${relativePath}. Tried: ${strategies.join(", ")}`,
  );
  return null;
}

let CACHED_DATA = null;
let LOAD_ATTEMPTS = 0;

function ensureDataLoaded() {
  LOAD_ATTEMPTS++;

  if (CACHED_DATA) {
    console.log(`[chat.js] ✓ Using cached data (attempt #${LOAD_ATTEMPTS})`);
    return CACHED_DATA;
  }

  console.log(`[chat.js] Loading JSON data for attempt #${LOAD_ATTEMPTS}...`);
  console.log(`[chat.js] __dirname = ${__dirname}`);
  console.log(`[chat.js] process.cwd() = ${process.cwd()}`);

  // Try filesystem first
  const fileData = {
    pengurus: loadJsonFile("data/pengurus.json"),
    produk: loadJsonFile("data/produk.json"),
    kegiatan: loadJsonFile("data/kegiatan.json"),
    galeri: loadJsonFile("data/galeri.json"),
    testimonials: loadJsonFile("data/testimonials.json"),
    kontak: loadJsonFile("data/kontak.json"),
  };

  // Fallback to embedded bundle if file loading fails
  CACHED_DATA = {
    pengurus: fileData.pengurus || DATA_BUNDLE.pengurus,
    produk: fileData.produk || DATA_BUNDLE.produk,
    kegiatan: fileData.kegiatan || DATA_BUNDLE.kegiatan,
    galeri: fileData.galeri || DATA_BUNDLE.galeri,
    testimonials: fileData.testimonials || DATA_BUNDLE.testimonials,
    kontak: fileData.kontak || DATA_BUNDLE.kontak,
  };

  // Log which data loaded successfully
  const status = Object.entries(CACHED_DATA)
    .map(([k, v]) => {
      const source = v ? (fileData[k] ? "file✓" : "bundle✓") : "✗";
      return `${k}: ${source}`;
    })
    .join(", ");
  console.log(`[chat.js] Data status: ${status}`);

  // Log total knowledge base size
  const totalSize = JSON.stringify(CACHED_DATA).length;
  console.log(`[chat.js] Total knowledge base size: ${(totalSize / 1024).toFixed(2)} KB`);

  return CACHED_DATA;
}

// ============================================================
// BUILD COMPACT BUT COMPLETE SUMMARIES
// Keep summaries token-efficient so DeepSeek can process them
// ============================================================

function buildPengurusSummary() {
  const data = ensureDataLoaded().pengurus;
  if (!data) return "[DATA PENGURUS GAGAL DIMUAT]";

  let lines = [];

  if (data.pengurusInti && Array.isArray(data.pengurusInti)) {
    lines.push("Pengurus Inti:");
    data.pengurusInti.forEach((p) => {
      lines.push(`- ${p.jabatan}: ${p.nama}`);
    });
  }

  if (data.bidang && Array.isArray(data.bidang)) {
    data.bidang.forEach((b) => {
      const members = (b.anggota || [])
        .map((a) => `${a.nama}(${a.jabatan})`)
        .join(", ");
      lines.push(`- ${b.namaBidang}: ${members}`);
    });
  }

  return lines.join("\n");
}

function buildProdukSummary() {
  const data = ensureDataLoaded().produk;
  if (!data || !Array.isArray(data)) return "[DATA PRODUK GAGAL DIMUAT]";

  return data
    .map((p) => {
      const harga = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(p.harga);
      return `- ${p.nama} | ${harga} | Kategori:${p.kategori || "-"} | Rating:${p.rating || "-"} | Terjual:${p.terjual || "-"} | Lokasi:${p.lokasi || "-"} | ID:${p.id} | Link:detail-produk.html?id=${p.id} | ${(p.deskripsi || "").substring(0, 80)}`;
    })
    .join("\n");
}

function buildKegiatanSummary() {
  const data = ensureDataLoaded().kegiatan;
  if (!data || !Array.isArray(data)) return "[DATA KEGIATAN GAGAL DIMUAT]";

  return data
    .map((k) => {
      const desc = k.deskripsi ? ` — ${k.deskripsi.substring(0, 80)}` : "";
      const link = k.link ? ` | Link:${k.link}` : "";
      return `- [${k.tanggal}] ${k.judul} (${k.kategori || "Umum"})${desc}${link}`;
    })
    .join("\n");
}

function buildGaleriSummary() {
  const data = ensureDataLoaded().galeri;
  if (!data) return "[DATA GALERI GAGAL DIMUAT]";

  let lines = [];

  if (data.albumFoto && Array.isArray(data.albumFoto)) {
    data.albumFoto.forEach((album) => {
      const count = album.foto?.length || 0;
      const titles = album.foto
        ? [...new Set(album.foto.map((f) => f.title).filter(Boolean))]
            .slice(0, 3)
            .join(", ")
        : "";
      lines.push(
        `- Album: ${album.judul} (${count} foto)${titles ? " — " + titles : ""}`,
      );
    });
  }

  if (data.dokumentasiVideo && Array.isArray(data.dokumentasiVideo)) {
    data.dokumentasiVideo.forEach((v) => {
      lines.push(`- Video: [${v.tanggal}] ${v.title}`);
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
        ? ` | WA:https://wa.me/${k.whatsapp}`
        : "";
    return `- ${k.nama} (${k.jabatan})${wa}${k.deskripsi ? " — " + k.deskripsi : ""}`;
  });

  lines.push(
    "KONTAK UTAMA: Admin Amazia Kristanto, WA: https://wa.me/6285876983793",
  );

  return lines.join("\n");
}

function buildTestimonialSummary() {
  const data = ensureDataLoaded().testimonials;
  if (!data || !Array.isArray(data)) return "[DATA TESTIMONIAL GAGAL DIMUAT]";

  return data
    .slice(0, 8)
    .map((t) => {
      const text = (t.text || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .substring(0, 100);
      return `- ${t.name}(${t.handle}): "${text}"`;
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

  return `Kamu adalah "Asisten Cerdas Karang Taruna Banjarsari" — AI resmi website Karang Taruna Banjarsari, Desa Banjarsari, Kec. Kandangan, Kab. Temanggung, Jawa Tengah.

KEPRIBADIAN:
- Ramah, fun, suka bercanda ringan, gaul tapi sopan. Pakai emoji sesekali.
- Jawab AKURAT berdasarkan DATA di bawah. Jangan ngarang!
- Bahasa Indonesia santai tapi informatif.
- Kalau tidak tahu, bilang jujur & arahkan ke admin WA.

ATURAN #1 TERPENTING — JAWAB DULU BARU ARAHKAN:
Jika user tanya sesuatu yang datanya ADA di bawah, JAWAB LANGSUNG dengan datanya. JANGAN hanya redirect ke halaman.
Contoh BENAR: "Ketua KT Banjarsari adalah <strong>Andri Apriyanto</strong>. Wakilnya <strong>Yunita Sari</strong>. Selengkapnya cek di <a href='about.html'>halaman profil</a> ya!"
Contoh SALAH: "Silakan kunjungi halaman profil untuk info pengurus." — INI DILARANG!

=== PENGURUS ===
${pengurusSummary}

=== PRODUK & TOKO (halaman: toko.html) ===
${produkSummary}

=== KEGIATAN & ARTIKEL (halaman: kegiatan.html) ===
${kegiatanSummary}

=== GALERI (halaman: galeri.html) ===
${galeriSummary}

=== KONTAK (halaman: kontak.html) ===
${kontakSummary}

=== TESTIMONIAL (di index.html) ===
${testimonialSummary}

HALAMAN WEBSITE:
index.html(beranda), about.html(profil/pengurus), kegiatan.html(kegiatan), galeri.html(foto/video), aspirasi.html(kirim saran), kontak.html(kontak), toko.html(produk), detail-produk.html?id=ID(detail produk), artikel.html?slug=SLUG(artikel), search.html(cari)

ATURAN LAIN:
- Gunakan HTML (p,ul,li,strong,em,a,br). Jangan pakai Markdown.
- Sertakan <a href="...">link</a> ke halaman terkait di akhir jawaban.
- Link WA admin: <a href="https://wa.me/6285876983793" target="_blank">hubungi admin</a>
- Kalau info tidak ada, arahkan ke admin Amazia Kristanto WA 085876983793.
- Tetap fokus topik Karang Taruna Banjarsari.`;
}

// ============================================================
// AI MODEL CONFIGURATION
// ============================================================
const AI_CONFIG = {
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 1024,
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
  const data = ensureDataLoaded();

  // Build system prompt with knowledge base (server-side only)
  const systemPrompt = buildSystemPrompt();

  // Debug: Log data availability per request
  const dataAvailable = Object.entries(data)
    .filter(([_, v]) => v !== null)
    .map(([k, _]) => k)
    .join(", ");
  console.log(`[chat.js] Request received. Data available: ${dataAvailable}`);

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
