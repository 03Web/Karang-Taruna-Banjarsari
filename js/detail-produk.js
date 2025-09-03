// File: js/detail-produk.js

document.addEventListener("DOMContentLoaded", () => {
  const detailContainer = document.getElementById("product-detail-container");

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
      // --- PERBAIKAN DI SINI ---
      const response = await fetch("/data/produk.json");
      const products = await response.json();
      const product = products.find((p) => p.id === productId);

      if (product) {
        const detailHTML = `
          <div class="product-detail-image">
            <img src="${product.gambar}" alt="${product.nama}">
          </div>
          <div class="product-detail-info">
            <h1>${product.nama}</h1>
            <p class="product-detail-price">${formatRupiah(product.harga)}</p>
            <div class="product-description">
              <p>${product.deskripsi}</p>
            </div>
            <div class="product-detail-actions">
              <div class="quantity-selector">
                <button class="quantity-btn" id="minus-btn">-</button>
                <input type="number" id="quantity-input" value="1" min="1">
                <button class="quantity-btn" id="plus-btn">+</button>
              </div>
              <button class="btn-toko btn-keranjang" id="add-to-cart-btn">
                <i class="fas fa-shopping-cart"></i> Tambah ke Keranjang
              </button>
            </div>
          </div>
        `;
        detailContainer.innerHTML = detailHTML;

        // Event Listeners for quantity and add to cart
        const minusBtn = document.getElementById("minus-btn");
        const plusBtn = document.getElementById("plus-btn");
        const quantityInput = document.getElementById("quantity-input");
        const addToCartBtn = document.getElementById("add-to-cart-btn");

        minusBtn.addEventListener("click", () => {
          let currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
          }
        });

        plusBtn.addEventListener("click", () => {
          let currentValue = parseInt(quantityInput.value);
          quantityInput.value = currentValue + 1;
        });

        addToCartBtn.addEventListener("click", () => {
          const quantity = parseInt(quantityInput.value);
          App.addToCart(productId, quantity);
        });
      } else {
        detailContainer.innerHTML = "<p>Detail produk tidak ditemukan.</p>";
      }
    } catch (error) {
      console.error("Error:", error);
      detailContainer.innerHTML = "<p>Gagal memuat detail produk.</p>";
    }
  };

  if (detailContainer) {
    loadProductDetails();
  }
});
