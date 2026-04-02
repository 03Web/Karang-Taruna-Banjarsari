// File: js/chatbot_sederhana.js (Versi AMAN dan SIMPEL)

document.addEventListener("DOMContentLoaded", () => {
  // Tidak ada lagi API Key di sini!
  const API_URL = "/api/chat"; // Ini adalah alamat "penengah" yang kita buat tadi

  // --- Ambil elemen-elemen dari HTML ---
  const sendBtn = document.getElementById("send-chat-btn");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");
  const openBtn = document.getElementById("open-chatbot-btn");
  const closeBtn = document.getElementById("close-chatbot");
  const chatbotContainer = document.getElementById("chatbot-container");

  // --- Validasi semua elemen required ---
  if (!sendBtn || !chatInput || !chatWindow || !openBtn || !closeBtn || !chatbotContainer) {
    console.warn("Chatbot elements not found on this page. Skipping initialization.");
    return;
  }

  // --- Fungsi untuk mendapatkan riwayat chat dari localStorage ---
  function getChatHistory() {
    try {
      const history = localStorage.getItem("chatbotHistory");
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error("Error reading chat history:", e);
      return [];
    }
  }

  // --- Fungsi untuk menyimpan riwayat chat ke localStorage ---
  function saveChatHistory(history) {
    try {
      // Batasi maksimal 30 item terakhir (15 tanya + 15 jawab)
      const limitedHistory = history.slice(-30);
      localStorage.setItem("chatbotHistory", JSON.stringify(limitedHistory));
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  }

  // --- Fungsi untuk menambahkan pesan ke jendela chat ---
  function addMessageToWindow(message, className, isLoading = false) {
    const messageDiv = document.createElement("div");
    if (isLoading) {
      messageDiv.id = "loading-indicator";
      messageDiv.className = "bot-message";
      messageDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    } else {
      messageDiv.className = className;
      messageDiv.innerHTML = message;
    }
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // --- Fungsi untuk memuat dan menampilkan riwayat chat ---
  function loadAndDisplayChatHistory() {
    try {
      const history = getChatHistory();
      history.forEach((msg) => {
        const className = msg.role === "user" ? "user-message" : "bot-message";
        addMessageToWindow(msg.content, className);
      });
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  }

  // --- Fungsi yang sudah diubah dengan support history ---
  async function getAiResponse(userQuestion, history) {
    if (typeof KNOWLEDGE_BASE === "undefined") {
      return "Error: Basis pengetahuan tidak dapat dimuat.";
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: userQuestion,
          knowledgeBase: KNOWLEDGE_BASE,
          history: history,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return `Maaf, terjadi kesalahan: ${
          data.error || "Gagal menghubungi server."
        }`;
      }
      return data.answer;
    } catch (error) {
      return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    }
  }

  // --- Fungsi untuk menangani pengiriman pesan dengan history ---
  const handleSendMessage = async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    // Ambil history dari localStorage
    let history = getChatHistory();

    // Tambahkan pesan user ke history
    history.push({ role: "user", content: question });

    // Tampilkan pesan user di chat window
    addMessageToWindow(question, "user-message");
    chatInput.value = "";

    // Tampilkan indikator loading
    addMessageToWindow("", "bot-message", true);

    // Kirim request ke API dengan history
    const answer = await getAiResponse(question, history);

    // Hapus indikator loading
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Tampilkan jawaban bot
    addMessageToWindow(answer, "bot-message");

    // Tambahkan jawaban bot ke history dan simpan ke localStorage
    history.push({ role: "model", content: answer });
    saveChatHistory(history);
  };

  // --- Fungsi buka/tutup ---
  openBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "flex";
    openBtn.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    chatbotContainer.style.display = "none";
    openBtn.style.display = "block";
  });

  // --- Event listeners ---
  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });

  // Muat dan tampilkan riwayat chat yang tersimpan di localStorage saat halaman dimuat
  loadAndDisplayChatHistory();
});