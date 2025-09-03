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
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (
      cart.length === 0 &&
      window.location.pathname.includes("checkout.html")
    ) {
      window.location.href = "toko.html";
      return;
    }

    try {
      // --- PERBAIKAN DI SINI ---
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
                          productData.gambar
                        }" alt="${productData.nama}"></div>
                        <div class="summary-item-info"><p class="item-name">${
                          productData.nama
                        }</p><p class="item-qty">Jumlah: ${
          item.quantity
        }</p></div>
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

      const payButton = document.querySelector(".btn-checkout");

      payButton.disabled = true;
      payButton.textContent = "Memproses...";

      const orderData = {
        customerName: document.getElementById("nama-lengkap").value,
        customerPhone: document.getElementById("nomor-wa").value,
        customerAddress: document.getElementById("alamat").value,
        cart: JSON.parse(localStorage.getItem("cart")),
      };

      try {
        const response = await fetch("http://localhost:3000/buat-transaksi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal membuat transaksi di server.");
        }

        window.snap.pay(data.token, {
          onSuccess: function (result) {
            alert("Pembayaran berhasil! Terima kasih telah berbelanja.");
            console.log(result);
            localStorage.removeItem("cart");
            App.updateCartBadge();
            window.location.href = "index.html";
          },
          onPending: function (result) {
            alert(
              "Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran."
            );
            console.log(result);
          },
          onError: function (result) {
            alert("Pembayaran gagal! Silakan coba lagi.");
            console.log(result);
            payButton.disabled = false;
            payButton.textContent = "Bayar Sekarang";
          },
          onClose: function () {
            console.log(
              "Jendela pembayaran ditutup tanpa menyelesaikan transaksi."
            );
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
