// File: js/detail-produk.js

document.addEventListener("DOMContentLoaded", () => {
  const detailContainer = document.getElementById("product-detail-container");
  const floatingActionBar = document.getElementById("floating-action-bar");

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const loadProductDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
      detailContainer.innerHTML = "<p>Produk tidak ditemukan.</p>";
      return;
    }

    try {
      const response = await fetch("data/produk.json");
      if (!response.ok) throw new Error("Gagal mengambil data produk.");

      const products = await response.json();
      const product = products.find((p) => p.id === productId);

      if (product) {
        document.title = `${product.nama} - Karang Taruna Banjarsari`;

        const gambarProduk = product.gambar_produk || [product.gambar];
        const mainImageHTML = `<img src="${gambarProduk[0]}" alt="${product.nama}" id="main-product-image">`;

        const thumbnailsHTML =
          gambarProduk.length > 1
            ? `<div class="product-thumbnails">
              ${gambarProduk
                .map(
                  (g, index) => `
                <img src="${g}" alt="Thumbnail ${
                    index + 1
                  }" class="thumbnail-item ${
                    index === 0 ? "active" : ""
                  }" data-src="${g}">
              `
                )
                .join("")}
            </div>`
            : "";

        const imageSectionHTML = `
          <div class="product-image-section">
            ${mainImageHTML}
            ${thumbnailsHTML}
          </div>
        `;

        const detailHTML = `
          ${imageSectionHTML}
          <div class="product-info-section">
            <h1 class="product-name">${product.nama}</h1>
            <div class="product-stats-detail">
                <span><i class="fas fa-star"></i> ${product.rating}</span>
                <span class="divider">|</span>
                <span>Terjual ${product.terjual}</span>
                <span class="divider">|</span>
                <span><i class="fas fa-map-marker-alt"></i> ${
                  product.lokasi
                }</span>
            </div>
            <p class="product-price">${formatRupiah(product.harga)}</p>
            
            <div class="quantity-section">
                <h3>Jumlah</h3>
                <div class="quantity-control">
                    <button class="quantity-btn minus-btn">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" readonly>
                    <button class="quantity-btn plus-btn">+</button>
                </div>
            </div>

            <div class="product-description">
              <h3>Deskripsi Produk</h3>
              <p>${product.deskripsi}</p>
            </div>
          </div>
        `;
        detailContainer.innerHTML = detailHTML;

        // --- PERBAIKAN UTAMA: MEMBUAT KUMPULAN TOMBOL UNTUK BAR BAWAH ---
        const addToCartButtonHTML = `<button class="btn-toko btn-keranjang add-to-cart-btn" data-product-id="${product.id}"><i class="fas fa-shopping-cart"></i> Keranjang</button>`;
        let chatButtonHTML = "";
        if (product.penjual_wa) {
          const pesanWA = `Halo, saya tertarik dengan produk '${product.nama}' yang ada di website Karang Taruna Banjarsari.`;
          chatButtonHTML = `<a href="https://wa.me/${
            product.penjual_wa
          }?text=${encodeURIComponent(
            pesanWA
          )}" target="_blank" class="btn-toko btn-chat"><i class="fab fa-whatsapp"></i> Chat</a>`;
        }
        const beliLangsungButtonHTML = `<button class="btn-toko btn-beli btn-beli-langsung" data-product-id="${product.id}">Beli Langsung</button>`;

        // Mengisi floating action bar dengan TIGA TOMBOL LENGKAP
        if (floatingActionBar) {
          floatingActionBar.innerHTML = `<div class="action-buttons-mobile">${addToCartButtonHTML} ${chatButtonHTML} ${beliLangsungButtonHTML}</div>`;
          floatingActionBar.style.display = "flex"; // Pastikan selalu terlihat
        }

        setupEventListeners(product.id);
        setupGalleryListeners();
      } else {
        detailContainer.innerHTML =
          "<h2>Produk Tidak Ditemukan</h2><p>Maaf, produk yang Anda cari tidak ada atau telah dihapus.</p>";
      }
    } catch (error) {
      console.error("Error:", error);
      detailContainer.innerHTML =
        "<h2>Gagal Memuat</h2><p>Terjadi kesalahan saat memuat detail produk. Silakan coba lagi nanti.</p>";
    }
  };

  const setupGalleryListeners = () => {
    // ... (Kode ini tidak berubah)
  };

  const setupEventListeners = (productId) => {
    const allButtonContainers = document.querySelectorAll(
      ".product-info-section, #floating-action-bar"
    );

    allButtonContainers.forEach((container) => {
      const addToCartBtn = container.querySelector(".add-to-cart-btn");
      const buyNowBtn = container.querySelector(".btn-beli-langsung");

      if (addToCartBtn) {
        addToCartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const quantityInput = document.querySelector(".quantity-input");
          const quantity = parseInt(quantityInput.value);
          App.addToCart(productId, quantity);

          document
            .querySelectorAll(
              `.add-to-cart-btn[data-product-id="${productId}"]`
            )
            .forEach((btn) => {
              btn.innerHTML = '<i class="fas fa-check"></i> Ditambahkan!';
              btn.classList.add("added");
              btn.disabled = true;
            });

          setTimeout(() => {
            document
              .querySelectorAll(
                `.add-to-cart-btn[data-product-id="${productId}"]`
              )
              .forEach((btn) => {
                btn.innerHTML =
                  '<i class="fas fa-shopping-cart"></i> Keranjang';
                btn.classList.remove("added");
                btn.disabled = false;
              });
          }, 2000);
        });
      }

      if (buyNowBtn) {
        buyNowBtn.addEventListener("click", () => {
          const quantityInput = document.querySelector(".quantity-input");
          const quantity = parseInt(quantityInput.value);
          const buyNowItem = [{ id: productId, quantity: quantity }];
          sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
          window.location.href = "checkout.html";
        });
      }
    });

    const infoSection = document.querySelector(".product-info-section");
    if (infoSection) {
      const minusBtn = infoSection.querySelector(".minus-btn");
      const plusBtn = infoSection.querySelector(".plus-btn");
      if (minusBtn && plusBtn) {
        minusBtn.addEventListener("click", () => {
          const quantityInput = infoSection.querySelector(".quantity-input");
          let currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) quantityInput.value = currentValue - 1;
        });
        plusBtn.addEventListener("click", () => {
          const quantityInput = infoSection.querySelector(".quantity-input");
          let currentValue = parseInt(quantityInput.value);
          quantityInput.value = currentValue + 1;
        });
      }
    }
  };

  if (detailContainer) {
    loadProductDetails();
  }
});
