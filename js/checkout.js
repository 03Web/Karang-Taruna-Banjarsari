// File: js/checkout.js

document.addEventListener("DOMContentLoaded", () => {
  const summaryItemsContainer = document.getElementById(
    "summary-items-container"
  );
  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryTotal = document.getElementById("summary-total");
  const checkoutForm = document.getElementById("checkout-form-element");

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const loadCheckoutSummary = async () => {
    // --- AWAL PERUBAHAN LOGIKA ---
    // Cek apakah ada item "Beli Langsung" di penyimpanan sementara
    const buyNowItemJSON = sessionStorage.getItem("buyNowItem");
    let cart;

    if (buyNowItemJSON) {
      // Jika ada, gunakan item itu untuk checkout
      console.log("Mode: Beli Langsung");
      cart = JSON.parse(buyNowItemJSON);
    } else {
      // Jika tidak ada, gunakan keranjang belanja utama seperti biasa
      console.log("Mode: Keranjang Belanja");
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    }
    // --- AKHIR PERUBAHAN LOGIKA ---

    if (cart.length === 0) {
      window.location.href = "toko.html";
      return;
    }

    try {
      const response = await fetch("data/produk.json");
      const allProducts = await response.json();

      summaryItemsContainer.innerHTML = "";
      let subtotal = 0;

      cart.forEach((item) => {
        const productData = allProducts.find((p) => p.id === item.id);
        if (!productData) return;
        subtotal += productData.harga * item.quantity;

        const summaryItemHTML = `
            <div class="summary-item">
                <div class="summary-item-img"><img src="${
                  productData.gambar_produk
                    ? productData.gambar_produk[0]
                    : productData.gambar
                }" alt="${productData.nama}"></div>
                <div class="summary-item-info"><p class="item-name">${
                  productData.nama
                }</p><p class="item-qty">Jumlah: ${item.quantity}</p></div>
                <span class="summary-item-price">${formatRupiah(
                  productData.harga * item.quantity
                )}</span>
            </div>
        `;
        summaryItemsContainer.insertAdjacentHTML("beforeend", summaryItemHTML);
      });

      summarySubtotal.textContent = formatRupiah(subtotal);
      summaryTotal.textContent = formatRupiah(subtotal);
    } catch (error) {
      console.error("Gagal memuat ringkasan checkout:", error);
      summaryItemsContainer.innerHTML = "<p>Gagal memuat ringkasan.</p>";
    }
  };

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const buyNowItemJSON = sessionStorage.getItem("buyNowItem");
      let cartForTransaction = buyNowItemJSON
        ? JSON.parse(buyNowItemJSON)
        : JSON.parse(localStorage.getItem("cart"));

      const payButton = document.querySelector(".btn-checkout");
      payButton.disabled = true;
      payButton.textContent = "Memproses...";

      const orderData = {
        customerName: document.getElementById("nama-lengkap").value,
        customerPhone: document.getElementById("nomor-wa").value,
        customerAddress: document.getElementById("alamat").value,
        cart: cartForTransaction,
      };

      try {
        const response = await fetch("/api/buat-transaksi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Gagal membuat transaksi di server.");

        window.snap.pay(data.token, {
          onSuccess: function (result) {
            // HAPUS ALERT LAMA DAN GANTI DENGAN INI:
            // Kita simpan "tanda" di sessionStorage bahwa pembayaran sukses.
            sessionStorage.setItem("showPaymentSuccess", "true");

            // Hapus keranjang yang relevan setelah pembayaran sukses
            if (buyNowItemJSON) {
              sessionStorage.removeItem("buyNowItem"); // Hapus data sementara
            } else {
              localStorage.removeItem("cart"); // Hapus keranjang utama
              App.updateCartBadge();
            }

            // Langsung arahkan ke halaman utama
            window.location.href = "index.html";
          },
          onPending: function (result) {
            /* ... kode tidak berubah ... */
          },
          onError: function (result) {
            alert("Pembayaran gagal! Silakan coba lagi.");
            payButton.disabled = false;
            payButton.textContent = "Bayar Sekarang";
          },
          onClose: function () {
            // Jika pembayaran ditutup, hapus data sementara jika ada
            if (buyNowItemJSON) {
              sessionStorage.removeItem("buyNowItem");
            }
            payButton.disabled = false;
            payButton.textContent = "Bayar Sekarang";
          },
        });
      } catch (error) {
        console.error("Error saat proses checkout:", error);
        alert("Terjadi kesalahan: " + error.message);
        payButton.disabled = false;
        payButton.textContent = "Bayar Sekarang";
      }
    });
  }

  loadCheckoutSummary();
});
