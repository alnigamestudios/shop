// Al&Ni Studios - Application Logic

// Global state
let currentCategory = 'all';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const categoriesContainer = document.getElementById('categoriesContainer');
const header = document.getElementById('header');
const scrollTopBtn = document.getElementById('scrollTop');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.getElementById('nav');

// Product icons based on category/name
const productIcons = {
    'sevgililer': '💕',
    'tema': '🎬',
    'eglence': '🎮',
    'ozelgun': '🎂',
    'romantik': '🌹',
    'surpriz': '🎁',
    'isletme': '☕',
    'default': '✨'
};

// Badge mappings
const badgeClasses = {
    'Yeni': 'badge-new',
    'Popüler': 'badge-popular',
    'Premium': 'badge-premium',
    'Pro': 'badge-pro',
    'Sihirli': 'badge-magic',
    'En Uygun': 'badge-cheap'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderProducts();
    initEventListeners();
    createPreviewModal();
});

// Render category buttons
function renderCategories() {
    categoriesContainer.innerHTML = categories.map(category => `
        <button 
            class="category-btn ${category.id === 'all' ? 'active' : ''}" 
            data-category="${category.id}"
            onclick="filterByCategory('${category.id}')"
        >
            <span>${category.icon}</span>
            <span>${category.name}</span>
        </button>
    `).join('');
}

// Render products
function renderProducts(categoryFilter = 'all') {
    const filteredProducts = categoryFilter === 'all'
        ? products
        : products.filter(p => p.category === categoryFilter);

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>Ürün Bulunamadı</h3>
                <p>Bu kategoride henüz ürün bulunmuyor.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => {
        const icon = productIcons[product.category] || productIcons.default;
        const categoryInfo = categories.find(c => c.id === product.category);
        const categoryName = categoryInfo ? categoryInfo.name : 'Dijital Ürün';

        let badgeHTML = '';
        if (product.badge) {
            const badgeClass = badgeClasses[product.badge] || 'badge-new';
            badgeHTML = `<span class="product-badge ${badgeClass}">${product.badge}</span>`;
        }

        let stockOverlay = '';
        if (!product.inStock) {
            stockOverlay = `
                <div class="out-of-stock-overlay">
                    <span class="out-of-stock-text">Tükendi</span>
                </div>
            `;
        }

        return `
            <article class="product-card" data-category="${product.category}" data-product-id="${product.id}" onclick="openPreview(${product.id})">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="product-icon-fallback" style="display:none;">${icon}</span>
                    ${badgeHTML}
                    ${stockOverlay}
                </div>
                <div class="product-content">
                    <div class="product-category">${categoryName}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <div class="product-price">
                            ${product.price} <span>TL</span>
                        </div>
                        <div class="product-buttons">
                            <button class="preview-btn-outline" onclick="event.stopPropagation(); openPreview(${product.id})">
                                👁️ İncele
                            </button>
                            ${product.inStock
                ? `<a href="${product.shopierUrl}" target="_blank" class="buy-btn" onclick="event.stopPropagation()">
                                    🛒 Satın Al
                                   </a>`
                : `<button class="buy-btn" disabled>Tükendi</button>`
            }
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Add animation to cards
    animateCards();
}

// Create preview modal HTML
function createPreviewModal() {
    const modalHTML = `
        <div class="preview-overlay" id="previewOverlay" onclick="closePreview(event)">
            <div class="preview-modal" onclick="event.stopPropagation()">
                <div class="preview-image-container">
                    <img id="previewImage" src="" alt="">
                    <button class="preview-close" onclick="closePreview()">&times;</button>
                    <span class="preview-badge" id="previewBadge"></span>
                </div>
                <div class="preview-content">
                    <div class="preview-category" id="previewCategory"></div>
                    <h2 class="preview-title" id="previewTitle"></h2>
                    <p class="preview-description" id="previewDescription"></p>
                    <div class="preview-delivery">
                        <span class="preview-delivery-icon">⚡</span>
                        <span class="preview-delivery-text" id="previewDelivery">Dijital teslimat</span>
                    </div>
                </div>
                <div class="preview-footer">
                    <div class="preview-price" id="previewPrice">0 <span>TL</span></div>
                    <div class="preview-actions">
                        <a class="preview-btn preview-btn-primary" id="previewBuyBtn" href="#" target="_blank">
                            🛒 Satın Al
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Open preview modal
function openPreview(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const overlay = document.getElementById('previewOverlay');
    const categoryInfo = categories.find(c => c.id === product.category);

    // Fill modal content
    document.getElementById('previewImage').src = product.image;
    document.getElementById('previewImage').alt = product.name;
    document.getElementById('previewTitle').textContent = product.name;
    document.getElementById('previewCategory').textContent = categoryInfo ? categoryInfo.name : 'Dijital Ürün';
    document.getElementById('previewDescription').textContent = product.fullDescription || product.description;
    document.getElementById('previewDelivery').textContent = product.deliveryType || 'Dijital teslimat';
    document.getElementById('previewPrice').innerHTML = `${product.price} <span>TL</span>`;

    // Badge
    const badgeEl = document.getElementById('previewBadge');
    if (product.badge) {
        const badgeClass = badgeClasses[product.badge] || 'badge-new';
        badgeEl.className = `preview-badge ${badgeClass}`;
        badgeEl.textContent = product.badge;
        badgeEl.style.display = 'block';
    } else {
        badgeEl.style.display = 'none';
    }

    // Buy button
    const buyBtn = document.getElementById('previewBuyBtn');
    if (product.inStock) {
        buyBtn.href = product.shopierUrl;
        buyBtn.textContent = '🛒 Satın Al';
        buyBtn.style.opacity = '1';
        buyBtn.style.pointerEvents = 'auto';
    } else {
        buyBtn.href = '#';
        buyBtn.textContent = 'Tükendi';
        buyBtn.style.opacity = '0.5';
        buyBtn.style.pointerEvents = 'none';
    }

    // Show modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close preview modal
function closePreview(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('previewOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreview();
    }
});

// Filter products by category
function filterByCategory(categoryId) {
    currentCategory = categoryId;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryId) {
            btn.classList.add('active');
        }
    });

    // Re-render products
    renderProducts(categoryId);

    // Scroll to products section smoothly
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Animate product cards on render
function animateCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Initialize event listeners
function initEventListeners() {
    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Show/hide scroll to top button
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top button
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuBtn.textContent = nav.classList.contains('active') ? '✕' : '☰';
    });

    // Close mobile menu when clicking a link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            nav.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Expose functions to global scope
window.filterByCategory = filterByCategory;
window.openPreview = openPreview;
window.closePreview = closePreview;
