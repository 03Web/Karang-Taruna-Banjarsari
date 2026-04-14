/**
 * @file page-initializers.js
 * @description Inisialisasi spesifik untuk setiap halaman Karang Taruna (UI Amazia).
 * @version Perbaikan 24-08-2025
 */

// === HOME PAGE INITIALIZER (PERBAIKAN FINAL DENGAN TIMEOUT) ===
App.initializers.home = async () => {
  // --- Inisialisasi Testimoni (Mengambil dari JSON) ---
  const wrapper = document.querySelector(".testimonial-carousel-wrapper");
  const testimonialContainer = document.getElementById(
    "testimonial-carousel-container"
  );
  const prevBtn = document.getElementById("testimonial-prev-btn");
  const nextBtn = document.getElementById("testimonial-next-btn");

  if (testimonialContainer && prevBtn && nextBtn) {
    const testimonialData = await App.fetchData(
      "testimonials",
      "data/testimonials.json"
    );

    if (testimonialData && testimonialData.length > 0) {
      const createTestimonialTemplate = (item) => `
      <div class="testimonial-card" data-content-id="${item.id}">
          <div class="testimonial-header">
            <img src="${item.avatar}" alt="Avatar ${item.name}" loading="lazy">
            <div class="testimonial-user">
              <div class="name">${item.name}</div>
              <div class="handle">${item.handle}</div>
            </div>
          </div>
          <div class="testimonial-body">
            <p data-fulltext="${item.text}"></p>
          </div>
         <div class="testimonial-footer">
            <div class="reaction-buttons">
                <button class="reaction-btn like-btn"><i class="fas fa-thumbs-up"></i> <span class="like-count">0</span></button>
                <button class="reaction-btn dislike-btn"><i class="fas fa-thumbs-down"></i> <span class="dislike-count">0</span></button>
            </div>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-x-twitter"></i> Lihat di X</a>
          </div>
        </div>
      `;

      testimonialContainer.innerHTML = testimonialData
        .map(createTestimonialTemplate)
        .join("");

      // Panggil fungsi update UI untuk setiap testimoni
      testimonialData.forEach((item) => App.updateReactionUI(item.id));

      // === LOGIKA CAROUSEL SEAMLESS INFINITE & DINAMIS ===
      setTimeout(() => {
        const carousel = testimonialContainer;
        let items = carousel.querySelectorAll(".testimonial-card");
        if (items.length <= 1) return;

        // 1. Gandakan elemen untuk efek infinite (Berputar tanpa ujung)
        // Kita gandakan sehingga cukup panjang untuk menutupi scroll
        const originalItems = Array.from(items);
        originalItems.forEach((item) => {
          const clone = item.cloneNode(true);
          carousel.appendChild(clone);
        });

        // Update items array dengan elemen yang baru digandakan
        items = carousel.querySelectorAll(".testimonial-card");
        const firstItem = items[0];

        // Memastikan scroll behavior adalah auto agar manipulasi JS halus
        carousel.style.scrollBehavior = "auto";
        // Hilangkan snap agar scroll kontinyu mulus
        carousel.style.scrollSnapType = "none";

        const initializeReadMore = () => {
          const charLimit = 150;

          items.forEach((card) => {
            const body = card.querySelector(".testimonial-body");
            const p = body.querySelector("p");
            if (!p) return;
            const fullText = p.getAttribute("data-fulltext");

            if (fullText && fullText.length > charLimit) {
              const shortText = fullText.substring(0, charLimit);
              p.innerHTML = `
                <span class="short-text">"${shortText}..."</span>
                <span class="full-text">"${fullText}"</span>
                <button class="read-more-btn">selengkapnya</button>
                <button class="read-less-btn" style="display:none; background:none; border:none; color:var(--primary-color); font-weight:bold; cursor:pointer; padding:0; margin-left:5px; font-family:'Poppins', sans-serif; font-size:0.95em;">tutup</button>
              `;

              const readMoreBtn = p.querySelector(".read-more-btn");
              const readLessBtn = p.querySelector(".read-less-btn");

              if (readMoreBtn && readLessBtn) {
                readMoreBtn.addEventListener("click", () => {
                  // Tutup card lain yang mungkin sedang terbuka
                  items.forEach((otherCard) => {
                    if (otherCard !== card) {
                      otherCard.querySelector(".testimonial-body").classList.remove("expanded");
                      const otherLess = otherCard.querySelector(".read-less-btn");
                      if (otherLess) otherLess.style.display = "none";
                    }
                  });
                  body.classList.add("expanded");
                  readLessBtn.style.display = "inline";
                });

                readLessBtn.addEventListener("click", () => {
                  body.classList.remove("expanded");
                  readLessBtn.style.display = "none";
                });
              }
            } else if (fullText) {
              p.innerHTML = `"${fullText}"`;
            }
          });
        };

        initializeReadMore();

        // 2. Animasi Scroll Konstan yang Sangat Mulus (RequestAnimationFrame)
        let isPaused = false;
        let scrollPos = 0;
        let animationFrameId;
        const speed = 0.8; // Kecepatan ideal: halus dan dinamis, tidak terlalu cepat

        const startSmoothScroll = () => {
          // Cari apakah ada card yang sedang dibuka (expanded)
          const hasExpandedCard = carousel.querySelector(".testimonial-body.expanded") !== null;

          // Animasi jalan jika tidak di-pause dan TIDAK ADA card yang sedang dibaca selengkapnya
          if (!isPaused && !hasExpandedCard) {
            scrollPos += speed;

            // Jarak satu set original (lebar total keseluruhan dibagi 2 karena kita gandakan 1x)
            const maxScroll = carousel.scrollWidth / 2;

            if (scrollPos >= maxScroll) {
              scrollPos -= maxScroll; // Reset tanpa disadari user (seamless)
            }

            carousel.scrollLeft = scrollPos;

            // Jika user secara manual men-scroll, sinkronisasi scrollPos agar tidak bentrok
            if (Math.abs(carousel.scrollLeft - Math.round(scrollPos)) > 2) {
              scrollPos = carousel.scrollLeft;
            }
          }
          animationFrameId = requestAnimationFrame(startSmoothScroll);
        };

        const stopSmoothScroll = () => {
          cancelAnimationFrame(animationFrameId);
        };

        // Mulai animasi
        startSmoothScroll();

        // 3. Interaksi Responsif: Berhenti saat disentuh / di-hover
        wrapper.addEventListener("mouseenter", () => isPaused = true);
        wrapper.addEventListener("mouseleave", () => {
          isPaused = false;
          // KITA HAPUS penutupan paksa expanded disini.
          // Biarkan user menutup manual pakai tombol "tutup" agar nyaman saat dibaca
        });

        // Touch support di HP (pause saat di tap/scroll)
        wrapper.addEventListener("touchstart", () => isPaused = true, { passive: true });
        wrapper.addEventListener("touchend", () => {
          // Beri jeda agak lama setelah jari dilepas sebelum jalan lagi otomatis
          setTimeout(() => { isPaused = false; }, 2500);
        });

        // 4. Integrasi Tombol Navigasi Manual
        const manualScroll = (direction) => {
          const scrollAmount = firstItem.offsetWidth + 25;
          scrollPos += direction * scrollAmount;

          // Animasi manual menggunakan behavior smooth dari browser API
          carousel.scrollTo({
            left: scrollPos,
            behavior: "smooth"
          });

          isPaused = true;
          clearTimeout(wrapper.resumeTimeout);
          wrapper.resumeTimeout = setTimeout(() => { isPaused = false; }, 3000);
        };

        nextBtn.addEventListener("click", () => manualScroll(1));
        prevBtn.addEventListener("click", () => manualScroll(-1));

      }, 150);
    } else {
      testimonialContainer.innerHTML =
        "<p>Gagal memuat testimoni atau data kosong.</p>";
    }
  }

  // --- Inisialisasi Kegiatan Terbaru ---
  const kegiatanContainer = document.getElementById("kegiatan-terbaru");
  if (kegiatanContainer) {
    const kegiatanData = await App.fetchData("kegiatan", "data/kegiatan.json");
    if (kegiatanData) {
      const sortedKegiatan = [...kegiatanData].sort(
        (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
      );
      const terbaru = sortedKegiatan.slice(0, 3);

      const createKegiatanTemplate = (item) => {
        const date = new Date(item.tanggal);
        const day = date.getDate();
        const month = date.toLocaleDateString("id-ID", { month: "short" });
        const fullDate = date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const kategori = item.kategori ? item.kategori.toLowerCase() : "";
        return `
        <article class="kegiatan-item">
          <div class="kegiatan-foto">
            <img src="${item.gambar}" alt="${item.alt_gambar || "Gambar Kegiatan " + item.judul}" loading="lazy">
            <div class="date-badge">
              <span class="day">${day}</span>
              <span class="month">${month}</span>
            </div>
          </div>
          <div class="kegiatan-konten">
            ${item.kategori ? `<span class="category-tag">${item.kategori}</span>` : ""}
            <h2>${item.judul}</h2>
            <p class="kegiatan-meta"><i class="fas fa-calendar-alt"></i> ${fullDate}</p>
            <a href="${item.link}" class="read-more-link">Baca Selengkapnya <i class="fas fa-arrow-right"></i></a>
          </div>
        </article>`;
      };
      App.renderItems(kegiatanContainer, terbaru, createKegiatanTemplate, "");
    } else {
      kegiatanContainer.innerHTML = "<p>Gagal memuat kegiatan.</p>";
    }
  }
};

// === KEGIATAN PAGE ===
App.initializers.kegiatan = async () => {
  const container = document.getElementById("kegiatan-list");
  const sorter = document.getElementById("kegiatan-sorter");
  const kategoriFilter = document.getElementById("kategori-filter");

  if (!container || !sorter || !kategoriFilter) return;

  const data = await App.fetchData("kegiatan", "data/kegiatan.json");
  if (!data) {
    container.innerHTML = "<p>Gagal memuat daftar kegiatan.</p>";
    return;
  }

  const createKegiatanTemplate = (item) => {
    const contentId =
      item.link.split("slug=")[1] ||
      `artikel_${new Date(item.tanggal).getTime()}`;
    return `
    <div class="kegiatan-card animate-on-scroll" data-content-id="${contentId}">
      <a href="${item.link
      }" class="kegiatan-link-wrapper" data-kategori="${item.kategori
      }" data-tanggal="${item.tanggal}">
        <div class="kegiatan-foto">
          <img src="${item.gambar}" alt="${item.alt_gambar || "Gambar " + item.judul
      }" loading="lazy">
        </div>
        <div class="kegiatan-konten">
          <h3>${item.judul}</h3>
          <span class="kegiatan-meta">${new Date(
        item.tanggal
      ).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}</span>
          <p>${item.deskripsi}</p>
          <span class="kegiatan-tombol">Baca Selengkapnya</span>
        </div>
      </a>
      <div class="reaction-buttons kegiatan-actions">
          <button class="reaction-btn like-btn"><i class="fas fa-thumbs-up"></i> <span class="like-count">0</span></button>
          <button class="reaction-btn dislike-btn"><i class="fas fa-thumbs-down"></i> <span class="dislike-count">0</span></button>
      </div>
    </div>
  `;
  };

  const renderKegiatan = () => {
    const sortOrder = sorter.value;
    const selectedKategori = kategoriFilter.value;

    const filteredData = data.filter(
      (item) =>
        selectedKategori === "semua" || item.kategori === selectedKategori
    );

    const sortedData = [...filteredData].sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      return sortOrder === "terbaru" ? dateB - dateA : dateA - dateB;
    });

    App.renderItems(
      container,
      sortedData,
      createKegiatanTemplate,
      "Tidak ada kegiatan yang cocok dengan filter Anda."
    );

    // Panggil update UI untuk setiap artikel
    sortedData.forEach((item) => {
      const contentId =
        item.link.split("slug=")[1] ||
        `artikel_${new Date(item.tanggal).getTime()}`;
      App.updateReactionUI(contentId);
    });
  };

  sorter.addEventListener("change", renderKegiatan);
  kategoriFilter.addEventListener("change", renderKegiatan);
  renderKegiatan();
};

