const midtransClient = require("midtrans-client");
const fs = require("fs").promises;
const path = require("path");

// Ini adalah Serverless Function. Bukan lagi server Express.
module.exports = async (req, res) => {
  // Mengatasi masalah CORS di lingkungan serverless
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Menangani request pre-flight dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pastikan hanya metode POST yang diizinkan
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Ambil kunci dari environment variables (nanti di Vercel)
  const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
  const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;

  if (!SERVER_KEY || !CLIENT_KEY) {
    console.error("Midtrans keys not found in environment variables.");
    return res.status(500).json({ error: "Konfigurasi server bermasalah." });
  }

  try {
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: SERVER_KEY,
      clientKey: CLIENT_KEY,
    });

    const { customerName, customerPhone, customerAddress, cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong." });
    }

    // Path ke produk.json sekarang perlu disesuaikan karena lokasi file berubah
    const productFilePath = path.join(process.cwd(), "data", "produk.json");
    const productDataJson = await fs.readFile(productFilePath, "utf-8");
    const allProducts = JSON.parse(productDataJson);

    let totalAmount = 0;
    const items = cart.map((item) => {
      const productData = allProducts.find((p) => p.id === item.id);
      if (!productData) {
        throw new Error(`Produk dengan ID ${item.id} tidak ditemukan.`);
      }
      totalAmount += productData.harga * item.quantity;
      return {
        id: productData.id.toString(),
        price: productData.harga,
        quantity: item.quantity,
        name: productData.nama,
      };
    });

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
    };

    const token = await snap.createTransactionToken(transactionDetails);

    // Kirim token kembali ke frontend
    res.status(200).json({ token });

  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    res.status(500).json({ error: error.message });
  }
};