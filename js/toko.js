// File: js/toko.js

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("product-grid-container");
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
          const contentId = `produk_${product.id}`;
          const productCard = `
            <div class="product-card-wrapper animate-on-scroll" data-content-id="${contentId}">
                <a href="detail-produk.html?id=${
                  product.id
                }" class="product-card" data-id="${product.id}">
                    <img src="${product.gambar}" alt="${
            product.nama
          }" class="product-image">
                    <div class="product-info">
                        <p class="product-name">${product.nama}</p>
                        <p class="product-price">${formatRupiah(
                          product.harga
                        )}</p>
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
                <div class="reaction-buttons" style="padding: 10px; background-color: var(--card-bg); border-radius: 0 0 8px 8px; border-top: 1px solid var(--border-color);">
                    <button class="reaction-btn like-btn"><i class="fas fa-thumbs-up"></i> <span class="like-count">0</span></button>
                    <button class="reaction-btn dislike-btn"><i class="fas fa-thumbs-down"></i> <span class="dislike-count">0</span></button>
                </div>
            </div>
          `;
          productGrid.insertAdjacentHTML("beforeend", productCard);
        });

        App.initScrollAnimations();

        // Panggil update UI untuk setiap produk
        filteredProducts.forEach((product) => {
          const contentId = `produk_${product.id}`;
          App.updateReactionUI(contentId);
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
    const updateView = () => {
      const searchTerm = searchInput?.value || "";
      const activeCategory =
        document.querySelector(".filter-btn.active")?.dataset.kategori ||
        "semua";
      loadProducts(searchTerm, activeCategory);
    };

    searchInput?.addEventListener("input", updateView);

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        updateView();
      });
    });

    productGrid.addEventListener("click", (e) => {
      const keranjangBtn = e.target.closest(".btn-keranjang");
      if (keranjangBtn) {
        e.preventDefault();
        const productId = keranjangBtn.dataset.id;
        App.addToCart(productId, 1);
      }
    });

    updateView();
  }
});
