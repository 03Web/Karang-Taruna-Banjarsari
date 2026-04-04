const fs = require("fs");
const path = require("path");

const KNOWLEDGE_PAYLOAD_PATH = path.join(
  process.cwd(),
  "js",
  "encrypted_output.txt",
);
const KNOWLEDGE_SECRET_KEY =
  process.env.CHATBOT_KNOWLEDGE_KEY || "KTA_Banjarsari2025_SecureKey";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const HISTORY_LIMIT = 18;

let cachedKnowledgeBase = null;

function xorCipher(text, key) {
  let result = "";

  for (let index = 0; index < text.length; index += 1) {
    result += String.fromCharCode(
      text.charCodeAt(index) ^ key.charCodeAt(index % key.length),
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

function parseRequestBody(rawBody) {
  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === "object") {
    return rawBody;
  }

  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      return {};
    }
  }

  return {};
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry.content !== "string") {
        return null;
      }

      const normalizedContent = entry.content.trim();

      if (!normalizedContent) {
        return null;
      }

      let normalizedRole = null;

      if (entry.role === "user") {
        normalizedRole = "user";
      } else if (
        entry.role === "assistant" ||
        entry.role === "model" ||
        entry.role === "bot"
      ) {
        normalizedRole = "assistant";
      }

      if (!normalizedRole) {
        return null;
      }

      return {
        role: normalizedRole,
        content: normalizedContent,
      };
    })
    .filter(Boolean)
    .slice(-HISTORY_LIMIT);
}

function buildSystemPrompt(knowledgeBase) {
  return `
Kamu adalah Asisten AI resmi Karang Taruna Banjarsari. Tugas kamu adalah menjawab pertanyaan pengguna dengan ramah, informatif, membantu, dan profesional.

ATURAN WAJIB:
1. Jika pertanyaan pengguna berkaitan dengan topik yang ada di "PETA SITUS (URL MAPPING)", kamu WAJIB menyertakan link (URL) yang bisa diklik menggunakan tag HTML <a href="...">...</a> di jawabanmu.
2. Jangan gunakan JavaScript, inline event handler, atau HTML berbahaya apa pun.
3. Gunakan struktur jawaban yang rapi. Jika perlu, gunakan <p>, <ul>, <ol>, <li>, <strong>, dan <br>.
4. Untuk jawaban yang panjang, pecah menjadi poin-poin singkat agar mudah dibaca.
5. Fokus pada knowledge base. Jika informasi tidak tersedia, katakan secara jujur dan arahkan pengguna ke halaman website yang paling relevan bila ada.
6. Gunakan bahasa Indonesia yang natural, sopan, dan jelas.

CONTOH OUTPUT YANG BENAR:
- "Untuk informasi lebih lanjut tentang pengurus, silakan kunjungi <a href='about.html'>Halaman Tentang Kami</a>."
- "Kamu bisa melihat dokumentasi kegiatan di <a href='galeri.html'>Galeri</a>."
- "Jika ingin mengirimkan aspirasi, silakan isi form di <a href='aspirasi.html'>Formulir Aspirasi</a>."

===============================
${knowledgeBase}
`;
}

function buildMessages(normalizedQuestion, history) {
  const safeHistory = normalizeHistory(history);

  if (
    safeHistory.length > 0 &&
    safeHistory[safeHistory.length - 1].role === "user" &&
    safeHistory[safeHistory.length - 1].content === normalizedQuestion
  ) {
    safeHistory.pop();
  }

  return safeHistory;
}

function setBaseHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function setStreamingHeaders(res) {
  setBaseHeaders(res);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  if (res.socket && typeof res.socket.setNoDelay === "function") {
    res.socket.setNoDelay(true);
  }
}

function sendSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  if (typeof res.flush === "function") {
    res.flush();
  }
}

async function readErrorMessage(response) {
  try {
    const errorData = await response.json();

    if (typeof errorData?.error?.message === "string") {
      return errorData.error.message;
    }

    if (typeof errorData?.error === "string") {
      return errorData.error;
    }

    if (typeof errorData?.message === "string") {
      return errorData.message;
    }
  } catch (error) {
    try {
      const fallbackText = await response.text();

      if (fallbackText) {
        return fallbackText;
      }
    } catch (innerError) {
      return "Gagal membaca error dari DeepSeek API.";
    }
  }

  return "Gagal menghubungi DeepSeek API.";
}

