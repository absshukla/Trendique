// This is your database. Add your new posts and product links here.
const socialData = [
    {
        id: 1,
        postImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500", // Your social post thumbnail
        products: [
            {
                name: "Summer Floral Kurta",
                price: "$35.00",
                image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150", // Product isolated image
                link: "https://your-checkout-link.com/product1"
            },
            {
                name: "Slightly Green Pants",
                price: "$45.00",
                image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=150", 
                link: "https://your-checkout-link.com/product2"
            }
        ]
    }
    // To add a new post, just copy the {} block above and paste it below, separated by a comma!
];

const feedGrid = document.getElementById('feed-grid');
const modal = document.getElementById('product-modal');
const closeBtn = document.querySelector('.close-btn');
const modalImage = document.getElementById('modal-image');
const modalProducts = document.getElementById('modal-products');

// 1. Render the Social Grid on the homepage
socialData.forEach(post => {
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `<img src="${post.postImage}" alt="Social Post">`;
    
    // 2. Add Click Event to open the shopping window
    item.addEventListener('click', () => {
        modalImage.src = post.postImage;
        modalProducts.innerHTML = '<h2>Shop this look</h2>';
        
        post.products.forEach(product => {
            modalProducts.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <h3>${product.name}</h3>
                        <p>${product.price}</p>
                        <a href="${product.link}" class="buy-btn" target="_blank">Buy Now</a>
                    </div>
                </div>
            `;
        });
        
        modal.style.display = 'block';
    });
    
    feedGrid.appendChild(item);
});

// Close window logic
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};
