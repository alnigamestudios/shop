/**
 * Al&Ni Studios - Shopier API Ürün Güncelleme Scripti
 * Bu script GitHub Actions tarafından çalıştırılır ve products.js dosyasını günceller
 */

const fs = require('fs');
const https = require('https');

// API Token (GitHub Secrets'tan gelir)
const API_TOKEN = process.env.SHOPIER_API_TOKEN;

if (!API_TOKEN) {
    console.error('❌ SHOPIER_API_TOKEN bulunamadı!');
    process.exit(1);
}

// Mevcut products.js'den açıklamaları ve kategori bilgilerini al
const existingProducts = require('../products.js');

// Kategori tanımları
const categories = [
    { id: "all", name: "Tüm Ürünler", icon: "🎁" },
    { id: "sevgililer", name: "Sevgililer Günü", icon: "💕" },
    { id: "tema", name: "Temalı Hediyeler", icon: "🎬" },
    { id: "eglence", name: "Eğlence", icon: "🎮" },
    { id: "ozelgun", name: "Özel Günler", icon: "🎂" },
    { id: "romantik", name: "Romantik", icon: "🌹" },
    { id: "surpriz", name: "Sürpriz", icon: "🎁" },
    { id: "isletme", name: "İşletme", icon: "☕" }
];

// Badge eşleştirmeleri (ürün ismine göre)
const badgeMappings = {
    'Timeline': 'Yeni',
    'Döv Beni': 'Popüler',
    'Netflix': 'Premium',
    'Pro': 'Pro',
    'Sihir': 'Sihirli',
    'Love Calculator': 'En Uygun',
    'Buluşma Daveti': 'Yeni'
};

// Kategori tespit fonksiyonu
function detectCategory(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('sevgililer') || titleLower.includes('çıkar mısın') || titleLower.includes('date')) return 'sevgililer';
    if (titleLower.includes('netflix') || titleLower.includes('spotify')) return 'tema';
    if (titleLower.includes('kazı kazan') || titleLower.includes('döv') || titleLower.includes('love calculator')) return 'eglence';
    if (titleLower.includes('yıl dönümü') || titleLower.includes('özür')) return 'ozelgun';
    if (titleLower.includes('gül')) return 'romantik';
    if (titleLower.includes('kasa') || titleLower.includes('sürpriz')) return 'surpriz';
    if (titleLower.includes('kafe') || titleLower.includes('menü')) return 'isletme';
    return 'sevgililer';
}

// Badge tespit fonksiyonu
function detectBadge(title) {
    for (const [keyword, badge] of Object.entries(badgeMappings)) {
        if (title.includes(keyword)) return badge;
    }
    return null;
}

// API'den ürün listesini çek
async function fetchProducts() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.shopier.com',
            path: '/v1/products',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.value || []);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Tek ürün detayını çek
async function fetchProductDetail(productId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.shopier.com',
            path: `/v1/products/${productId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Görsel URL'ini çıkar
function extractImageUrl(productJson) {
    const jsonStr = JSON.stringify(productJson);
    const match = jsonStr.match(/https:\/\/cdn\.shopier\.app\/pictures_large\/[^"]+\.(png|jpg|webp)/);
    return match ? match[0] : null;
}

// Mevcut ürünlerdeki açıklamaları bul
function findExistingProduct(shopierProductId) {
    return existingProducts.products?.find(p => p.shopierProductId === shopierProductId);
}

// Ana güncelleme fonksiyonu
async function updateProducts() {
    console.log('🔄 Shopier API\'den ürünler çekiliyor...\n');

    try {
        const productList = await fetchProducts();
        console.log(`✅ ${productList.length} ürün bulundu\n`);

        const updatedProducts = [];

        for (let i = 0; i < productList.length; i++) {
            const basicProduct = productList[i];
            const productId = basicProduct.id;

            console.log(`📦 [${i + 1}/${productList.length}] ${basicProduct.title || 'İsimsiz'} işleniyor...`);

            // Ürün detayını çek
            const detail = await fetchProductDetail(productId);

            // Görsel URL'ini çıkar
            const imageUrl = extractImageUrl(detail);

            // Fiyatı al
            const price = detail.priceData?.price ? parseFloat(detail.priceData.price) : 0;

            // Stok durumu
            const inStock = detail.variants?.[0]?.stockStatus !== 'outOfStock';

            // Mevcut üründen açıklamaları al
            const existing = findExistingProduct(productId);

            const product = {
                id: i + 1,
                shopierProductId: productId,
                name: detail.title || basicProduct.title,
                price: price,
                category: existing?.category || detectCategory(detail.title || ''),
                shopierUrl: `https://www.shopier.com/alnigamestudios/${productId}`,
                badge: existing?.badge || detectBadge(detail.title || ''),
                description: existing?.description || (detail.title || '').substring(0, 60) + '...',
                fullDescription: existing?.fullDescription || detail.description || 'Dijital ürün - Sipariş notuna isteklerinizi yazınız.',
                inStock: inStock,
                image: imageUrl || existing?.image || '',
                deliveryType: 'Dijital teslimat'
            };

            updatedProducts.push(product);

            // Rate limiting - 500ms bekle
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // products.js dosyasını oluştur
        const fileContent = `// Al&Ni Studios - Ürün Veritabanı (Shopier Orijinal Verileri + Detaylı Açıklamalar)
// Son güncelleme: ${new Date().toLocaleString('tr-TR')}
// Bu dosya GitHub Actions tarafından otomatik güncellenir

const products = ${JSON.stringify(updatedProducts, null, 4)};

// Kategori tanımları
const categories = ${JSON.stringify(categories, null, 4)};
`;

        fs.writeFileSync('products.js', fileContent, 'utf8');
        console.log('\n✅ products.js başarıyla güncellendi!');
        console.log(`📊 Toplam ${updatedProducts.length} ürün kaydedildi.`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

// Scripti çalıştır
updateProducts();