// ... Sisa kode untuk `page-initializers.js` Anda yang lain tetap sama ...
// (Galeri, About, Kontak, Artikel)

// === GALERI PAGE (USING LIGHTGALLERY) ===
App.initializers.galeri = async () => {
  const data = await App.fetchData("galeri", "data/galeri.json");
  if (!data) return;

  const getDirectImageUrl = (url) => {
    if (!url) return '';
    const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  };

  const albumContainer = document.getElementById("album-grid");
  if (albumContainer && data.albumFoto) {
    const createAlbumTemplate = (album) => `
    <div class="album-item">
        <div class="album-cover" id="album-cover-${album.id}">
            <img src="${getDirectImageUrl(album.cover)}" alt="${album.alt_cover || "Cover album " + album.judul
      }" loading="lazy">
            <div class="album-info"><h4>${album.judul}</h4><p>${album.foto ? album.foto.length : 0} Foto</p></div>
            <div class="click-hint-animated">
                <i class="fas fa-hand-pointer"></i>
                <span>Buka Galeri</span>
            </div>
        </div>
        <div id="lightgallery-${album.id}" style="display:none;">
            ${album.foto
        .map(
          (foto) =>
            `<a href="${getDirectImageUrl(foto.src)}" data-sub-html="<h4>${foto.title || album.judul
            }</h4>" data-alt="${foto.alt || foto.title}">
                      <img src="${getDirectImageUrl(foto.src)}" alt="${foto.alt || foto.title}" />
                  </a>`
        )
        .join("")}
        </div>
    </div>`;

    albumContainer.innerHTML = `
      <div class="album-carousel-wrapper">
        <button class="carousel-nav prev" aria-label="Sebelumnya">&lt;</button>
        <div class="album-carousel">
          ${data.albumFoto.map(createAlbumTemplate).join("")}
        </div>
        <button class="carousel-nav next" aria-label="Selanjutnya">&gt;</button>
      </div>
    `;

    data.albumFoto.forEach((album) => {
      const cover = document.getElementById(`album-cover-${album.id}`);
      const gallery = document.getElementById(`lightgallery-${album.id}`);

      const lg = lightGallery(gallery, {
        plugins: [lgThumbnail],
        speed: 500,
        download: false,
        mobileSettings: {
          controls: true,
          showCloseIcon: true,
        },
      });

      cover.addEventListener("click", () => {
        lg.openGallery();
      });
    });

    const wrapper = albumContainer.querySelector(".album-carousel-wrapper");
    const carousel = wrapper.querySelector(".album-carousel");
    const prevBtn = wrapper.querySelector(".prev");
    const nextBtn = wrapper.querySelector(".next");
    let autoPlayInterval;

    const startAutoPlay = () => {
      autoPlayInterval = setInterval(() => {
        const firstItem = carousel.querySelector(".album-item");
        if (!firstItem) return;
        const scrollAmount = firstItem.offsetWidth + 25;
        const isAtEnd =
          carousel.scrollLeft + carousel.clientWidth >=
          carousel.scrollWidth - 1;
        if (isAtEnd) {
          carousel.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }, 3000);
    };
    const stopAutoPlay = () => clearInterval(autoPlayInterval);

    setTimeout(() => {
      const firstItem = carousel.querySelector(".album-item");
      if (!firstItem) return;
      const scrollAmount = firstItem.offsetWidth + 25;
      nextBtn.addEventListener("click", () =>
        carousel.scrollBy({ left: scrollAmount, behavior: "smooth" })
      );
      prevBtn.addEventListener("click", () =>
        carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      );
      wrapper.addEventListener("mouseenter", stopAutoPlay);
      wrapper.addEventListener("mouseleave", startAutoPlay);
      startAutoPlay();
    }, 100);
  }

  const videoContainer = document.getElementById("video-grid");
  if (videoContainer && data.dokumentasiVideo) {
    const createVideoTemplate = (video) => `
        <div class="gallery-item video-item animate-on-scroll" data-tanggal="${video.tanggal
      }">
            <iframe src="${video.src.replace("watch?v=", "embed/")}" title="${video.title
      }" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
        </div>`;
    const renderVideos = (items) =>
      App.renderItems(
        videoContainer,
        items,
        createVideoTemplate,
        "Gagal memuat video."
      );
    const sorter = document.getElementById("video-sorter");
    const updateVideos = () => {
      const sortedData = [...data.dokumentasiVideo].sort((a, b) =>
        sorter.value === "terbaru"
          ? new Date(b.tanggal) - new Date(a.tanggal)
          : new Date(a.tanggal) - new Date(b.tanggal)
      );
      renderVideos(sortedData);
    };
    sorter.addEventListener("change", updateVideos);
    updateVideos();
  }
};

