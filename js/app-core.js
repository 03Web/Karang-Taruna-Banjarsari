/**
 * @file app-core.js
 * @description Script inti dengan UI pencarian slide-down minimalis, feedback, dan reaksi.
 * @version 14.0.1 (Perbaikan Pencatatan Identitas pada Reaksi)
 */

const App = (() => {
  // === STATE & CACHE ===
  const cache = new Map();
  const state = {
    kegiatan: [],
    galeri: {},
    informasi: [],
    pengurus: [],
    kontak: [],
    lastScrollTop: 0,
    currentUser: {
      // State baru untuk identitas pengguna
      identity: "anonim", // 'anonim', 'warga', 'custom'
      displayName: "Anonim",
    },
  };

  // =======================================================
  // === BAGIAN BARU: INTERACTION & IDENTITY MANAGER ===
  // =======================================================
  const InteractionManager = (() => {
    let interactionPromise = null;

    function showIdentityModal(actionName = "berinteraksi") {
      const modal = document.getElementById("identity-modal");
      if (!modal) return;

      // Set judul modal sesuai aksi
      modal.querySelector(
        "#identity-modal-title"
      ).textContent = `Anda perlu memilih identitas untuk ${actionName}`;

      // Ambil data dari localStorage
      const savedUser = JSON.parse(localStorage.getItem("karangTarunaUser"));
      const nameInput = modal.querySelector("#identity-custom-name");
      const identitySelect = modal.querySelector("#identity-selector");

      if (savedUser && savedUser.displayName) {
        // Jika ada nama tersimpan, tambahkan sebagai pilihan
        let savedOption = identitySelect.querySelector('option[value="saved"]');
        if (!savedOption) {
          savedOption = document.createElement("option");
          savedOption.value = "saved";
          identitySelect.insertBefore(savedOption, identitySelect.options[1]);
        }
        savedOption.textContent = `Lanjutkan sebagai: ${savedUser.displayName}`;
        identitySelect.value = "saved";
        nameInput.style.display = "none";
      } else {
        // Hapus opsi "saved" jika tidak ada nama
        identitySelect.querySelector('option[value="saved"]')?.remove();
        identitySelect.value = "warga"; // Default ke warga
      }

      modal.classList.add("visible");

      // Buat promise baru yang akan di-resolve saat pengguna memilih
      return new Promise((resolve) => {
        interactionPromise = { resolve };
      });
    }

    function handleIdentitySelection() {
      const modal = document.getElementById("identity-modal");
      if (!modal || !interactionPromise) return;

      const identitySelect = modal.querySelector("#identity-selector");
      const nameInput = modal.querySelector("#identity-custom-name");
      const selectedValue = identitySelect.value;
      let user;

      if (selectedValue === "custom" && !nameInput.value.trim()) {
        alert("Harap masukkan nama Anda.");
        return;
      }

      switch (selectedValue) {
        case "custom":
          user = {
            identity: "custom",
            displayName: nameInput.value.trim(),
          };
          break;
        case "warga":
          user = {
            identity: "warga",
            displayName: "Warga Banjarsari",
          };
          break;
        case "saved":
          user = JSON.parse(localStorage.getItem("karangTarunaUser"));
          break;
        default: // anonim
          user = {
            identity: "anonim",
            displayName: "Anonim",
          };
      }

      // Simpan pilihan (kecuali anonim) ke localStorage
      if (user.identity !== "anonim") {
        localStorage.setItem("karangTarunaUser", JSON.stringify(user));
      }

      App.state.currentUser = user; // Update state global
      interactionPromise.resolve(user); // Resolve promise dengan data user
      closeModal();
    }

    function closeModal() {
      const modal = document.getElementById("identity-modal");
      if (modal) modal.classList.remove("visible");
      if (interactionPromise) {
        interactionPromise.resolve(null); // Resolve dengan null jika ditutup
        interactionPromise = null;
      }
    }

    function init() {
      // Cek apakah modal sudah ada, jika belum, buat
      if (!document.getElementById("identity-modal")) {
        const modalHTML = `
          <div id="identity-modal">
            <div class="identity-modal-content">
              <span class="modal-close-btn" id="identity-modal-close-btn">&times;</span>
              <i class="fas fa-user-check modal-icon"></i>
              <h2 id="identity-modal-title">Pilih Identitas Anda</h2>
              <p>Pilih bagaimana Anda ingin dikenal saat berinteraksi di website ini.</p>
              <div class="identity-form-group">
                <select id="identity-selector">
                  <option value="warga">Sebagai Warga Banjarsari</option>
                  <option value="anonim">Sebagai Anonim</option>
                  <option value="custom">Gunakan nama lain...</option>
                </select>
                <input type="text" id="identity-custom-name" placeholder="Masukkan nama Anda..." style="display:none; margin-top:10px;">
              </div>
              <div class="modal-actions">
                <button id="identity-confirm-btn" class="btn btn-primary">Konfirmasi</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
      }

      // Tambahkan event listeners
      document
        .getElementById("identity-confirm-btn")
        .addEventListener("click", handleIdentitySelection);
      document
        .getElementById("identity-modal-close-btn")
        .addEventListener("click", closeModal);
      document
        .getElementById("identity-selector")
        .addEventListener("change", (e) => {
          const nameInput = document.getElementById("identity-custom-name");
          nameInput.style.display =
            e.target.value === "custom" ? "block" : "none";
        });
    }

    return {
      init,
      requestIdentity: showIdentityModal,
    };
  })();

  // === FUNGSI INTI UNTUK REAKSI (LIKE/DISLIKE) - [DIPERBAIKI] ===
  const handleReaction = async (contentId, type) => {
    const votedKey = `voted_${contentId}`;
    if (localStorage.getItem(votedKey)) {
      showNotification(
        "Anda sudah memberikan reaksi untuk konten ini.",
        "info"
      );
      return;
    }

    try {
      // MINTA IDENTITAS DULU
      const user = await InteractionManager.requestIdentity("memberi reaksi");
      if (!user) return; // Pengguna membatalkan atau menutup modal

      // [PERBAIKAN] Referensi ke counter dan log
      const countRef = firebase
        .database()
        .ref(`reactions/${contentId}/${type}s_count`);
      const logRef = firebase.database().ref(`reactions/${contentId}/log`);

      // [PERBAIKAN] Jalankan transaksi untuk counter
      countRef
        .transaction((currentCount) => {
          return (currentCount || 0) + 1;
        })
        .then(() => {
          // [BARU] Simpan log identitas setelah transaksi berhasil
          logRef.push({
            displayName: user.displayName,
            identity: user.identity,
            type: type,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
          });

          localStorage.setItem(votedKey, type);
          updateReactionUI(contentId);
          showNotification("Terima kasih atas reaksi Anda!", "success");
        })
        .catch((error) => {
          console.error("Firebase transaction failed: ", error);
          showNotification("Gagal memberikan reaksi. Coba lagi.", "error");
        });
    } catch (e) {
      console.log("Interaksi dibatalkan", e);
    }
  };

  // === FUNGSI UPDATE UI REAKSI - [DIPERBAIKI] ===
  const updateReactionUI = (contentId) => {
    const votedKey = `voted_${contentId}`;
    const userVote = localStorage.getItem(votedKey);
    const elements = document.querySelectorAll(
      `[data-content-id="${contentId}"]`
    );

    elements.forEach((container) => {
      const likeBtn = container.querySelector(".like-btn");
      const dislikeBtn = container.querySelector(".dislike-btn");
      const likeCountSpan = container.querySelector(".like-count");
      const dislikeCountSpan = container.querySelector(".dislike-count");

      if (!likeBtn || !dislikeBtn) return;

      // [PERBAIKAN] Baca dari path yang baru
      firebase
        .database()
        .ref(`reactions/${contentId}`)
        .once("value", (snapshot) => {
          const data = snapshot.val() || { likes_count: 0, dislikes_count: 0 };
          if (likeCountSpan) likeCountSpan.textContent = data.likes_count || 0;
          if (dislikeCountSpan)
            dislikeCountSpan.textContent = data.dislikes_count || 0;

          if (userVote) {
            likeBtn.disabled = true;
            dislikeBtn.disabled = true;
            likeBtn.classList.remove("liked", "disliked");
            dislikeBtn.classList.remove("liked", "disliked");
            if (userVote === "like") {
              likeBtn.classList.add("liked");
            } else if (userVote === "dislike") {
              dislikeBtn.classList.add("disliked");
            }
          }
        });
    });
  };

  const setupReactionListeners = () => {
    document.body.addEventListener("click", (e) => {
      const likeBtn = e.target.closest(".like-btn");
      const dislikeBtn = e.target.closest(".dislike-btn");

      if (likeBtn && !likeBtn.disabled) {
        const container = likeBtn.closest("[data-content-id]");
        if (container) handleReaction(container.dataset.contentId, "like");
      }

      if (dislikeBtn && !dislikeBtn.disabled) {
        const container = dislikeBtn.closest("[data-content-id]");
        if (container) handleReaction(container.dataset.contentId, "dislike");
      }
    });
  };

  // --- SISA KODE app-core.js ANDA TETAP SAMA, TIDAK ADA PERUBAHAN ---
  // ... (Kode untuk Inaktivitas, Modal Kontribusi, Welcome Screen, Header, Utilities, dll) ...

  // === PENGATURAN SESI & INAKTIVITAS ===
  const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 menit
  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutUser, TIMEOUT_DURATION);
    sessionStorage.setItem("lastActivityTimestamp", Date.now());
  }

  function startInactivityTracker() {
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();
  }

  function logoutUser() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("lastActivityTimestamp");
    window.location.href = "index.html";
  }

  // === MODAL KONTRIBUSI ===
  async function showContributionModal() {
    const modal = document.getElementById("contribution-modal");
    if (!modal) return;

    const kontakData = await fetchData("kontak", "data/kontak.json");
    const admin = kontakData.find((k) => k.jabatan === "Admin Website");

    if (!admin) {
      console.error("Data admin website tidak ditemukan!");
      return;
    }

    const yesBtn = document.getElementById("contribute-yes-btn");
    const noBtn = document.getElementById("contribute-no-btn");
    const closeBtn = modal.querySelector(".modal-close-btn");

    const closeModal = () => {
      const welcomeOverlay = document.getElementById("welcome-overlay");
      modal.classList.add("hidden");
      if (welcomeOverlay) welcomeOverlay.classList.add("hidden");
      startInactivityTracker();
    };

    yesBtn.onclick = () => {
      const waLink = `https://wa.me/${admin.whatsapp}?text=${encodeURIComponent(
        "Halo Admin, saya tertarik untuk berkontribusi dalam pengembangan web Karang Taruna Banjarsari."
      )}`;
      window.open(waLink, "_blank");
      closeModal();
    };

    noBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;

    modal.classList.remove("hidden");
  }

  // === LAYAR SELAMAT DATANG (WELCOME SCREEN) ===
  function initWelcomeScreen() {
    const LOGIN_FORM_ENABLED = false;

    const overlay = document.getElementById("welcome-overlay");
    if (!overlay) return;

    const isIndexPage =
      window.location.pathname.endsWith("/") ||
      window.location.pathname.includes("index.html");

    if (sessionStorage.getItem("isLoggedIn")) {
      overlay.classList.add("hidden");
      startInactivityTracker();
      return;
    }

    if (!isIndexPage) {
      logoutUser();
      return;
    }

    if (!LOGIN_FORM_ENABLED) {
      sessionStorage.setItem("isLoggedIn", "true");
      showContributionModal();
    } else {
      overlay.classList.remove("hidden");

      const uname = document.querySelector("#uname");
      const isBanjarsari = document.querySelector("#is_banjarsari");
      const btnContainer = document.querySelector(".btn-container");
      const btn = document.querySelector("#login-btn");
      const form = document.querySelector("#welcome-form");
      const msg = document.querySelector(".msg");

      if (!uname || !isBanjarsari || !btn || !form || !msg) return;

      btn.disabled = true;

      function shiftButton() {
        if (btn.disabled) {
          const positions = [
            "shift-left",
            "shift-top",
            "shift-right",
            "shift-bottom",
          ];
          const currentPosition = positions.find((dir) =>
            btn.classList.contains(dir)
          );
          const nextPosition =
            positions[
              (positions.indexOf(currentPosition) + 1) % positions.length
            ];
          btn.classList.remove(currentPosition || "no-shift");
          btn.classList.add(nextPosition);
        }
      }

      function showMsg() {
        const isEmpty = uname.value === "" || isBanjarsari.value === "";
        btn.classList.toggle("no-shift", !isEmpty);

        if (isEmpty) {
          btn.disabled = true;
          msg.style.color = "rgb(218 49 49)";
          msg.innerText =
            "Untuk Masuk Web Pastikan Semua Form Terisi⚠!! Terserah Mau di Isi Apa Saja Bebas.";
        } else {
          msg.innerText =
            "TERIMAKASIH🙏, Sekarang Anda Bisa Masuk Web Karang Taruna Banjarsari.";
          msg.style.color = "#92ff92";
          btn.disabled = false;
          btn.classList.add("no-shift");
        }
      }

      btnContainer.addEventListener("mouseover", shiftButton);
      form.addEventListener("input", showMsg);

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (btn.disabled) return;

        msg.innerText = "Processing...";
        msg.style.color = "#92ff92";
        btn.value = "Mengirim...";
        btn.disabled = true;

        const formData = new FormData(form);
        const FORMSPREE_URL = "https://formspree.io/f/myzpjnqg";

        try {
          const response = await fetch(FORMSPREE_URL, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
            },
          });

          if (response.ok) {
            sessionStorage.setItem("isLoggedIn", "true");
            showContributionModal();
          } else {
            throw new Error("Gagal mengirim data.");
          }
        } catch (error) {
          console.error("Formspree error:", error);
          msg.innerText = "Gagal mengirim data. Silakan coba lagi.";
          msg.style.color = "rgb(218 49 49)";
          btn.value = "Login";
          btn.disabled = false;
        }
      });
    }
  }

  // === FUNGSI HEADER MOBILE ===
  function handleMobileHeaderScroll() {
    const topHeader = document.querySelector(".mobile-top-header");
    if (!topHeader) return;

    let currentScroll =
      window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > state.lastScrollTop && currentScroll > 50) {
      topHeader.classList.add("hidden");
    } else {
      topHeader.classList.remove("hidden");
    }
    state.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  // === UTILITIES & FUNGSI BERSAMA ===
  const loadComponent = async (url, elementId, callback) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      if (cache.has(url)) {
        element.innerHTML = cache.get(url);
      } else {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Gagal memuat ${url}: Status ${response.status}`);
        const content = await response.text();
        cache.set(url, content);
        element.innerHTML = content;
      }
      if (callback) callback();
    } catch (error) {
      console.error(error);
      element.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat komponen.</p>`;
    }
  };

  const fetchData = async (key, url) => {
    if (
      state[key] &&
      (state[key].length > 0 || Object.keys(state[key]).length > 0)
    ) {
      return state[key];
    }
    try {
      if (cache.has(url)) {
        state[key] = cache.get(url);
        return state[key];
      }
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      cache.set(url, data);
      state[key] = data;
      return data;
    } catch (error) {
      console.error(`Gagal memuat data dari ${url}:`, error);
      return null;
    }
  };

  const renderItems = (container, items, templateFn, errorMessage) => {
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = `<p>${errorMessage}</p>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const element = document.createElement("div");
      element.innerHTML = templateFn(item);
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
    });
    container.innerHTML = "";
    container.appendChild(fragment);
    initScrollAnimations();
  };

  const initScrollAnimations = () => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document
      .querySelectorAll(".animate-on-scroll:not(.visible)")
      .forEach((el) => observer.observe(el));
  };

  function setActiveNavLink() {
    const currentLocation =
      window.location.pathname.split("/").pop() || "index.html";
    const navContainer = document.querySelector("nav ul");
    if (!navContainer) return;
    let activeLinkElement = null;
    navContainer.querySelectorAll("a").forEach((link) => {
      const parentLi = link.parentElement;
      const linkPath = link.getAttribute("href");
      parentLi.classList.remove("active");
      const isCurrentPage = linkPath === currentLocation;
      const isArtikelPageAndKegiatanLink =
        (currentLocation === "artikel.html" ||
          currentLocation === "detail-produk.html") &&
        (linkPath === "kegiatan.html" || linkPath === "toko.html");
      if (isCurrentPage || isArtikelPageAndKegiatanLink) {
        parentLi.classList.add("active");
        activeLinkElement = parentLi;
      }
    });
    if (activeLinkElement && window.innerWidth <= 768) {
      const scrollLeftPosition =
        activeLinkElement.offsetLeft -
        navContainer.offsetWidth / 2 +
        activeLinkElement.offsetWidth / 2;
      navContainer.scrollTo({ left: scrollLeftPosition, behavior: "smooth" });
    }
  }

  function initParticles() {
    if (typeof tsParticles === "undefined") {
      console.warn(
        "tsParticles library not loaded. Skipping particle initialization."
      );
      return;
    }

    tsParticles.load("particles-js", {
      background: {
        color: "#000000",
      },
      particles: {
        number: {
          value: 50,
        },
        color: {
          value: "#ffffff",
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
        },
        size: {
          value: { min: 1, max: 2 },
        },
        move: {
          enable: false,
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1,
          },
        },
      },
      interactivity: {
        enable: false,
      },
      retina_detect: true,
    });
  }

  // === FUNGSI E-COMMERCE (TERPUSAT) ===
  const getCart = () => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  };

  const addToCart = (productId, quantityToAdd) => {
    let cart = getCart();
    const itemIndex = cart.findIndex((item) => item.id === productId);

    if (itemIndex > -1) {
      cart[itemIndex].quantity += quantityToAdd;
    } else {
      cart.push({ id: productId, quantity: quantityToAdd });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    console.log("Keranjang diperbarui:", cart);
  };

  const updateCartBadge = () => {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach((badge) => {
      if (totalItems > 0) {
        badge.textContent = totalItems > 9 ? "9+" : totalItems;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    });
  };

  // --- FUNGSI BARU UNTUK PENGHITUNG PENGUNJUNG ---
  const initVisitorCounter = () => {
    const visitorDisplay = document.getElementById("visitor-count-display");
    if (!visitorDisplay) return; // Keluar jika elemen tidak ditemukan di halaman ini

    const db = firebase.database();
    const counterRef = db.ref("visitor_stats/total_visits");

    // Fungsi untuk memperbarui tampilan angka di layar
    const displayCount = () => {
      counterRef.on("value", (snapshot) => {
        const count = snapshot.val() || 0;
        // Kita format angkanya agar lebih mudah dibaca jika sudah ribuan
        const formattedCount = new Intl.NumberFormat("id-ID").format(count);
        visitorDisplay.textContent = `${formattedCount} Kunjungan`;
      });
    };

    // Fungsi untuk menambah hitungan (hanya dijalankan sekali per sesi)
    const incrementCount = () => {
      // Cek apakah pengunjung ini sudah dihitung di sesi ini
      if (sessionStorage.getItem("visitorCounted")) {
        return; // Jika sudah, jangan lakukan apa-apa
      }

      // Gunakan transaksi untuk mencegah race condition (jika ada 2 pengunjung bersamaan)
      counterRef.transaction((currentCount) => {
        return (currentCount || 0) + 1;
      });

      // Tandai bahwa pengunjung ini sudah dihitung untuk sesi ini
      sessionStorage.setItem("visitorCounted", "true");
    };

    incrementCount(); // Coba tambah hitungan
    displayCount(); // Selalu tampilkan hitungan
  };

  // === FUNGSI PENCARIAN (FINAL) ===
  function initSearch() {
    const desktopSearchBtn = document.getElementById("search-trigger-desktop");
    const searchModal = document.getElementById("search-modal");
    if (desktopSearchBtn && searchModal) {
      const closeModalBtn = document.getElementById("search-modal-close-btn");
      const searchForm = document.getElementById("search-form-modal");
      const searchInput = document.getElementById("search-input-modal");
      const suggestionsContainer =
        document.getElementById("search-suggestions");
      const openModal = () => {
        searchModal.classList.remove("hidden");
        setTimeout(() => searchInput.focus(), 100);
      };
      const closeModal = () => {
        searchModal.classList.add("hidden");
        searchInput.value = "";
        suggestionsContainer.style.display = "none";
      };
      desktopSearchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
      closeModalBtn.addEventListener("click", closeModal);
      searchModal.addEventListener("click", (e) => {
        if (e.target === searchModal) closeModal();
      });
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
      });
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
          suggestionsContainer.style.display = "none";
          return;
        }
        if (typeof SearchApp !== "undefined") {
          const results = SearchApp.search(query).slice(0, 5);
          if (results.length > 0) {
            suggestionsContainer.innerHTML = results
              .map(
                (item) =>
                  `<a href="${item.url}" class="suggestion-item"><span class="item-title">${item.title}</span><span class="item-type">${item.type}</span></a>`
              )
              .join("");
            suggestionsContainer.style.display = "block";
          } else {
            suggestionsContainer.style.display = "none";
          }
        }
      });
      document.addEventListener("click", (e) => {
        if (!searchForm.contains(e.target)) {
          suggestionsContainer.style.display = "none";
        }
      });
    }

    const mobileSearchBtn = document.getElementById("search-trigger-mobile");
    const searchPanel = document.getElementById("search-panel");
    if (mobileSearchBtn && searchPanel) {
      const closeBtn = document.getElementById("search-panel-close-btn");
      const searchInput = document.getElementById("search-panel-input");
      mobileSearchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        searchPanel.classList.toggle("active");
        if (searchPanel.classList.contains("active")) {
          searchInput.focus();
        }
      });
      closeBtn.addEventListener("click", () => {
        searchPanel.classList.remove("active");
      });
    }
  }

  // === FUNGSI BARU: MODAL FEEDBACK BERDASARKAN JUMLAH KUNJUNGAN HALAMAN ===
  const initExitFeedbackModal = () => {
    const TRIGGER_AFTER_X_PAGES = 4;

    if (sessionStorage.getItem("feedbackSubmitted")) {
      return;
    }

    let pageViews = parseInt(sessionStorage.getItem("pageViewCount") || "0");
    pageViews++;
    sessionStorage.setItem("pageViewCount", pageViews);

    if (
      pageViews < TRIGGER_AFTER_X_PAGES ||
      sessionStorage.getItem("feedbackModalShown")
    ) {
      return;
    }

    const modalHTML = `
      <div id="exit-feedback-modal">
        <div class="feedback-modal-content">
          <i class="fas fa-star modal-icon" style="font-size: 2.5em; color: var(--secondary-color); margin-bottom: 15px;"></i>
          <h2>Tunggu Sebentar!</h2>
          <p>Anda telah menjelajahi website kami. Kami sangat menghargai masukan Anda untuk pengembangan selanjutnya.</p>
          
          <form id="feedback-form">
            <div class="star-rating" id="feedback-star-rating">
              <i class="fas fa-star" data-value="1"></i>
              <i class="fas fa-star" data-value="2"></i>
              <i class="fas fa-star" data-value="3"></i>
              <i class="fas fa-star" data-value="4"></i>
              <i class="fas fa-star" data-value="5"></i>
            </div>
            <div class="form-group">
              <textarea id="feedback-text" placeholder="Ada masukan lain? (Opsional)"></textarea>
            </div>
            <div class="feedback-modal-actions">
              <button type="button" class="btn btn-secondary" id="close-feedback-btn">Lain Kali</button>
              <button type="submit" class="btn btn-primary" id="submit-feedback-btn">Kirim Masukan</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("exit-feedback-modal");
    const form = document.getElementById("feedback-form");
    const stars = document.querySelectorAll("#feedback-star-rating .fa-star");
    const closeBtn = document.getElementById("close-feedback-btn");
    const submitBtn = document.getElementById("submit-feedback-btn");
    let currentRating = 0;

    const showModal = () => {
      modal.classList.add("visible");
      sessionStorage.setItem("feedbackModalShown", "true");
    };

    const hideModal = () => {
      modal.classList.remove("visible");
    };

    showModal();

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        currentRating = parseInt(star.dataset.value);
        stars.forEach((s) => {
          s.classList.toggle(
            "selected",
            parseInt(s.dataset.value) <= currentRating
          );
        });
      });
    });

    closeBtn.addEventListener("click", hideModal);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (currentRating === 0) {
        alert("Mohon berikan rating bintang terlebih dahulu.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Mengirim...";

      const feedbackData = {
        rating: currentRating,
        masukan: document.getElementById("feedback-text").value.trim(),
        halaman: window.location.pathname,
        tanggal: new Date().toISOString(),
      };

      firebase
        .database()
        .ref("feedbackWebsite")
        .push(feedbackData)
        .then(() => {
          const content = modal.querySelector(".feedback-modal-content");
          content.innerHTML = `
            <i class="fas fa-check-circle modal-icon" style="font-size: 3em; color: #28a745;"></i>
            <h2>Terima Kasih!</h2>
            <p>Masukan Anda sangat berarti bagi kami.</p>
          `;
          sessionStorage.setItem("feedbackSubmitted", "true");
          setTimeout(hideModal, 2500);
        })
        .catch((error) => {
          console.error("Firebase Error:", error);
          alert("Gagal mengirim masukan. Silakan coba lagi.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Kirim Masukan";
        });
    });
  };

  // === INITIALIZER UTAMA ===
  const initPage = () => {
    const isIndexPage =
      window.location.pathname.endsWith("/") ||
      window.location.pathname.includes("index.html");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn && !isIndexPage) {
      logoutUser();
      return;
    }

    if (!document.querySelector(".mobile-top-header")) {
      const mobileHeader = document.createElement("header");
      mobileHeader.className = "mobile-top-header";
      mobileHeader.innerHTML = `
            <div class="mobile-header-container">
                <div class="logo">
                    <a href="index.html">
                        <img src="foto/ChatGPTlogokarangtaruna.png" alt="Logo Karang Taruna" />
                        <span class="logo-main-text">Karang Taruna Banjarsari</span>
                    </a>
                </div>
                <div class="mobile-header-actions">
                    <a href="#" id="search-trigger-mobile" aria-label="Cari">
                        <i class="fas fa-search"></i>
                    </a>
                    <a href="keranjang.html" id="keranjang-belanja-mobile" class="cart-icon-wrapper" aria-label="Keranjang">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-badge hidden">0</span>
                    </a>
                </div>
            </div>
        `;
      document.body.prepend(mobileHeader);
    }

    if (!document.getElementById("search-panel")) {
      const searchPanel = document.createElement("div");
      searchPanel.id = "search-panel";
      searchPanel.innerHTML = `
            <form action="search.html" method="GET" class="search-panel-form">
                <div style="position: relative; width: 100%;">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" name="q" id="search-panel-input" placeholder="Cari di seluruh website..." autocomplete="off">
                </div>
                <button type="button" id="search-panel-close-btn" aria-label="Tutup Pencarian">&times;</button>
            </form>
        `;
      document.body.prepend(searchPanel);
    }

    loadComponent("layout/header.html", "main-header", () => {
      setActiveNavLink();
      initSearch();
    });
    loadComponent("layout/footer.html", "main-footer");

    if (document.getElementById("welcome-overlay")) {
      initWelcomeScreen();
    } else if (isLoggedIn) {
      startInactivityTracker();
    }

    if (window.innerWidth <= 768) {
      window.addEventListener("scroll", handleMobileHeaderScroll, {
        passive: true,
      });
    }

    initScrollAnimations();
    if (document.getElementById("particles-js")) {
      setTimeout(initParticles, 500);
    }

    InteractionManager.init(); // PANGGIL INISIALISASI MANAGER DI SINI

    const pageId = document.body.dataset.pageId;
    if (pageId && typeof App.initializers[pageId] === "function") {
      App.initializers[pageId]();
    }

    updateCartBadge();
    initExitFeedbackModal();
    setupReactionListeners(); // Panggil fungsi listener reaksi
    initVisitorCounter(); // <-- INI PANGGILAN YANG BENAR
  };

  return {
    init: initPage,
    fetchData,
    renderItems,
    initScrollAnimations,
    getCart,
    addToCart,
    updateCartBadge,
    updateReactionUI,
    InteractionManager, // Ekspor InteractionManager
    cache,
    state, // Ekspor state agar bisa diakses
    initializers: {},
  };
})();

document.addEventListener("DOMContentLoaded", App.init);

// === SISTEM NOTIFIKASI GLOBAL ===
function showNotification(message, type = "success") {
  // Pastikan hanya ada satu notifikasi dalam satu waktu
  document.querySelector(".notification-banner")?.remove();

  const notification = document.createElement("div");
  notification.className = `notification-banner ${type}`;
  const iconClass = {
    success: "fa-check-circle",
    info: "fa-info-circle",
    error: "fa-exclamation-circle",
  };
  notification.innerHTML = `
    <i class="fas ${iconClass[type] || "fa-info-circle"}"></i>
    <span>${message}</span>
    <button class="notification-close-btn">&times;</button>
  `;
  document.body.appendChild(notification);
  notification
    .querySelector(".notification-close-btn")
    .addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 500);
    });
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("showPaymentSuccess") === "true") {
    sessionStorage.removeItem("showPaymentSuccess");
    showNotification("Pembayaran berhasil! Terima kasih telah berbelanja.");
  }
});
