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
      // FIX: Menggunakan path relatif
      const response = await fetch("data/produk.json");
      if (!response.ok) throw new Error("Gagal mengambil data produk.");

      const products = await response.json();
      const product = products.find((p) => p.id === productId);

      if (product) {
        document.title = `${product.nama} - Karang Taruna Banjarsari`;

        // IMPROVEMENT: Template HTML baru yang lebih detail dan terstruktur
        const detailHTML = `
          <div class="product-image-section">
            <img src="${product.gambar}" alt="${product.nama}">
          </div>
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
            
            <div class="action-buttons" id="main-action-buttons">
              <div class="quantity-control">
                <button class="quantity-btn minus-btn">-</button>
                <input type="number" class="quantity-input" value="1" min="1" readonly>
                <button class="quantity-btn plus-btn">+</button>
              </div>
              <button class="btn-toko btn-keranjang add-to-cart-btn" data-product-id="${
                product.id
              }">
                <i class="fas fa-shopping-cart"></i> Tambah ke Keranjang
              </button>
            </div>

            <div class="product-description">
              <h3>Deskripsi Produk</h3>
              <p>${product.deskripsi}</p>
            </div>
          </div>
        `;
        detailContainer.innerHTML = detailHTML;

        // IMPROVEMENT: Mengisi floating action bar untuk tampilan mobile
        if (floatingActionBar) {
          floatingActionBar.innerHTML = document.getElementById(
            "main-action-buttons"
          ).innerHTML;
        }

        // Menambahkan Event Listeners setelah elemen dirender
        setupEventListeners(product.id);
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

  const setupEventListeners = (productId) => {
    // Menargetkan kedua container aksi (untuk desktop dan mobile)
    const actionContainers = document.querySelectorAll(
      "#main-action-buttons, #floating-action-bar"
    );

    actionContainers.forEach((container) => {
      const minusBtn = container.querySelector(".minus-btn");
      const plusBtn = container.querySelector(".plus-btn");
      const addToCartBtn = container.querySelector(".add-to-cart-btn");

      if (minusBtn) {
        minusBtn.addEventListener("click", () => {
          const quantityInput = container.querySelector(".quantity-input");
          let currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            updateAllQuantities(currentValue - 1);
          }
        });
      }

      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          const quantityInput = container.querySelector(".quantity-input");
          let currentValue = parseInt(quantityInput.value);
          updateAllQuantities(currentValue + 1);
        });
      }

      if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
          const quantityInput = container.querySelector(".quantity-input");
          const quantity = parseInt(quantityInput.value);
          App.addToCart(productId, quantity);

          // IMPROVEMENT: Memberi feedback visual ke pengguna
          addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Ditambahkan!';
          addToCartBtn.classList.add("added"); // Menambah class untuk styling
          addToCartBtn.disabled = true;

          setTimeout(() => {
            addToCartBtn.innerHTML =
              '<i class="fas fa-shopping-cart"></i> Tambah ke Keranjang';
            addToCartBtn.classList.remove("added");
            addToCartBtn.disabled = false;
          }, 2000);
        });
      }
    });
  };

  // Fungsi untuk sinkronisasi jumlah di kedua tombol (desktop & mobile)
  const updateAllQuantities = (newValue) => {
    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.value = newValue;
    });
  };

  if (detailContainer) {
    loadProductDetails();
  }
});
