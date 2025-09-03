// File: js/toko.js

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("product-grid");
  const searchInput = document.getElementById("search-input");

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const loadProducts = async (searchTerm = "") => {
    try {
      // --- PERBAIKAN DI SINI ---
      const response = await fetch("/data/produk.json");
      if (!response.ok) {
        throw new Error("Gagal memuat data produk.");
      }
      const products = await response.json();

      const filteredProducts = products.filter((product) =>
        product.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );

      productGrid.innerHTML = "";
      if (filteredProducts.length > 0) {
        filteredProducts.forEach((product) => {
          const productCard = `
            <div class="product-card animate-on-scroll" data-id="${product.id}">
              <a href="detail-produk.html?id=${
                product.id
              }" class="product-link">
                <div class="product-image">
                  <img src="${product.gambar}" alt="${product.nama}" />
                </div>
                <div class="product-info">
                  <h3 class="product-title">${product.nama}</h3>
                  <p class="product-price">${formatRupiah(product.harga)}</p>
                </div>
              </a>
              <div class="product-actions">
                <button class="btn-toko btn-keranjang" data-id="${product.id}">
                  <i class="fas fa-shopping-cart"></i> Tambah
                </button>
              </div>
            </div>
          `;
          productGrid.insertAdjacentHTML("beforeend", productCard);
        });
      } else {
        productGrid.innerHTML = "<p>Produk tidak ditemukan.</p>";
      }
    } catch (error) {
      console.error("Error memuat produk:", error);
      productGrid.innerHTML = "<p>Gagal memuat produk. Coba lagi nanti.</p>";
    }
  };

  if (productGrid) {
    loadProducts();

    searchInput?.addEventListener("input", (e) => {
      loadProducts(e.target.value);
    });

    productGrid.addEventListener("click", (e) => {
      if (e.target.closest(".btn-keranjang")) {
        const productId = e.target.closest(".product-card").dataset.id;
        App.addToCart(productId, 1);
      }
    });
  }
});
