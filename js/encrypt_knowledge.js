// Script helper untuk mengenkripsi KNOWLEDGE_BASE
// Jalankan dengan: node js/encrypt_knowledge.js

const fs = require('fs');
const path = require('path');

// Baca file asli
const filePath = path.join(__dirname, 'chatbot_knowledge.js');
const content = fs.readFileSync(filePath, 'utf-8');

// Ekstrak konten KNOWLEDGE_BASE (dari setelah "=" sampai akhir sebelum semicolon)
const match = content.match(/const KNOWLEDGE_BASE = `\s*([\s\S]*?)`;/);
if (!match) {
  console.error('Gagal menemukan KNOWLEDGE_BASE');
  process.exit(1);
}

const knowledgeText = match[1];
console.log('Original length:', knowledgeText.length);

// Fungsi XOR cipher
function xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Enkripsi dengan kunci rahasia
const secretKey = 'KTA_Banjarsari2025_SecureKey';
const encrypted = xorCipher(knowledgeText, secretKey);
const base64Encrypted = Buffer.from(encrypted).toString('base64');

console.log('Encrypted length:', base64Encrypted.length);
console.log('First 100 chars:', base64Encrypted.substring(0, 100));

// Simpan hasil ke file sementara
fs.writeFileSync(path.join(__dirname, 'encrypted_output.txt'), base64Encrypted);
console.log('\nEncrypted data saved to encrypted_output.txt');
console.log('Copy this to chatbot_knowledge.js');