const express = require("express");
const midtransClient = require("midtrans-client");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises; // 1. Menggunakan modul 'fs' untuk membaca file
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PERBAIKAN: Ganti dengan Server Key dan Client Key Midtrans Anda
const SERVER_KEY = "";
const CLIENT_KEY = "";

if (
  !SERVER_KEY.startsWith("SB-Mid-server-") ||
  !CLIENT_KEY.startsWith("SB-Mid-client-")
) {
  console.warn(
    "PERINGATAN: Kunci Midtrans sepertinya belum diganti. Pastikan Anda menggunakan kunci asli dari akun Sandbox Anda."
  );
}

// Inisialisasi Snap Midtrans
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
});

// Endpoint untuk membuat transaksi
app.post("/buat-transaksi", async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong." });
    }

    // 2. Membaca file produk.json langsung dari sistem file
    const productFilePath = path.join(__dirname, "data", "produk.json");
    const productDataJson = await fs.readFile(productFilePath, "utf-8");
    const allProducts = JSON.parse(productDataJson);

    let totalAmount = 0;
    const items = cart.map((item) => {
      const productData = allProducts.find((p) => p.id === item.id);
      if (!productData) {
        // Jika produk tidak ditemukan, kirim error
        throw new Error(`Produk dengan ID ${item.id} tidak ditemukan.`);
      }
      totalAmount += productData.harga * item.quantity;
      return {
        id: productData.id.toString(), // ID harus string
        price: productData.harga,
        quantity: item.quantity,
        name: productData.nama,
      };
    });

    if (totalAmount === 0) {
      return res.status(400).json({ error: "Total transaksi adalah nol." });
    }

    const transactionDetails = {
      transaction_details: {
        order_id: "ORDER-" + new Date().getTime(),
        gross_amount: totalAmount,
      },
      item_details: items,
      customer_details: {
        first_name: customerName,
        phone: customerPhone,
        shipping_address: {
          address: customerAddress,
        },
      },
      credit_card: {
        secure: true,
      },
    };

    const token = await snap.createTransactionToken(transactionDetails);
    res.json({ token });
  } catch (error) {
    console.error("Error di server saat membuat transaksi:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
