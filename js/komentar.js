// File: js/komentar.js (Dengan Integrasi Modal Identitas)

const KomentarApp = (() => {
  const firebaseConfig = {
    apiKey: "AIzaSyA_SYgK13vSvwvOr6qVfbHMmYAHEIzTU7A",
    authDomain: "karang-taruna-banjarsari.firebaseapp.com",
    databaseURL:
      "https://karang-taruna-banjarsari-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "karang-taruna-banjarsari",
    storageBucket: "karang-taruna-banjarsari.firebasestorage.app",
    messagingSenderId: "802982045794",
    appId: "1:802982045794:web:953482fd61e2255a1c093b",
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();

  // --- FUNGSI DIPERBARUI: getPageId menjadi lebih cerdas ---
  const getPageId = () => {
    const path = window.location.pathname;
    // Cek jika ini adalah halaman artikel
    if (path.includes("artikel.html")) {
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get("slug");
      if (slug) {
        // Gunakan slug sebagai ID unik, bersihkan karakter tidak valid
        return slug.replace(/[^a-zA-Z0-9]/g, "_");
      }
    }
    // Fallback untuk halaman lain (home, kontak, dll)
    return path.replace(/[^a-zA-Z0-9]/g, "_");
  };

  const formatWaktuRelatif = (timestamp) => {
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp) / 1000;

    if (secondsPast < 60) return "baru saja";
    if (secondsPast < 3600)
      return `${Math.round(secondsPast / 60)} menit yang lalu`;
    if (secondsPast <= 86400)
      return `${Math.round(secondsPast / 3600)} jam yang lalu`;
    if (secondsPast <= 604800)
      return `${Math.round(secondsPast / 86400)} hari yang lalu`;

    const date = new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderKomentar = () => {
    const pageId = getPageId();
    const komentarDbRef = db.ref(`komentar/${pageId}`);
    const container = document.getElementById("comment-list-container");
    const counter = document.getElementById("comment-count");

    if (!container) return;

    komentarDbRef.on("value", (snapshot) => {
      container.innerHTML = "";
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (counter) counter.textContent = Object.keys(data).length;

        const komentarArray = Object.values(data).sort(
          (a, b) => b.timestamp - a.timestamp
        );

        komentarArray.forEach((comment) => {
          container.innerHTML += createKomentarTemplate(comment);
        });
      } else {
        if (counter) counter.textContent = "0";
        container.innerHTML =
          "<p style='font-size:0.9em; color:var(--dark-text);'>Jadilah yang pertama berkomentar!</p>";
      }
      App.initScrollAnimations();
    });
  };

  const createKomentarTemplate = (item) => {
    const namaPengirim = item.nama ? item.nama.trim() : "Anonim";
    const inisial = namaPengirim.charAt(0).toUpperCase();
    const tanggal = formatWaktuRelatif(item.timestamp);

    const escapeHtml = (unsafe) => {
      if (!unsafe) return "";
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    return `
            <div class="comment-item animate-on-scroll">
                <div class="comment-avatar">${escapeHtml(inisial)}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">@${escapeHtml(
                          namaPengirim
                        )}</span>
                        <span class="comment-date">${tanggal}</span>
                    </div>
                    <p class="comment-body">${escapeHtml(item.pesan)}</p>
                </div>
            </div>
        `;
  };

  const handleFormInteraction = () => {
    const form = document.getElementById("comment-form-element");
    if (!form) return;

    const textarea = form.querySelector("#comment-pesan");
    const actions = form.querySelector(".comment-actions");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = form.querySelector(".comment-submit-btn");
      const pesanInput = textarea;

      if (!pesanInput.value.trim()) {
        alert("Komentar tidak boleh kosong.");
        return;
      }

      try {
        // PANGGIL MODAL UNTUK MEMINTA IDENTITAS
        const user = await App.InteractionManager.requestIdentity(
          "berkomentar"
        );
        if (!user) return; // Pengguna membatalkan

        const pageId = getPageId();
        const komentarDbRef = db.ref(`komentar/${pageId}`);

        const dataToSend = {
          nama: user.displayName, // Gunakan nama dari modal
          pesan: pesanInput.value.trim(),
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        };

        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";

        komentarDbRef
          .push(dataToSend)
          .then(() => {
            form.reset();
          })
          .catch((error) => {
            console.error("Firebase Error:", error);
            alert("Gagal mengirim komentar. Silakan coba lagi.");
          })
          .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = "Kirim";
          });
      } catch (error) {
        console.log("Interaksi dibatalkan oleh pengguna.");
      }
    });

    // Tampilkan 'actions' dan sembunyikan input nama lama
    if (actions) {
      actions.style.display = "flex";
      const namaInput = form.querySelector("#comment-nama");
      if (namaInput) namaInput.style.display = "none";
    }
  };

  const init = () => {
    if (document.getElementById("comment-section-container")) {
      renderKomentar();
      handleFormInteraction();
    }
  };

  return { init: init };
})();

document.addEventListener("DOMContentLoaded", KomentarApp.init);