async function requestDeepSeek({
  apiKey,
  messages,
  signal,
  stream = false,
}) {
  const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      stream,
      messages,
    }),
    signal,
  });

  if (!deepseekResponse.ok) {
    throw new Error(await readErrorMessage(deepseekResponse));
  }

  return deepseekResponse;
}

function parseSseBlock(block) {
  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  return {
    eventName,
    data: dataLines.join("\n"),
  };
}

async function handleStandardResponse({ apiKey, messages }) {
  const response = await requestDeepSeek({
    apiKey,
    messages,
    stream: false,
  });
  const data = await response.json();

  return data?.choices?.[0]?.message?.content || "";
}

async function handleStreamingResponse({ apiKey, messages, req, res }) {
  const abortController = new AbortController();

  req.on("close", () => {
    abortController.abort();
  });

  const response = await requestDeepSeek({
    apiKey,
    messages,
    signal: abortController.signal,
    stream: true,
  });

  if (!response.body) {
    throw new Error("Provider tidak mengirimkan stream jawaban.");
  }

  setStreamingHeaders(res);
  sendSseEvent(res, "status", {
    state: "connecting",
    message: "Menghubungkan ke AI assistant...",
  });

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let fullAnswer = "";
  let hasStartedStreaming = false;
  let streamFinished = false;

  const processBlock = (block) => {
    const eventPayload = parseSseBlock(block);

    if (!eventPayload.data) {
      return false;
    }

    if (eventPayload.data === "[DONE]") {
      streamFinished = true;
      return true;
    }

    let parsedPayload = null;

    try {
      parsedPayload = JSON.parse(eventPayload.data);
    } catch (error) {
      return false;
    }

    const deltaContent =
      parsedPayload?.choices?.[0]?.delta?.content ||
      parsedPayload?.choices?.[0]?.message?.content ||
      "";

    if (deltaContent) {
      if (!hasStartedStreaming) {
        hasStartedStreaming = true;
        sendSseEvent(res, "status", {
          state: "streaming",
          message: "Jawaban sedang dikirim secara real-time...",
        });
      }

      fullAnswer += deltaContent;
      sendSseEvent(res, "chunk", { content: deltaContent });
    }

    if (parsedPayload?.choices?.[0]?.finish_reason) {
      streamFinished = true;
    }

    return streamFinished;
  };

  try {
    while (!streamFinished) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (processBlock(block)) {
          break;
        }
      }
    }

    if (!streamFinished && buffer.trim()) {
      processBlock(buffer);
    }

    sendSseEvent(res, "done", { answer: fullAnswer });
    res.end();

    return fullAnswer;
  } catch (error) {
    if (!res.headersSent) {
      setStreamingHeaders(res);
    }

    if (!res.writableEnded) {
      sendSseEvent(res, "error", {
        error:
          error.name === "AbortError"
            ? "Koneksi chatbot dihentikan sebelum jawaban selesai."
            : error.message,
      });
      res.end();
    }

    return "";
  }
}

module.exports = async (req, res) => {
  setBaseHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Metode request tidak didukung." });
    return;
  }

  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

  if (!deepseekApiKey) {
    res.status(500).json({ error: "Konfigurasi server chatbot bermasalah." });
    return;
  }

  try {
    const requestBody = parseRequestBody(req.body);
    const { userQuestion, history = [], stream = false } = requestBody;

    if (typeof userQuestion !== "string" || !userQuestion.trim()) {
      res.status(400).json({ error: "Pertanyaan pengguna tidak valid." });
      return;
    }

    const knowledgeBase = loadKnowledgeBase();
    const normalizedQuestion = userQuestion.trim();
    const wantsStream =
      stream === true ||
      String(req.headers.accept || "").includes("text/event-stream");
    const historyMessages = buildMessages(normalizedQuestion, history);
    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(knowledgeBase),
      },
      ...historyMessages,
      {
        role: "user",
        content: normalizedQuestion,
      },
    ];

    if (wantsStream) {
      await handleStreamingResponse({
        apiKey: deepseekApiKey,
        messages,
        req,
        res,
      });
      return;
    }

    const answer = await handleStandardResponse({
      apiKey: deepseekApiKey,
      messages,
    });

    res.status(200).json({ answer });
  } catch (error) {
    const wantsStream =
      String(req.headers.accept || "").includes("text/event-stream") ||
      Boolean(parseRequestBody(req.body).stream);

    if (wantsStream) {
      if (!res.headersSent) {
        setStreamingHeaders(res);
      }

      if (!res.writableEnded) {
        sendSseEvent(res, "error", { error: error.message });
        res.end();
      }

      return;
    }

    res.status(500).json({ error: error.message });
  }
};
