// const express = require("express");
// const midtransClient = require("midtrans-client");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const fs = require("fs").promises;
// const path = require("path");
// require("dotenv").config(); // <-- TAMBAHKAN BARIS INI DI ATAS

// const app = express();
// const port = 3000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Ambil kunci dari environment variables (.env)
// const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
// const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;

// // Validasi apakah kunci sudah diatur
// if (!SERVER_KEY || !CLIENT_KEY) {
//   console.error(
//     "KESALAHAN: MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY tidak ditemukan."
//   );
//   console.error("Pastikan Anda sudah membuat file .env dan mengisinya.");
//   process.exit(1); // Hentikan server jika kunci tidak ada
// }

// // Inisialisasi Snap Midtrans
// let snap = new midtransClient.Snap({
//   isProduction: false,
//   serverKey: SERVER_KEY,
//   clientKey: CLIENT_KEY,
// });

// // Endpoint untuk membuat transaksi
// app.post("/buat-transaksi", async (req, res) => {
//   try {
//     const { customerName, customerPhone, customerAddress, cart } = req.body;

//     if (!cart || cart.length === 0) {
//       return res.status(400).json({ error: "Keranjang belanja kosong." });
//     }

//     const productFilePath = path.join(__dirname, "data", "produk.json");
//     const productDataJson = await fs.readFile(productFilePath, "utf-8");
//     const allProducts = JSON.parse(productDataJson);

//     let totalAmount = 0;
//     const items = cart.map((item) => {
//       const productData = allProducts.find((p) => p.id === item.id);
//       if (!productData) {
//         throw new Error(`Produk dengan ID ${item.id} tidak ditemukan.`);
//       }
//       totalAmount += productData.harga * item.quantity;
//       return {
//         id: productData.id.toString(),
//         price: productData.harga,
//         quantity: item.quantity,
//         name: productData.nama,
//       };
//     });

//     if (totalAmount === 0) {
//       return res.status(400).json({ error: "Total transaksi adalah nol." });
//     }

//     const transactionDetails = {
//       transaction_details: {
//         order_id: "ORDER-" + new Date().getTime(),
//         gross_amount: totalAmount,
//       },
//       item_details: items,
//       customer_details: {
//         first_name: customerName,
//         phone: customerPhone,
//         shipping_address: {
//           address: customerAddress,
//         },
//       },
//       credit_card: {
//         secure: true,
//       },
//     };

//     const token = await snap.createTransactionToken(transactionDetails);
//     res.json({ token });
//   } catch (error) {
//     console.error("Error di server saat membuat transaksi:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server berjalan di http://localhost:${port}`);
// });
