// File: js/toko.js

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("product-grid-container"); // Perbaikan: Menargetkan ID yang benar
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const loadProducts = async (searchTerm = "", category = "semua") => {
    try {
      // --- PERBAIKAN DI SINI ---
      // Menghapus garis miring di depan path untuk membuatnya relatif
      const response = await fetch("data/produk.json");
      if (!response.ok) {
        throw new Error("Gagal memuat data produk.");
      }
      const products = await response.json();

      const filteredProducts = products.filter((product) => {
        const matchesSearch = product.nama
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          category === "semua" || product.kategori === category;
        return matchesSearch && matchesCategory;
      });

      productGrid.innerHTML = "";
      if (filteredProducts.length > 0) {
        filteredProducts.forEach((product) => {
          const productCard = `
            <a href="detail-produk.html?id=${
              product.id
            }" class="product-card animate-on-scroll" data-id="${product.id}">
                <img src="${product.gambar}" alt="${
            product.nama
          }" class="product-image">
                <div class="product-info">
                    <p class="product-name">${product.nama}</p>
                    <p class="product-price">${formatRupiah(product.harga)}</p>
                    <div class="product-details">
                        <div class="product-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${product.lokasi}</span>
                        </div>
                        <div class="product-stats">
                            <i class="fas fa-star"></i>
                            <span>${product.rating} | Terjual ${
            product.terjual
          }</span>
                        </div>
                    </div>
                </div>
            </a>
          `;
          productGrid.insertAdjacentHTML("beforeend", productCard);
        });
        App.initScrollAnimations(); // Inisialisasi ulang animasi untuk item baru
      } else {
        productGrid.innerHTML = "<p>Produk tidak ditemukan.</p>";
      }
    } catch (error) {
      console.error("Error memuat produk:", error);
      productGrid.innerHTML = "<p>Gagal memuat produk. Coba lagi nanti.</p>";
    }
  };

  if (productGrid) {
    // Fungsi untuk meng-handle filter dan pencarian
    const updateView = () => {
      const searchTerm = searchInput?.value || "";
      const activeCategory =
        document.querySelector(".filter-btn.active")?.dataset.kategori ||
        "semua";
      loadProducts(searchTerm, activeCategory);
    };

    // Event listener untuk input pencarian
    searchInput?.addEventListener("input", updateView);

    // Event listener untuk tombol filter
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        updateView();
      });
    });

    // Event listener untuk tombol 'Tambah ke Keranjang'
    // (Catatan: Aksi ini lebih baik ditangani di app-core.js jika polanya sama)
    productGrid.addEventListener("click", (e) => {
      // Menggunakan closest untuk target yang lebih fleksibel
      const keranjangBtn = e.target.closest(".btn-keranjang");
      if (keranjangBtn) {
        e.preventDefault(); // Mencegah navigasi jika tombol di dalam link
        const productId = keranjangBtn.dataset.id;
        App.addToCart(productId, 1);
      }
    });

    // Muat produk saat halaman pertama kali dibuka
    updateView();
  }
});
