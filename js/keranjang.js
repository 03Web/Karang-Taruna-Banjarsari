// File: js/keranjang.js

document.addEventListener("DOMContentLoaded", () => {
  const cartContentContainer = document.getElementById("cart-content");

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const updateQuantity = (productId, newQuantity) => {
    let cart = App.getCart();
    const itemIndex = cart.findIndex((item) => item.id === productId);

    if (itemIndex > -1) {
      if (newQuantity > 0) {
        cart[itemIndex].quantity = newQuantity;
      } else {
        // Hapus item jika kuantitas 0 atau kurang
        cart.splice(itemIndex, 1);
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      App.updateCartBadge();
      renderCart(); // Render ulang seluruh keranjang
    }
  };

  const renderCart = async () => {
    const cart = App.getCart();

    if (cart.length === 0) {
      cartContentContainer.innerHTML = `
        <div class="keranjang-kosong animate-on-scroll">
          <i class="fas fa-shopping-cart"></i>
          <h2>Keranjang Anda Kosong</h2>
          <p>Sepertinya Anda belum menambahkan produk apapun.</p>
          <a href="toko.html" class="btn-toko btn-beli">Mulai Belanja</a>
        </div>
      `;
      App.initScrollAnimations();
      return;
    }

    try {
      // FIX: Menggunakan path relatif
      const response = await fetch("data/produk.json");
      if (!response.ok) throw new Error("Gagal mengambil data produk.");
      const allProducts = await response.json();

      let itemsHTML = "";
      let subtotal = 0;

      cart.forEach((item) => {
        const productData = allProducts.find((p) => p.id === item.id);
        if (productData) {
          subtotal += productData.harga * item.quantity;
          itemsHTML += `
            <div class="keranjang-item" data-id="${item.id}">
                <div class="keranjang-item-img">
                    <img src="${productData.gambar}" alt="${productData.nama}">
                </div>
                <div class="keranjang-item-info">
                    <p class="item-name">${productData.nama}</p>
                    <p class="item-price">${formatRupiah(productData.harga)}</p>
                    <div class="keranjang-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn minus-btn" aria-label="Kurangi jumlah">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn plus-btn" aria-label="Tambah jumlah">+</button>
                        </div>
                        <button class="remove-item-btn" aria-label="Hapus item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
          `;
        }
      });

      const cartLayoutHTML = `
        <div class="keranjang-layout animate-on-scroll">
          <div class="keranjang-items-list">
            ${itemsHTML}
          </div>
          <div class="keranjang-summary">
            <h3>Ringkasan Belanja</h3>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${formatRupiah(subtotal)}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>${formatRupiah(subtotal)}</span>
            </div>
            <a href="checkout.html" class="btn-toko btn-beli btn-checkout">Lanjut ke Checkout</a>
          </div>
        </div>
      `;

      cartContentContainer.innerHTML = cartLayoutHTML;
      App.initScrollAnimations();
      setupEventListeners();
    } catch (error) {
      console.error("Error memuat item keranjang:", error);
      cartContentContainer.innerHTML = "<p>Gagal memuat item keranjang.</p>";
    }
  };

  const setupEventListeners = () => {
    const cartItemsList = document.querySelector(".keranjang-items-list");
    if (!cartItemsList) return;

    cartItemsList.addEventListener("click", (e) => {
      const target = e.target;
      const cartItem = target.closest(".keranjang-item");
      if (!cartItem) return;

      const productId = cartItem.dataset.id;
      const quantityValueElement = cartItem.querySelector(".quantity-value");
      let currentQuantity = parseInt(quantityValueElement.textContent);

      if (target.closest(".plus-btn")) {
        updateQuantity(productId, currentQuantity + 1);
      } else if (target.closest(".minus-btn")) {
        updateQuantity(productId, currentQuantity - 1);
      } else if (target.closest(".remove-item-btn")) {
        updateQuantity(productId, 0); // Hapus item
      }
    });
  };

  renderCart();
});
