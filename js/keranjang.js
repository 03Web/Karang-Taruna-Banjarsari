// File: js/keranjang.js

document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartSubtotalElement = document.getElementById("cart-subtotal");
  const emptyCartMessage = document.getElementById("empty-cart-message");
  const cartTotals = document.getElementById("cart-totals");
  const checkoutButton = document.querySelector(".btn-checkout-keranjang");

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
        cart.splice(itemIndex, 1);
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      App.updateCartBadge();
      loadCartItems();
    }
  };

  const loadCartItems = async () => {
    const cart = App.getCart();

    if (cart.length === 0) {
      emptyCartMessage.style.display = "block";
      cartTotals.style.display = "none";
      cartItemsContainer.innerHTML = "";
      return;
    }

    emptyCartMessage.style.display = "none";
    cartTotals.style.display = "block";

    try {
      // --- PERBAIKAN DI SINI ---
      const response = await fetch("/data/produk.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allProducts = await response.json();

      cartItemsContainer.innerHTML = "";
      let subtotal = 0;

      cart.forEach((item) => {
        const productData = allProducts.find((p) => p.id === item.id);
        if (productData) {
          subtotal += productData.harga * item.quantity;
          const itemHTML = `
            <div class="cart-item" data-id="${item.id}">
              <div class="cart-item-img">
                <img src="${productData.gambar}" alt="${productData.nama}">
              </div>
              <div class="cart-item-details">
                <p class="cart-item-name">${productData.nama}</p>
                <p class="cart-item-price">${formatRupiah(
                  productData.harga
                )}</p>
                <div class="cart-item-quantity">
                  <button class="quantity-btn minus-btn">-</button>
                  <input type="number" class="quantity-input" value="${
                    item.quantity
                  }" min="1">
                  <button class="quantity-btn plus-btn">+</button>
                </div>
              </div>
              <div class="cart-item-total">${formatRupiah(
                productData.harga * item.quantity
              )}</div>
              <button class="cart-item-remove"><i class="fas fa-times"></i></button>
            </div>
          `;
          cartItemsContainer.insertAdjacentHTML("beforeend", itemHTML);
        }
      });

      cartSubtotalElement.textContent = formatRupiah(subtotal);
    } catch (error) {
      console.error("Error memuat item keranjang:", error);
      cartItemsContainer.innerHTML = "<p>Gagal memuat item keranjang.</p>";
    }
  };

  if (cartItemsContainer) {
    loadCartItems();

    cartItemsContainer.addEventListener("click", (e) => {
      const target = e.target;
      const cartItem = target.closest(".cart-item");
      if (!cartItem) return;
      const productId = cartItem.dataset.id;
      let quantityInput = cartItem.querySelector(".quantity-input");
      let currentQuantity = parseInt(quantityInput.value);

      if (target.classList.contains("plus-btn")) {
        updateQuantity(productId, currentQuantity + 1);
      } else if (target.classList.contains("minus-btn")) {
        if (currentQuantity > 1) {
          updateQuantity(productId, currentQuantity - 1);
        } else {
          updateQuantity(productId, 0); // Hapus jika kuantitas jadi 0
        }
      } else if (target.closest(".cart-item-remove")) {
        updateQuantity(productId, 0); // Hapus item
      }
    });

    cartItemsContainer.addEventListener("change", (e) => {
      if (e.target.classList.contains("quantity-input")) {
        const cartItem = e.target.closest(".cart-item");
        const productId = cartItem.dataset.id;
        const newQuantity = parseInt(e.target.value);
        if (newQuantity >= 1) {
          updateQuantity(productId, newQuantity);
        } else {
          e.target.value = 1; // Reset ke 1 jika input tidak valid
        }
      }
    });

    checkoutButton?.addEventListener("click", () => {
      window.location.href = "checkout.html";
    });
  }
});