// === ABOUT PAGE (STRUKTUR ORGANISASI) ===
App.initializers.about = async () => {
  const container = document.getElementById("pohon-organisasi-container");
  if (!container) return;
  const data = await App.fetchData("pengurus", "data/pengurus.json");
  if (!data) {
    container.innerHTML = "<p>Gagal memuat struktur organisasi.</p>";
    return;
  }
  const createNode = (jabatan, nama, fotoUrl, altText) => {
    const imageTag = fotoUrl
      ? `<img src="${fotoUrl}" alt="${altText || "Foto " + nama
      }" class="foto-node" loading="lazy">`
      : `<span class="foto-node foto-node-placeholder fas fa-user"></span>`;
    return `<div>${imageTag}<span class="jabatan">${jabatan}</span><span class="nama">${nama}</span></div>`;
  };
  const createBidangTitleNode = (namaBidang) =>
    `<div><span class="jabatan">${namaBidang}</span></div>`;

  container.innerHTML =
    '<ul class="pohon-organisasi" id="pohon-organisasi-chart"></ul>';
  const chart = document.getElementById("pohon-organisasi-chart");

  const { pengurusInti, bidang } = data;
  const ketua = pengurusInti.find((p) => p.jabatan === "Ketua");
  const sisaPengurusInti = pengurusInti.filter((p) => p.jabatan !== "Ketua");

  let chartContent = `<li>${createNode(
    ketua.jabatan,
    ketua.nama,
    ketua.foto,
    ketua.alt
  )}<ul>`;

  let pengurusIntiHtml = '<ul class="anggota-grid">';
  sisaPengurusInti.forEach((p) => {
    pengurusIntiHtml += `<li>${createNode(
      p.jabatan,
      p.nama,
      p.foto,
      p.alt
    )}</li>`;
  });
  pengurusIntiHtml += "</ul>";
  chartContent += `<li>${createBidangTitleNode(
    "Pengurus Inti"
  )}${pengurusIntiHtml}</li>`;

  bidang.forEach((b) => {
    let anggotaHtml = '<ul class="anggota-grid">';
    b.anggota.forEach((a) => {
      anggotaHtml += `<li>${createNode(a.jabatan, a.nama, a.foto, a.alt)}</li>`;
    });
    anggotaHtml += "</ul>";
    chartContent += `<li>${createBidangTitleNode(
      b.namaBidang
    )}${anggotaHtml}</li>`;
  });

  chartContent += `</ul></li>`;
  chart.innerHTML = chartContent;

  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomLevelDisplay = document.getElementById("zoom-level");
  let currentZoom = 1;
  const applyZoom = () => {
    chart.style.transform = `scale(${currentZoom})`;
    zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
  };
  zoomInBtn.addEventListener("click", () => {
    currentZoom = Math.min(2, currentZoom + 0.1);
    applyZoom();
  });
  zoomOutBtn.addEventListener("click", () => {
    currentZoom = Math.max(0.3, currentZoom - 0.1);
    applyZoom();
  });

  let isPanning = false,
    startX,
    scrollLeft;
  container.addEventListener("mousedown", (e) => {
    isPanning = true;
    container.style.cursor = "grabbing";
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });
  container.addEventListener("mouseleave", () => {
    isPanning = false;
    container.style.cursor = "grab";
  });
  container.addEventListener("mouseup", () => {
    isPanning = false;
    container.style.cursor = "grab";
  });
  container.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - startX;
    container.scrollLeft = scrollLeft - walk;
  });

  setTimeout(() => {
    const containerWidth = container.offsetWidth;
    const chartWidth = chart.scrollWidth;
    container.scrollLeft = (chartWidth - containerWidth) / 2;
  }, 100);
};

const escapeKontakHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const setKontakMapStatus = (statusElement, message, state = "loading") => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.className = `location-map-status is-${state}`;
};

const copyKontakAddress = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(helper);

  if (!copied) {
    throw new Error("Clipboard API tidak tersedia.");
  }
};

const initKontakAddressActions = () => {
  const copyButton = document.getElementById("copy-address-btn");
  const feedback = document.getElementById("copy-address-feedback");

  if (!copyButton || !feedback) return;

  const defaultFeedback = feedback.textContent;

  copyButton.addEventListener("click", async () => {
    const address = copyButton.dataset.address?.trim();
    if (!address) return;

    try {
      await copyKontakAddress(address);
      feedback.textContent = "Alamat berhasil disalin. Anda bisa langsung menempelkannya ke aplikasi navigasi.";
      feedback.classList.remove("is-error");
      feedback.classList.add("is-success");
    } catch (error) {
      console.error("Gagal menyalin alamat:", error);
      feedback.textContent = "Alamat belum bisa disalin otomatis. Silakan salin manual dari kartu informasi.";
      feedback.classList.remove("is-success");
      feedback.classList.add("is-error");
    }

    window.clearTimeout(copyButton.feedbackTimeout);
    copyButton.feedbackTimeout = window.setTimeout(() => {
      feedback.textContent = defaultFeedback;
      feedback.classList.remove("is-success", "is-error");
    }, 2600);
  });
};

