document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/chat";
  const CHAT_HISTORY_KEY = "chatbotHistory";
  const CHAT_SUGGESTIONS_KEY = "chatbotSuggestions";
  const HISTORY_LIMIT = 30;
  const API_HISTORY_LIMIT = 16;
  const SUGGESTION_LIMIT = 5;
  const DEFAULT_STATUS =
    "";
  const DEFAULT_GREETING =
    "Halo! Saya siap membantu Anda memahami informasi Karang Taruna Banjarsari secara cepat, rapi, dan relevan.";
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const TOPICS = [
    {
      keywords: [
        "pengurus",
        "ketua",
        "struktur",
        "organisasi",
        "tentang",
        "visi",
        "misi",
        "profil",
      ],
      suggestions: [
        "Siapa saja pengurus Karang Taruna Banjarsari?",
        "Apa visi dan tujuan Karang Taruna Banjarsari?",
        "Di halaman mana saya bisa melihat profil organisasi?",
      ],
    },
    {
      keywords: [
        "kegiatan",
        "program",
        "agenda",
        "event",
        "acara",
        "galeri",
        "foto",
        "video",
        "dokumentasi",
      ],
      suggestions: [
        "Kegiatan terbaru apa yang sedang berjalan?",
        "Di mana saya bisa melihat galeri kegiatan?",
        "Bagaimana cara ikut kegiatan Karang Taruna berikutnya?",
      ],
    },
    {
      keywords: ["aspirasi", "saran", "masukan", "kritik", "ide", "usulan"],
      suggestions: [
        "Bagaimana cara mengirim aspirasi atau saran?",
        "Aspirasi seperti apa yang bisa saya kirim?",
        "Apakah ada halaman khusus untuk menyampaikan ide?",
      ],
    },
    {
      keywords: [
        "kontak",
        "hubungi",
        "alamat",
        "lokasi",
        "sekretariat",
        "email",
        "whatsapp",
        "maps",
      ],
      suggestions: [
        "Di mana lokasi sekretariat Karang Taruna Banjarsari?",
        "Bagaimana cara menghubungi pengurus?",
        "Apakah ada email atau media sosial resmi?",
      ],
    },
    {
      keywords: [
        "toko",
        "produk",
        "barang",
        "merchandise",
        "checkout",
        "keranjang",
        "pesanan",
        "beli",
      ],
      suggestions: [
        "Produk apa saja yang tersedia di toko?",
        "Bagaimana proses checkout pesanan?",
        "Apakah ada merchandise Karang Taruna yang bisa dibeli?",
      ],
    },
    {
      keywords: [
        "artikel",
        "berita",
        "informasi",
        "pencarian",
        "search",
        "halaman",
        "website",
      ],
      suggestions: [
        "Artikel atau informasi terbaru membahas apa?",
        "Halaman website mana yang paling relevan untuk saya buka?",
        "Bagaimana cara mencari informasi tertentu di website ini?",
      ],
    },
  ];

  const PAGE_SUGGESTIONS = {
    home: [
      "Halaman utama ini punya informasi penting apa saja?",
      "Kegiatan terbaru apa yang sedang ditampilkan?",
      "Di mana saya mulai jika ingin mengenal Karang Taruna ini?",
    ],
    about: [
      "Siapa saja pengurus Karang Taruna Banjarsari?",
      "Apa visi organisasi ini?",
      "Di mana saya bisa melihat profil lengkapnya?",
    ],
    kegiatan: [
      "Kegiatan terbaru apa yang sedang berjalan?",
      "Bagaimana cara ikut kegiatan berikutnya?",
      "Apakah ada dokumentasi kegiatan sebelumnya?",
    ],
    galeri: [
      "Dokumentasi kegiatan apa saja yang ada di galeri?",
      "Apakah ada foto atau video kegiatan terbaru?",
      "Di mana saya bisa melihat kegiatan yang paling ramai?",
    ],
    aspirasi: [
      "Bagaimana cara mengirim aspirasi?",
      "Aspirasi seperti apa yang bisa saya sampaikan?",
      "Apakah aspirasi saya akan dibaca pengurus?",
    ],
    kontak: [
      "Di mana lokasi sekretariat Karang Taruna Banjarsari?",
      "Bagaimana cara menghubungi pengurus?",
      "Apakah ada email atau media sosial resmi?",
    ],
    toko: [
      "Produk apa saja yang tersedia di toko?",
      "Bagaimana proses checkout pesanan?",
      "Apakah ada merchandise Karang Taruna yang bisa dibeli?",
    ],
    search: [
      "Bagaimana cara mencari informasi di website ini?",
      "Halaman mana yang paling relevan untuk topik tertentu?",
      "Bisa bantu arahkan saya ke halaman yang tepat?",
    ],
  };

  const DEFAULT_SUGGESTIONS = [
    "Apa saja program atau kegiatan Karang Taruna Banjarsari?",
    "Siapa saja pengurus Karang Taruna Banjarsari?",
    "Bagaimana cara mengirim aspirasi atau saran?",
    "Di mana lokasi sekretariat dan kontak resminya?",
  ];

  const GENERIC_FOLLOW_UPS = [
    "Bisa beri ringkasan poin terpentingnya?",
    "Apa langkah berikutnya yang sebaiknya saya lakukan?",
    "Tolong arahkan saya ke halaman website yang paling relevan.",
  ];

  const chatbotContainer = document.getElementById("chatbot-container");
  const openBtn = document.getElementById("open-chatbot-btn");

  if (!chatbotContainer || !openBtn) {
    return;
  }

  enhanceMarkup(
    chatbotContainer,
    openBtn,
    extractInitialGreeting(chatbotContainer) || DEFAULT_GREETING,
  );

  const closeBtn = document.getElementById("close-chatbot");
  const sendBtn = document.getElementById("send-chat-btn");
  const sendBtnLabel = document.getElementById("send-chat-btn-label");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");
  const chatbotHero = document.getElementById("chatbot-hero");
  const chatbotStatus = document.getElementById("chatbot-status");
  const chatbotStatusBadge = document.getElementById("chatbot-status-badge");
  const chatbotSuggestions = document.getElementById("chatbot-suggestions");
  const chatbotSuggestionsLabel = document.getElementById(
    "chatbot-suggestions-label",
  );
  const chatbotSuggestionWrap = document.getElementById("chatbot-suggestion-wrap");
  const chatForm = document.getElementById("chat-input-container");

  if (
    !closeBtn ||
    !sendBtn ||
    !sendBtnLabel ||
    !chatInput ||
    !chatWindow ||
    !chatbotStatus ||
    !chatbotStatusBadge ||
    !chatbotSuggestions ||
    !chatbotSuggestionsLabel ||
    !chatForm
  ) {
    return;
  }

  const state = {
    history: readHistory(),
    suggestions: readSuggestions(),
    isOpen: false,
    isReady: false,
    isSending: false,
    shouldStickToBottom: true,
  };

  openBtn.addEventListener("click", () => setOpenState(true));
  closeBtn.addEventListener("click", () => setOpenState(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isOpen) {
      setOpenState(false);
    }
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSendMessage();
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  });

  chatInput.addEventListener("input", resizeChatInput);
  chatWindow.addEventListener("scroll", () => {
    state.shouldStickToBottom = isNearBottom(chatWindow);
  });

  chatbotSuggestions.addEventListener("click", (event) => {
    const button = event.target.closest(".chat-suggestion-btn");

    if (!button || button.disabled) {
      return;
    }

    const promptText = button.dataset.prompt || "";

    if (!promptText) {
      return;
    }

    setOpenState(true);
    chatInput.value = promptText;
    resizeChatInput();
    handleSendMessage(promptText);
  });

  if (state.history.length === 0) {
    const defaultGreeting = extractInitialGreeting(chatbotContainer) || DEFAULT_GREETING;
    state.history = [{ role: "assistant", content: defaultGreeting, timestamp: new Date().toISOString() }];
  }

  renderConversation();
  renderSuggestions(
    state.suggestions.length ? state.suggestions : buildSuggestions(state.history),
  );
  updateHeroVisibility();
  updateStatus(DEFAULT_STATUS, "ready");
  updateComposerState(false);
  resizeChatInput();
  setOpenState(false);
  setupVisibilityGate();

  function enhanceMarkup(container, launcher, greeting) {
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-label", "AI Assistant Karang Taruna Banjarsari");
    container.setAttribute("aria-modal", "false");
    container.innerHTML = `
      <div class="chatbot-panel">
        <div id="chatbot-header">
          <div class="chatbot-header-copy">
            <div class="chatbot-title-row" style="margin-top: 0;">
              <h2 class="chatbot-title">AI Assistant</h2>
              <span id="chatbot-status-badge" class="chatbot-status-badge">Online</span>
            </div>
            <p id="chatbot-status" class="chatbot-status" style="display: none;">${escapeHtml(DEFAULT_STATUS)}</p>
          </div>
          <button id="close-chatbot" type="button" aria-label="Tutup chatbot">
            <i class="fas fa-minus" aria-hidden="true"></i>
          </button>
        </div>
        <div id="chatbot-body">
          <div id="chat-window" role="log" aria-live="polite" aria-relevant="additions text"></div>
          <section id="chatbot-suggestion-wrap" class="chatbot-suggestion-wrap" aria-label="Saran pertanyaan">
            <div class="chatbot-section-header">
              <span id="chatbot-suggestions-label" class="chatbot-section-label">Mulai dari topik ini</span>
              <span class="chatbot-section-note">Klik untuk langsung bertanya</span>
            </div>
            <div id="chatbot-suggestions" class="chatbot-suggestions" role="list"></div>
          </section>
          <form id="chat-input-container" novalidate>
            <div class="chat-input-shell">
              <label class="visually-hidden" for="chat-input">Ketik pertanyaan Anda</label>
              <textarea
                id="chat-input"
                rows="1"
                placeholder="Ketik pesan Anda di sini..."
                autocomplete="off"
              ></textarea>
              <button id="send-chat-btn" type="submit">
                <span id="send-chat-btn-label">Kirim</span>
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    launcher.type = "button";
    launcher.setAttribute("aria-label", "Buka AI assistant");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = `
      <span class="chatbot-launcher-icon" aria-hidden="true"><i class="fas fa-comments"></i></span>
      <span class="chatbot-launcher-copy">
        <strong>AI Assistant</strong>
        <small>Tanya cepat, jawab real-time</small>
      </span>
    `;
  }

  function extractInitialGreeting(container) {
    return (container.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getPageId() {
    return document.body?.dataset.pageId || "default";
  }

  function normalizeHistoryEntry(entry) {
    if (!entry || typeof entry.content !== "string") {
      return null;
    }

    const content = entry.content.trim();

    if (!content) {
      return null;
    }

    let role = null;

    if (entry.role === "user") {
      role = "user";
    } else if (
      entry.role === "assistant" ||
      entry.role === "model" ||
      entry.role === "bot"
    ) {
      role = "assistant";
    }

    if (!role) {
      return null;
    }

    return {
      role,
      content,
      timestamp: entry.timestamp || new Date().toISOString(),
    };
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.map(normalizeHistoryEntry).filter(Boolean).slice(-HISTORY_LIMIT)
        : [];
    } catch (error) {
      console.error("Error reading chat history:", error);
      return [];
    }
  }

  function saveHistory(history) {
    try {
      const normalized = history
        .map(normalizeHistoryEntry)
        .filter(Boolean)
        .slice(-HISTORY_LIMIT);

      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(normalized));
      state.history = normalized;
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  function readSuggestions() {
    try {
      const raw = localStorage.getItem(CHAT_SUGGESTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? uniqueSuggestions(parsed).slice(0, SUGGESTION_LIMIT)
        : [];
    } catch (error) {
      console.error("Error reading chat suggestions:", error);
      return [];
    }
  }

  function saveSuggestions(suggestions) {
    try {
      const normalized = uniqueSuggestions(suggestions).slice(
        0,
        SUGGESTION_LIMIT,
      );
      localStorage.setItem(CHAT_SUGGESTIONS_KEY, JSON.stringify(normalized));
      state.suggestions = normalized;
    } catch (error) {
      console.error("Error saving chat suggestions:", error);
    }
  }

  function uniqueSuggestions(items) {
    const seen = new Set();
    return items.filter((item) => {
      if (typeof item !== "string") {
        return false;
      }

      const normalized = item.trim();

      if (!normalized) {
        return false;
      }

      const key = normalized.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function detectTopics(text) {
    const normalized = text.toLowerCase();
    return TOPICS.filter((topic) =>
      topic.keywords.some((keyword) => normalized.includes(keyword)),
    ).flatMap((topic) => topic.suggestions);
  }

  function buildSuggestions(history) {
    const pageSuggestions = PAGE_SUGGESTIONS[getPageId()] || DEFAULT_SUGGESTIONS;
    const lastUser = [...history].reverse().find((item) => item.role === "user");
    const lastAssistant = [...history]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!lastUser) {
      return uniqueSuggestions([
        ...pageSuggestions,
        ...DEFAULT_SUGGESTIONS,
        ...GENERIC_FOLLOW_UPS,
      ]).slice(0, SUGGESTION_LIMIT);
    }

    return uniqueSuggestions([
      ...detectTopics(`${lastUser.content} ${stripHtml(lastAssistant?.content || "")}`),
      ...pageSuggestions,
      ...GENERIC_FOLLOW_UPS,
      ...DEFAULT_SUGGESTIONS,
    ])
      .filter((item) => item.toLowerCase() !== lastUser.content.toLowerCase())
      .slice(0, SUGGESTION_LIMIT);
  }

  function renderSuggestions(suggestions) {
    const normalized = uniqueSuggestions(suggestions).slice(0, SUGGESTION_LIMIT);
    chatbotSuggestions.innerHTML = "";
    chatbotSuggestionsLabel.textContent = state.history.length
      ? "Pertanyaan lanjutan yang relevan"
      : "Mulai dari topik ini";

    normalized.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-suggestion-btn";
      button.dataset.prompt = suggestion;
      button.textContent = suggestion;
      button.disabled = state.isSending;
      chatbotSuggestions.appendChild(button);
    });

    saveSuggestions(normalized);
    if (chatbotSuggestionWrap) {
      chatWindow.appendChild(chatbotSuggestionWrap);
    }
  }

  function createHistoryEntry(role, content) {
    return {
      role,
      content: String(content || "").trim(),
      timestamp: new Date().toISOString(),
    };
  }

  function renderConversation() {
    chatWindow.innerHTML = "";
    state.history.forEach((message) => {
      chatWindow.appendChild(createMessageElement(message).root);
    });
    if (chatbotSuggestionWrap) {
      chatWindow.appendChild(chatbotSuggestionWrap);
    }
    scrollChatToBottom(true, "auto");
  }

  function createMessageElement(message, options = {}) {
    const role = message.role === "user" ? "user" : "assistant";
    const root = document.createElement("article");
    root.className = `chat-message chat-message--${role}`;

    if (options.streaming) {
      root.classList.add("is-streaming");
      root.classList.add("is-pending");
    }

    if (options.error) {
      root.classList.add("is-error");
    }

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "A" : "AI";

    const card = document.createElement("div");
    card.className = "message-card";

    const heading = document.createElement("div");
    heading.className = "message-heading";
    heading.textContent = role === "user" ? "Anda" : "AI Assistant";

    const content = document.createElement("div");
    content.className = "message-text";

    if (role === "assistant") {
      if (options.streaming) {
        content.textContent = options.previewText || "";
        content.dataset.streaming = "true";
      } else {
        content.innerHTML = sanitizeAssistantContent(message.content);
      }
    } else {
      content.textContent = message.content;
    }

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = options.meta || formatTime(message.timestamp);

    card.append(heading, content, meta);
    root.append(avatar, card);

    return { root, content, meta };
  }

  function appendMessage(message, options = {}) {
    const follow = options.forceScroll || isNearBottom(chatWindow);
    const messageElement = createMessageElement(message, options);
    chatWindow.appendChild(messageElement.root);
    scrollChatToBottom(follow, options.streaming ? "auto" : "smooth");
    return messageElement;
  }

  function setOpenState(isOpen) {
    if (isOpen && !state.isReady) {
      return;
    }

    state.isOpen = Boolean(isOpen);
    state.shouldStickToBottom = state.isOpen || state.shouldStickToBottom;
    chatbotContainer.classList.toggle("is-open", state.isOpen);
    openBtn.classList.toggle("is-hidden", state.isOpen);
    openBtn.setAttribute("aria-expanded", String(state.isOpen));

    if (state.isOpen) {
      scrollChatToBottom(true, "auto");
      window.setTimeout(() => chatInput.focus(), prefersReducedMotion ? 0 : 180);
    }
  }

  function setupVisibilityGate() {
    if (getPageId() !== "home") {
      setChatbotReady(true);
      return;
    }

    const introPreloader = document.getElementById("intro-preloader");
    const welcomeOverlay = document.getElementById("welcome-overlay");
    const observerTargets = [introPreloader, welcomeOverlay].filter(Boolean);

    const syncReadyState = () => {
      const introBlocking = Boolean(
        introPreloader && introPreloader.classList.contains("intro-active"),
      );
      const welcomeBlocking = Boolean(
        welcomeOverlay && !welcomeOverlay.classList.contains("hidden"),
      );

      setChatbotReady(!introBlocking && !welcomeBlocking);
    };

    syncReadyState();

    if (!observerTargets.length) {
      return;
    }

    const observer = new MutationObserver(syncReadyState);
    observerTargets.forEach((target) => {
      observer.observe(target, {
        attributes: true,
        attributeFilter: ["class", "style", "hidden"],
      });
    });

    window.addEventListener("load", syncReadyState, { once: true });
    window.setTimeout(syncReadyState, 1200);
  }

  function setChatbotReady(isReady) {
    state.isReady = Boolean(isReady);
    document.body.classList.toggle("chatbot-ready", state.isReady);

    if (!state.isReady) {
      state.isOpen = false;
      chatbotContainer.classList.remove("is-open");
      openBtn.classList.add("is-hidden");
      openBtn.setAttribute("aria-expanded", "false");
    } else {
      if (!state.isOpen) {
        openBtn.classList.remove("is-hidden");
      }
    }
  }

  function updateHeroVisibility() {
    if (chatbotHero) chatbotHero.classList.toggle("is-hidden", state.history.length > 0);
  }

  function updateStatus(text, mode) {
    chatbotStatus.textContent = DEFAULT_STATUS;
    chatbotStatusBadge.dataset.state = mode;
    chatbotStatusBadge.textContent =
      mode === "connecting"
        ? "Menghubungkan"
        : mode === "streaming"
          ? "Live"
          : mode === "error"
            ? "Gangguan"
            : "Online";
  }

  function updateComposerState(isBusy) {
    state.isSending = Boolean(isBusy);
    chatbotContainer.setAttribute("aria-busy", String(state.isSending));
    chatInput.disabled = state.isSending;
    sendBtn.disabled = state.isSending;
    sendBtnLabel.textContent = state.isSending ? "Memproses" : "Kirim";
    if (chatbotSuggestionWrap) {
      chatbotSuggestionWrap.style.display = state.isSending ? "none" : "flex";
    }
    chatbotSuggestions.querySelectorAll(".chat-suggestion-btn").forEach((button) => {
      button.disabled = state.isSending;
    });
  }

  function resizeChatInput() {
    chatInput.style.height = "0px";
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? "Baru saja"
      : date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  function isNearBottom(container) {
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 96
    );
  }

  function scrollChatToBottom(force, behavior) {
    if (!force && !state.shouldStickToBottom) {
      return;
    }

    const targetBehavior = prefersReducedMotion ? "auto" : behavior;

    if (typeof chatWindow.scrollTo === "function") {
      chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: targetBehavior,
      });
      return;
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function scheduleStreamingRender(streamState) {
    if (streamState.frameId) {
      return;
    }

    streamState.frameId = window.requestAnimationFrame(() => {
      streamState.content.textContent = buildStreamingPreview(streamState.raw);
      streamState.root.classList.remove("is-pending");
      scrollChatToBottom(false, "auto");
      streamState.frameId = 0;
    });
  }

  function buildStreamingPreview(text) {
    const plain = text
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|ul|ol|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>\n]*$/g, "")
      .replace(/<[^>]+>/g, "");

    return decodeEntities(plain).replace(/\n{3,}/g, "\n\n").trimStart();
  }

  function sanitizeAssistantContent(text) {
    const content = String(text || "").trim();

    if (!content) {
      return "";
    }

    if (!/<\/?[a-z][\s\S]*>/i.test(content)) {
      return formatPlainTextAsHtml(content);
    }

    const template = document.createElement("template");
    template.innerHTML = content;
    sanitizeFragment(template.content);
    return template.innerHTML.trim();
  }

  function sanitizeFragment(fragment) {
    const allowedTags = new Set([
      "A",
      "P",
      "UL",
      "OL",
      "LI",
      "BR",
      "STRONG",
      "EM",
      "B",
      "I",
      "CODE",
      "PRE",
      "SPAN",
    ]);
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
    const elements = [];

    while (walker.nextNode()) {
      elements.push(walker.currentNode);
    }

    elements.forEach((element) => {
      if (element.tagName === "SCRIPT" || element.tagName === "STYLE") {
        element.remove();
        return;
      }

      if (!allowedTags.has(element.tagName)) {
        unwrapElement(element);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();

        if (element.tagName === "A" && name === "href") {
          const href = sanitizeHref(attribute.value);

          if (href) {
            element.setAttribute("href", href);
          } else {
            element.removeAttribute("href");
          }

          return;
        }

        element.removeAttribute(attribute.name);
      });

      if (element.tagName === "A") {
        element.classList.add("chatbot-rich-link");

        if (isExternalHref(element.getAttribute("href") || "")) {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
  }

  function unwrapElement(element) {
    const parent = element.parentNode;

    if (!parent) {
      return;
    }

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }

    parent.removeChild(element);
  }

  function sanitizeHref(href) {
    const trimmed = String(href || "").trim();

    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed, window.location.origin);

      if (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:" ||
        parsed.protocol === "mailto:" ||
        parsed.protocol === "tel:"
      ) {
        return trimmed;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function isExternalHref(href) {
    try {
      return new URL(href, window.location.origin).origin !== window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function formatPlainTextAsHtml(text) {
    return text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.every((line) => /^- /.test(line))) {
          return `<ul>${lines
            .map((line) => `<li>${escapeHtml(line.replace(/^- /, ""))}</li>`)
            .join("")}</ul>`;
        }

        if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          return `<ol>${lines
            .map((line) =>
              `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`,
            )
            .join("")}</ol>`;
        }

        return `<p>${lines.map((line) => escapeHtml(line)).join("<br>")}</p>`;
      })
      .join("");
  }

  function stripHtml(text) {
    const template = document.createElement("template");
    template.innerHTML = String(text || "");
    return (template.content.textContent || "").replace(/\s+/g, " ").trim();
  }

  function decodeEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function streamAiResponse({ userQuestion, history, onStatus, onChunk }) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        userQuestion,
        history,
        stream: true,
      }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      let message = "Gagal menghubungi server.";

      if (contentType.includes("application/json")) {
        try {
          message = (await response.json()).error || message;
        } catch (error) {
          message = "Server mengembalikan respons error yang tidak valid.";
        }
      } else {
        try {
          message = (await response.text()) || message;
        } catch (error) {
          message = "Server chatbot tidak merespons dengan benar.";
        }
      }

      throw new Error(message);
    }

    if (!response.body || !contentType.includes("text/event-stream")) {
      let fallbackAnswer = "";

      try {
        fallbackAnswer = (await response.json()).answer || "";
      } catch (error) {
        fallbackAnswer = await response.text();
      }

      onChunk(fallbackAnswer);
      return fallbackAnswer;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamedAnswer = "";
    let finalAnswer = "";

    const processBlock = (block) => {
      const lines = block.split(/\r?\n/);
      let eventName = "message";
      const dataLines = [];

      lines.forEach((line) => {
        if (!line) {
          return;
        }

        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          return;
        }

        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      });

      if (!dataLines.length) {
        return;
      }

      let payload = null;

      try {
        payload = JSON.parse(dataLines.join("\n"));
      } catch (error) {
        return;
      }

      if (eventName === "status") {
        onStatus(payload.message || DEFAULT_STATUS, payload.state || "ready");
        return;
      }

      if (eventName === "chunk") {
        const chunk = payload.content || "";
        streamedAnswer += chunk;
        onChunk(chunk);
        return;
      }

      if (eventName === "done") {
        finalAnswer = payload.answer || streamedAnswer;
        return;
      }

      if (eventName === "error") {
        throw new Error(payload.error || "Streaming chatbot terputus.");
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      blocks.forEach((block) => processBlock(block));
    }

    if (buffer.trim()) {
      processBlock(buffer);
    }

    return finalAnswer || streamedAnswer;
  }

  async function handleSendMessage(forcedQuestion) {
    const question =
      typeof forcedQuestion === "string"
        ? forcedQuestion.trim()
        : chatInput.value.trim();

    if (!question || state.isSending) {
      return;
    }

    const historyForApi = state.history.slice(-API_HISTORY_LIMIT);
    const userMessage = createHistoryEntry("user", question);
    state.shouldStickToBottom = true;
    state.history = [...state.history, userMessage].slice(-HISTORY_LIMIT);
    saveHistory(state.history);
    appendMessage(userMessage, { forceScroll: true });
    updateHeroVisibility();
    chatInput.value = "";
    resizeChatInput();
    updateStatus("Menghubungkan ke AI assistant...", "connecting");
    updateComposerState(true);
    renderSuggestions(buildSuggestions(state.history));

    const streamMessage = appendMessage(createHistoryEntry("assistant", ""), {
      streaming: true,
      meta: "Menjawab secara real-time...",
      forceScroll: true,
    });
    const streamState = {
      ...streamMessage,
      raw: "",
      frameId: 0,
    };

    try {
      const finalAnswer = await streamAiResponse({
        userQuestion: question,
        history: historyForApi,
        onStatus: updateStatus,
        onChunk: (chunk) => {
          streamState.raw += chunk;
          scheduleStreamingRender(streamState);
        },
      });

      if (streamState.frameId) {
        window.cancelAnimationFrame(streamState.frameId);
        streamState.frameId = 0;
      }

      const resolvedAnswer = finalAnswer || streamState.raw;
      streamState.content.removeAttribute("data-streaming");
      streamState.content.innerHTML = sanitizeAssistantContent(resolvedAnswer);
      streamState.meta.textContent = formatTime(new Date().toISOString());
      streamState.root.classList.remove("is-streaming");

      state.history = [
        ...state.history,
        createHistoryEntry("assistant", resolvedAnswer),
      ].slice(-HISTORY_LIMIT);
      saveHistory(state.history);
      renderSuggestions(buildSuggestions(state.history));
      updateStatus(DEFAULT_STATUS, "ready");
      scrollChatToBottom(false, "smooth");
    } catch (error) {
      if (streamState.frameId) {
        window.cancelAnimationFrame(streamState.frameId);
        streamState.frameId = 0;
      }

      streamState.root.classList.remove("is-streaming");
      streamState.root.classList.add("is-error");
      streamState.content.removeAttribute("data-streaming");
      streamState.content.innerHTML = formatPlainTextAsHtml(
        error.message ||
        "Maaf, koneksi ke server sedang bermasalah. Silakan coba lagi.",
      );
      streamState.meta.textContent = "Perlu dicoba lagi";

      renderSuggestions(
        uniqueSuggestions([question, ...buildSuggestions(state.history)]).slice(
          0,
          SUGGESTION_LIMIT,
        ),
      );
      updateStatus(
        "Koneksi chatbot terganggu. Anda bisa mencoba lagi dalam beberapa saat.",
        "error",
      );
    } finally {
      updateComposerState(false);
      resizeChatInput();

      if (state.isOpen) {
        chatInput.focus();
      }
    }
  }
});
