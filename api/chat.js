const https = require("https");
const fs = require("fs");
const path = require("path");

// ============================================================
// LOAD & CACHE ALL JSON DATA ON SERVER STARTUP
// Knowledge base lives ONLY on server — never sent to client
// ============================================================
function loadJsonFile(relativePath) {
  try {
    const fullPath = path.join(__dirname, "..", relativePath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(
      `[chat.js] Warning: could not load ${relativePath}:`,
      err.message,
    );
    return null;
  }
}

const CACHED_DATA = {
  pengurus: loadJsonFile("data/pengurus.json"),
  produk: loadJsonFile("data/produk.json"),
  kegiatan: loadJsonFile("data/kegiatan.json"),
  galeri: loadJsonFile("data/galeri.json"),
  testimonials: loadJsonFile("data/testimonials.json"),
  kontak: loadJsonFile("data/kontak.json"),
};

// ============================================================
// BUILD RICH SUMMARY TEXTS FROM CACHED DATA
// ============================================================

function buildPengurusSummary() {
  const data = CACHED_DATA.pengurus;
  if (!data) return "Data pengurus tidak tersedia.";

  let lines = [];

  lines.push("PENGURUS INTI:");
  if (data.pengurusInti && Array.isArray(data.pengurusInti)) {
    data.pengurusInti.forEach((p) => {
      lines.push(`  • ${p.jabatan}: ${p.nama}`);
    });
  }

  if (data.bidang && Array.isArray(data.bidang)) {
    lines.push("");
    lines.push("BIDANG-BIDANG ORGANISASI:");
    data.bidang.forEach((b) => {
      lines.push(`  [${b.namaBidang}]`);
      if (b.anggota && Array.isArray(b.anggota)) {
        b.anggota.forEach((a) => {
          lines.push(`    • ${a.nama} — ${a.jabatan}`);
        });
      }
    });
  }

  lines.push("");
  lines.push("Halaman terkait: about.html");

  return lines.join("\n");
}

function buildProdukSummary() {
  const data = CACHED_DATA.produk;
  if (!data || !Array.isArray(data)) return "Data produk tidak tersedia.";

  const lines = data.map((p) => {
    const hargaFormatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(p.harga);
    return [
      `  • ${p.nama}`,
      `    ID: ${p.id}`,
      `    Harga: ${hargaFormatted}`,
      `    Kategori: ${p.kategori || "-"}`,
      `    Lokasi: ${p.lokasi || "-"}`,
      `    Rating: ${p.rating || "-"} | Terjual: ${p.terjual || "-"}`,
      `    Deskripsi: ${(p.deskripsi || "").substring(0, 150)}`,
      `    Link detail: detail-produk.html?id=${p.id}`,
    ].join("\n");
  });

  lines.push("");
  lines.push("Halaman toko: toko.html");
  lines.push("Halaman detail: detail-produk.html?id=[ID_PRODUK]");

  return lines.join("\n\n");
}

function buildKegiatanSummary() {
  const data = CACHED_DATA.kegiatan;
  if (!data || !Array.isArray(data)) return "Data kegiatan tidak tersedia.";

  const lines = data.map((k) => {
    const parts = [
      `  • [${k.tanggal}] ${k.judul}`,
      `    Kategori: ${k.kategori || "Umum"}`,
    ];
    if (k.deskripsi) {
      parts.push(`    Deskripsi: ${k.deskripsi.substring(0, 120)}...`);
    }
    if (k.link) {
      parts.push(`    Link: ${k.link}`);
    }
    return parts.join("\n");
  });

  lines.push("");
  lines.push("Halaman kegiatan: kegiatan.html");

  return lines.join("\n\n");
}

function buildGaleriSummary() {
  const data = CACHED_DATA.galeri;
  if (!data) return "Data galeri tidak tersedia.";

  let lines = [];

  if (data.albumFoto && Array.isArray(data.albumFoto)) {
    lines.push("ALBUM FOTO:");
    data.albumFoto.forEach((album) => {
      const photoCount = album.foto?.length || 0;
      lines.push(`  • ${album.judul} (${photoCount} foto)`);
      if (album.deskripsi) {
        lines.push(`    Keterangan: ${album.deskripsi}`);
      }
      // Tampilkan beberapa judul foto unik
      if (album.foto && album.foto.length > 0) {
        const uniqueTitles = [
          ...new Set(album.foto.map((f) => f.title).filter(Boolean)),
        ].slice(0, 5);
        if (uniqueTitles.length > 0) {
          lines.push(`    Isi: ${uniqueTitles.join(", ")}`);
        }
      }
    });
  }

  if (data.dokumentasiVideo && Array.isArray(data.dokumentasiVideo)) {
    lines.push("");
    lines.push("VIDEO DOKUMENTASI:");
    data.dokumentasiVideo.forEach((v) => {
      lines.push(`  • [${v.tanggal}] ${v.title}`);
    });
  }

  lines.push("");
  lines.push("Halaman galeri: galeri.html");

  return lines.join("\n");
}

function buildKontakSummary() {
  const data = CACHED_DATA.kontak;
  if (!data || !Array.isArray(data)) return "Data kontak tidak tersedia.";

  const lines = data.map((k) => {
    const parts = [`  • ${k.nama} — ${k.jabatan}`];
    if (k.deskripsi) parts.push(`    ${k.deskripsi}`);
    if (k.whatsapp && k.whatsapp !== "#") {
      parts.push(`    WhatsApp: https://wa.me/${k.whatsapp}`);
    }
    return parts.join("\n");
  });

  lines.push("");
  lines.push("KONTAK UTAMA UNTUK SEMUA PERTANYAAN:");
  lines.push("  Admin Website: Amazia Kristanto");
  lines.push("  WhatsApp: https://wa.me/6285876983793");
  lines.push("  (Arahkan user ke WA admin ini untuk pertanyaan lebih lanjut)");
  lines.push("");
  lines.push("Halaman kontak: kontak.html");

  return lines.join("\n");
}

function buildTestimonialSummary() {
  const data = CACHED_DATA.testimonials;
  if (!data || !Array.isArray(data)) return "Data testimonial tidak tersedia.";

  const lines = data.slice(0, 10).map((t) => {
    const textPreview = (t.text || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .substring(0, 120);
    return `  • ${t.name} (${t.handle}): "${textPreview}..."`;
  });

  lines.push("");
  lines.push(
    "Testimonial ditampilkan di halaman utama (index.html section testimonial)",
  );

  return lines.join("\n");
}

// ============================================================
// WEBSITE PAGE MAP — AI uses this to embed correct links
// ============================================================
const WEBSITE_PAGE_MAP = `
PETA HALAMAN WEBSITE KARANG TARUNA BANJARSARI:
  • index.html — Halaman utama (beranda, testimonial, highlight kegiatan)
  • about.html — Profil organisasi, visi misi, struktur pengurus
  • kegiatan.html — Daftar semua kegiatan, berita, dan artikel
  • artikel.html?slug=[SLUG] — Detail artikel tertentu
  • galeri.html — Galeri foto (album) dan video dokumentasi
  • aspirasi.html — Form pengiriman aspirasi, saran, kritik, dan ide
  • kontak.html — Daftar kontak pengurus dan informasi lokasi
  • toko.html — Katalog produk & jasa UMKM desa
  • detail-produk.html?id=[ID] — Detail produk tertentu
  • search.html — Pencarian konten website
  • keranjang.html — Keranjang belanja
  • checkout.html — Proses pembayaran
`;

// ============================================================
// BUILD SYSTEM PROMPT WITH FULL KNOWLEDGE + PERSONA
// ============================================================
function buildSystemPrompt() {
  const pengurusSummary = buildPengurusSummary();
  const produkSummary = buildProdukSummary();
  const kegiatanSummary = buildKegiatanSummary();
  const galeriSummary = buildGaleriSummary();
  const kontakSummary = buildKontakSummary();
  const testimonialSummary = buildTestimonialSummary();

  return `Kamu adalah "Asisten Cerdas Karang Taruna Banjarsari" — AI assistant resmi website Karang Taruna Banjarsari, Desa Banjarsari, Kecamatan Kandangan, Kabupaten Temanggung, Jawa Tengah.

=== KEPRIBADIAN & GAYA BICARA ===
- Kamu RAMAH, FUN, dan SUKA BERCANDA ringan layaknya anak muda desa yang gaul tapi sopan.
- Sisipkan emoji sesekali biar chat terasa hidup 😄
- Boleh kasih joke ringan atau candaan lucu yang relevan, tapi jangan berlebihan.
- Kalau ada kesempatan, tambahkan sedikit humor khas Jawa/desa (tapi tetap inklusif).
- Contoh gaya bicara: "Wah, mantap pertanyaannya! 🔥", "Siap, aku bantu ya kak!", "Keren banget nih Karang Taruna kita 💪"
- Jawab dengan AKURAT dan berdasarkan DATA di bawah. Jangan mengarang informasi.
- Gunakan bahasa Indonesia yang santai, mudah dipahami, tapi tetap sopan dan informatif.
- Kalau tidak tahu jawabannya, bilang jujur dan arahkan ke admin via WhatsApp.

=== DATA PENGURUS KARANG TARUNA BANJARSARI ===
${pengurusSummary}

=== DATA PRODUK & TOKO UMKM DESA ===
${produkSummary}

=== DATA KEGIATAN, BERITA & ARTIKEL ===
${kegiatanSummary}

=== DATA GALERI FOTO & VIDEO ===
${galeriSummary}

=== DATA KONTAK PENGURUS ===
${kontakSummary}

=== DATA QUOTES & TESTIMONIAL ===
${testimonialSummary}

${WEBSITE_PAGE_MAP}

=== ATURAN WAJIB (STRICT RULES) ===

1. JAWAB DULU, BARU ARAHKAN: Ini aturan PALING PENTING. Jika user bertanya sesuatu yang datanya ada di atas, JAWAB LANGSUNG dengan data yang lengkap dan akurat TERLEBIH DAHULU. Setelah menjawab, baru tambahkan link halaman terkait sebagai pelengkap "untuk info lebih lengkap, kunjungi [link]".
   - CONTOH BENAR: "Ketua Karang Taruna Banjarsari adalah **Andri Apriyanto** 💪 Wakil Ketuanya **Yunita Sari**, dan Sekretarisnya **Dimas Suryo L.** Untuk info lengkap seluruh pengurus, cek di <a href='about.html'>halaman profil organisasi</a> ya!"
   - CONTOH SALAH: "Untuk informasi pengurus, silakan kunjungi halaman profil." ← INI DILARANG!
   - Kalau ditanya nama, SEBUTKAN namanya. Ditanya harga, SEBUTKAN harganya. Ditanya kegiatan, SEBUTKAN kegiatannya. JANGAN hanya redirect.

2. AKURASI: HANYA gunakan data di atas. JANGAN pernah mengarang nama, jabatan, harga, tanggal, atau informasi apapun. Jika data tidak tersedia, katakan jujur.

3. EMBEDDED LINK: Setelah menjawab dengan data, sertakan link HTML yang relevan agar user bisa klik untuk detail lebih lanjut. Format:
   - Link internal: <a href="about.html">lihat halaman profil</a>
   - Link produk: <a href="detail-produk.html?id=ID_PRODUK">lihat detail produk</a>
   - Link artikel: <a href="artikel.html?slug=SLUG">baca artikel</a>
   - Link WhatsApp admin: <a href="https://wa.me/6285876983793" target="_blank">hubungi admin via WhatsApp</a>
   - Link eksternal: tambahkan target="_blank" rel="noopener noreferrer"

4. KONTAK DEFAULT: Jika user butuh bantuan lebih lanjut atau info yang tidak tersedia, SELALU arahkan ke admin Amazia Kristanto via WhatsApp: <a href="https://wa.me/6285876983793" target="_blank">085876983793</a>

5. FORMAT: Gunakan HTML sederhana (p, ul, ol, li, br, strong, em, a) untuk format jawaban yang rapi dan mudah dibaca. Jangan gunakan Markdown.

6. FOKUS: Tetap fokus pada topik Karang Taruna Banjarsari, desa Banjarsari, dan konten website. Jika ditanya di luar topik, kembalikan ke topik utama dengan cara yang ramah.

7. BAHASA: Jawab dalam bahasa Indonesia. Jika user bertanya dalam bahasa lain, tetap jawab dalam bahasa Indonesia.`;
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