const syncKontakLocationContent = (section) => {
  if (!section) return;

  const {
    mapName = "Sekretariat Karang Taruna Banjarsari",
    mapAddress = "",
    mapQuery = "",
    mapEmail = "",
    mapExternalUrl = "",
    mapLat = "",
    mapLng = "",
  } = section.dataset;

  const addressText = document.getElementById("kontak-address-text");
  const emailLink = document.getElementById("kontak-email-link");
  const directionLink = document.getElementById("kontak-direction-link");
  const fullMapLink = document.getElementById("kontak-full-map-link");
  const copyButton = document.getElementById("copy-address-btn");

  const parsedLat = Number.parseFloat(mapLat);
  const parsedLng = Number.parseFloat(mapLng);
  const destinationQuery = mapQuery || mapAddress || mapName;
  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destinationQuery
  )}`;
  const searchUrl = mapExternalUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
      ? `${parsedLat},${parsedLng}`
      : destinationQuery
  )}`;

  if (addressText) {
    addressText.textContent = mapAddress;
  }

  if (emailLink) {
    emailLink.textContent = mapEmail;
    emailLink.href = mapEmail ? `mailto:${mapEmail}` : "#";
  }

  if (directionLink) {
    directionLink.href = directionUrl;
  }

  if (fullMapLink) {
    fullMapLink.href = searchUrl;
  }

  if (copyButton) {
    copyButton.dataset.address = mapAddress;
  }
};

