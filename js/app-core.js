/**
 * @file app-core.js
 * @description Script inti untuk fungsionalitas website. Mengelola state, komponen, dan inisialisasi dasar.
 * @version 9.0.0 (Perbaikan & Peningkatan Fitur E-commerce)
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
  };

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
    const overlay = document.getElementById("welcome-overlay");
    if (!overlay) return;

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

    const isIndexPage =
      window.location.pathname.endsWith("/") ||
      window.location.pathname.includes("index.html");

    if (sessionStorage.getItem("isLoggedIn")) {
      overlay.classList.add("hidden");
      startInactivityTracker();
    } else if (isIndexPage) {
      overlay.classList.remove("hidden");
    } else {
      logoutUser();
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
                        <img src="foto/ChatGPTlogokarangtaruna.png" alt="Logo Karang Taruna Banjarsari" />
                        <div class="logo-text">
                            <div class="logo-main-text">Karang Taruna Banjarsari</div>
                        </div>
                    </a>
                </div>
                <div class="mobile-header-actions">
                    <a href="keranjang.html" id="keranjang-belanja-mobile" class="cart-icon-wrapper" aria-label="Keranjang Belanja">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-badge hidden">0</span>
                    </a>
                </div>
            </div>
        `;
      document.body.prepend(mobileHeader);
    }

    loadComponent("layout/header.html", "main-header", setActiveNavLink);
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

    const pageId = document.body.dataset.pageId;
    if (pageId && typeof App.initializers[pageId] === "function") {
      App.initializers[pageId]();
    }

    updateCartBadge();
  };

  return {
    init: initPage,
    fetchData,
    renderItems,
    initScrollAnimations,
    getCart,
    addToCart,
    updateCartBadge,
    cache,
    initializers: {},
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