const initKontakLeafletMap = async (section) => {
  const mapElement = document.getElementById("kontak-map");
  const statusElement = document.getElementById("kontak-map-status");

  if (!section || !mapElement) return;
  if (mapElement.dataset.initialized === "true") return;

  const {
    mapName = "Sekretariat Karang Taruna Banjarsari",
    mapAddress = "",
    mapQuery = "",
    mapExternalUrl = "",
    mapLat = "-7.20961",
    mapLng = "110.18898",
    mapZoom = "17",
  } = section.dataset;

  const fallbackLat = Number.parseFloat(mapLat);
  const fallbackLng = Number.parseFloat(mapLng);
  const defaultZoom = Number.parseInt(mapZoom, 10);
  const initialLat = Number.isFinite(fallbackLat) ? fallbackLat : -7.20961;
  const initialLng = Number.isFinite(fallbackLng) ? fallbackLng : 110.18898;
  const hasManualCoordinates =
    Number.isFinite(fallbackLat) && Number.isFinite(fallbackLng);
  const destinationQuery = mapQuery || mapAddress || mapName;
  const externalMapUrl =
    mapExternalUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      destinationQuery
    )}`;

  if (typeof L === "undefined") {
    setKontakMapStatus(
      statusElement,
      "Leaflet tidak berhasil dimuat. Gunakan tombol Petunjuk Arah untuk membuka navigasi.",
      "error"
    );
    return;
  }

  mapElement.dataset.initialized = "true";

  const buildPopupContent = (isPrecisePoint) => `
    <div class="contact-map-popup">
      <strong>${escapeKontakHtml(mapName)}</strong>
      <p>${escapeKontakHtml(mapAddress)}</p>
      <p>${isPrecisePoint
        ? "Titik lokasi berhasil dicocokkan pada peta."
        : "Titik lokasi memakai koordinat cadangan. Gunakan petunjuk arah untuk hasil paling akurat."
      }</p>
      <a href="${externalMapUrl}" target="_blank" rel="noopener noreferrer">Buka lokasi di Google Maps</a>
    </div>
  `;

  const markerIcon = L.divIcon({
    className: "contact-map-marker-shell",
    html: '<span class="contact-map-marker"></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -12],
  });

  const map = L.map(mapElement, {
    center: [initialLat, initialLng],
    zoom: Number.isFinite(defaultZoom) ? defaultZoom : 17,
    scrollWheelZoom: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const marker = L.marker([initialLat, initialLng], {
    icon: markerIcon,
  })
    .addTo(map)
    .bindPopup(buildPopupContent(false));

  const accuracyCircle = L.circle([initialLat, initialLng], {
    radius: 45,
    color: "#00aaff",
    weight: 1.5,
    fillColor: "#00aaff",
    fillOpacity: 0.14,
  }).addTo(map);

  setKontakMapStatus(
    statusElement,
    "Mencocokkan alamat dengan peta OpenStreetMap...",
    "loading"
  );

  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&accept-language=id&q=${encodeURIComponent(
    destinationQuery
  )}`;

  try {
    const response = await fetch(geocodeUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Permintaan geocoding gagal dengan status ${response.status}.`);
    }

    const results = await response.json();
    const [firstResult] = Array.isArray(results) ? results : [];

    if (!firstResult) {
      throw new Error("Alamat tidak ditemukan pada layanan geocoding.");
    }

    const resolvedLat = Number.parseFloat(firstResult.lat);
    const resolvedLng = Number.parseFloat(firstResult.lon);

    if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLng)) {
      throw new Error("Koordinat hasil geocoding tidak valid.");
    }

    marker.setLatLng([resolvedLat, resolvedLng]);
    marker.setPopupContent(buildPopupContent(true));
    accuracyCircle.setLatLng([resolvedLat, resolvedLng]);
    map.setView([resolvedLat, resolvedLng], Number.isFinite(defaultZoom) ? defaultZoom : 17);

    setKontakMapStatus(
      statusElement,
      "Titik lokasi berhasil dimuat. Klik marker untuk melihat detail dan membuka arah perjalanan.",
      "success"
    );
  } catch (error) {
    console.warn("Geocoding lokasi kontak gagal. Menggunakan koordinat cadangan.", error);
    marker.setPopupContent(buildPopupContent(false));
    setKontakMapStatus(
      statusElement,
      hasManualCoordinates
        ? "Alamat belum bisa dicocokkan otomatis, jadi peta memakai koordinat cadangan. Tombol Google Maps tetap mengarah ke Balai Desa Banjarsari."
        : "Alamat belum bisa dicocokkan otomatis. Gunakan tombol Google Maps untuk menuju Balai Desa Banjarsari.",
      "error"
    );
  } finally {
    window.setTimeout(() => {
      map.invalidateSize();
      marker.openPopup();
    }, 250);

    window.addEventListener("resize", () => {
      map.invalidateSize();
    });
  }
};

// === KONTAK PAGE ===
App.initializers.kontak = async () => {
  const locationSection = document.querySelector(".kontak-location-section");
  if (locationSection) {
    syncKontakLocationContent(locationSection);
    initKontakAddressActions();
    await initKontakLeafletMap(locationSection);
  }

  const container = document.getElementById("kontak-grid");
  if (!container) return;
  const data = await App.fetchData("kontak", "data/kontak.json");

  const createKontakTemplate = (kontak) => `
    <div class="kontak-card animate-on-scroll">
      <img src="${kontak.foto}" alt="${kontak.alt
    }" class="foto-pengurus" loading="lazy" />
      <h4>${kontak.nama}</h4>
      <p class="jabatan">${kontak.jabatan}</p>
      <p class="info-kontak">${kontak.deskripsi}</p>
      <a href="https://wa.me/${kontak.whatsapp}?text=${encodeURIComponent(
      kontak.pesan_wa
    )}" target="_blank" class="wa-button">
        <i class="fab fa-whatsapp"></i> Hubungi via WhatsApp
      </a>
    </div>`;
  App.renderItems(
    container,
    data,
    createKontakTemplate,
    "Gagal memuat daftar narahubung."
  );
};

// === ARTIKEL PAGE (DENGAN PENAMBAHAN KOMENTAR DINAMIS) ===
App.initializers.artikel = async () => {
  const mainContainer = document.querySelector("main");
  const container = document.getElementById("artikel-dinamis-container");
  if (!container || !mainContainer) return;

  const initSlideshow = () => {
    document.querySelectorAll(".slideshow-container").forEach((container) => {
      const slides = container.querySelectorAll(".slide-image");
      if (slides.length <= 1) {
        if (slides.length === 1) slides[0].classList.add("active-slide");
        return;
      }
      let currentIndex = 0;
      slides[currentIndex].classList.add("active-slide");
      if (container.dataset.intervalId)
        clearInterval(parseInt(container.dataset.intervalId));

      const intervalId = setInterval(() => {
        slides[currentIndex].classList.remove("active-slide");
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add("active-slide");
      }, 4000);
      container.dataset.intervalId = intervalId;
    });
  };

  try {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) throw new Error("Slug artikel tidak ditemukan di URL.");

    const artikelPath = `konten-kegiatan/${slug}.html`;
    const response = await fetch(artikelPath);
    if (!response.ok)
      throw new Error(`Gagal memuat konten artikel: ${response.statusText}`);
    const artikelHTML = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(artikelHTML, "text/html");

    const title = doc.querySelector("h2").textContent;
    const date = doc.querySelector(".kegiatan-meta").textContent;
    const contentContainer = doc.querySelector(".artikel-konten");
    const words = contentContainer.innerText.split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);

    document.title = `${title} - Karang Taruna Banjarsari`;
    container.innerHTML = `
        <div class="artikel-header" data-content-id="${slug}">
            <h1>${title}</h1>
            <div class="artikel-meta-info">
                <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                <span><i class="fas fa-clock"></i> Estimasi ${readingTime} menit baca</span>
            </div>
            <div class="reaction-buttons">
              <button class="reaction-btn like-btn"><i class="fas fa-thumbs-up"></i> <span class="like-count">0</span></button>
              <button class="reaction-btn dislike-btn"><i class="fas fa-thumbs-down"></i> <span class="dislike-count">0</span></button>
            </div>
        </div>
        ${doc.querySelector(".slideshow-container")?.outerHTML || ""}
        <div class="artikel-konten">${contentContainer.innerHTML}</div>
        <a href="kegiatan.html" class="tombol-kembali"><i class="fas fa-arrow-left"></i> Kembali ke Daftar Kegiatan</a>
    `;

    initSlideshow();
    App.updateReactionUI(slug); // Panggil update UI untuk artikel ini

    const commentSectionHTML = `
      <div class="container" id="comment-section-container">
          <hr class="separator animate-on-scroll" />
          <section class="comment-section animate-on-scroll">
              <h3>
                  <span id="comment-count">0</span> Komentar
              </h3>
              <form id="comment-form-element" class="comment-form">
                  <div class="comment-avatar-input">
                      <i class="fas fa-user"></i>
                  </div>
                  <div class="comment-input-wrapper">
                      <textarea id="comment-pesan" placeholder="Tambahkan komentar..." required></textarea>
                      <div class="comment-actions">
                          <input type="text" id="comment-nama" placeholder="Nama (opsional)">
                          <button type="submit" class="comment-submit-btn">Kirim</button>
                      </div>
                  </div>
              </form>
              <div id="comment-list-container" class="comment-list">
                  <p>Memuat komentar...</p>
              </div>
          </section>
      </div>
    `;
    mainContainer.insertAdjacentHTML("beforeend", commentSectionHTML);

    if (typeof KomentarApp !== "undefined") {
      KomentarApp.init();
    }
  } catch (error) {
    console.error("Gagal memuat artikel:", error);
    container.innerHTML = `<div style="text-align: center;"><h2>Gagal Memuat Artikel</h2><p>Maaf, konten yang Anda cari tidak dapat ditemukan.</p><p><i>${error.message}</i></p><a href="kegiatan.html" class="kegiatan-tombol" style="margin-top: 20px;"><i class="fas fa-arrow-left"></i> Kembali ke Daftar Kegiatan</a></div>`;
  } finally {
    App.initScrollAnimations();
  }
};

// === ASPIRASI PAGE (DIUBAH) ===
App.initializers.aspirasi = () => {
  const introContainer = document.getElementById("collapsible-intro");
  if (introContainer) {
    const textWrapper = introContainer.querySelector("#intro-text-wrapper");
    const toggleButton = introContainer.querySelector("#toggle-intro-btn");

    if (textWrapper && toggleButton) {
      textWrapper.classList.add("collapsed");
      toggleButton.addEventListener("click", () => {
        const isCollapsed = textWrapper.classList.contains("collapsed");
        if (isCollapsed) {
          textWrapper.classList.remove("collapsed");
          toggleButton.textContent = "Sembunyikan";
        } else {
          textWrapper.classList.add("collapsed");
          toggleButton.textContent = "Baca Selengkapnya...";
        }
      });
    }
  }

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

  const aspirasiContainer = document.getElementById("aspirasi-list");
  const form = document.getElementById("aspirasi-form");
  const formStatus = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-aspirasi-btn");

  // Sembunyikan input nama lama
  const namaInputLama = document.getElementById("nama");
  if (namaInputLama) {
    namaInputLama.parentElement.style.display = "none";
  }

  if (!aspirasiContainer || !form || !submitButton) {
    console.error("Elemen penting untuk halaman aspirasi tidak ditemukan!");
    return;
  }

  const db = firebase.database();
  const aspirasiDbRef = db.ref("aspirasi");

  const createAspirasiTemplate = (item) => {
    const namaPengirim = item.nama ? item.nama : "Saran Anonim";
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    return `
      <div class="aspirasi-item">
        <div class="aspirasi-header">
          <h3>${escapeHtml(item.subjek)}</h3>
          <span class="status-tag status-baru-masuk">Baru Masuk</span>
        </div>
        <div class="aspirasi-meta">
          <span>Oleh: <strong>${escapeHtml(namaPengirim)}</strong></span>
          <span>Masuk pada: ${new Date(item.tanggal_masuk).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )}</span>
        </div>
        <div class="aspirasi-body">
          <p>${escapeHtml(item.pesan)}</p>
        </div>
      </div>
    `;
  };

  const query = db.ref("aspirasi").orderByChild("tanggal_masuk");
  query.on("value", (snapshot) => {
    aspirasiContainer.innerHTML = "";
    if (snapshot.exists()) {
      const data = snapshot.val();
      const aspirasiArray = Object.values(data).sort(
        (a, b) => new Date(b.tanggal_masuk) - new Date(a.tanggal_masuk)
      );
      aspirasiArray.forEach((item) => {
        aspirasiContainer.innerHTML += createAspirasiTemplate(item);
      });
    } else {
      aspirasiContainer.innerHTML =
        "<p>Belum ada aspirasi publik yang ditampilkan. Jadilah yang pertama!</p>";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validasi input yang tersisa
    const subjek = document.getElementById("subjek").value.trim();
    const pesan = document.getElementById("pesan").value.trim();
    if (!subjek || !pesan) {
      alert("Subjek dan Pesan tidak boleh kosong.");
      return;
    }

    try {
      // MINTA IDENTITAS PENGGUNA
      const user = await App.InteractionManager.requestIdentity(
        "menyampaikan aspirasi"
      );
      if (!user) return; // Pengguna membatalkan

      submitButton.disabled = true;
      formStatus.textContent = "Mengirim...";
      formStatus.className = "form-status";

      const dataToSend = {
        nama: user.displayName, // Gunakan nama dari modal
        subjek: subjek,
        pesan: pesan,
        tanggal_masuk: new Date().toISOString(),
      };

      aspirasiDbRef
        .push(dataToSend)
        .then(() => {
          formStatus.textContent =
            "Terima kasih! Aspirasi Anda telah berhasil dipublikasikan.";
          formStatus.classList.add("status-sukses");
          form.reset();
        })
        .catch((error) => {
          console.error("Firebase Error:", error);
          formStatus.textContent =
            "Gagal mengirim aspirasi. Silakan coba lagi.";
          formStatus.classList.add("status-gagal");
        })
        .finally(() => {
          submitButton.disabled = false;
          setTimeout(() => {
            formStatus.textContent = "";
            formStatus.className = "form-status";
          }, 6000);
        });
    } catch (error) {
      console.log("Interaksi dibatalkan oleh pengguna.");
    }
  });
};
