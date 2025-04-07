// Add to cart functionality
function addToCart(itemId, title, price) {
    fetch('/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            itemId: itemId,
            title: title,
            price: price,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Item added to cart successfully!');
            updateCartCount(data.cart.length);
        } else {
            alert('Error adding item to cart: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding item to cart. Please try again.');
    });
}

// Update cart count in the header
function updateCartCount(count) {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = count;
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/cart')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateCartCount(data.cart.length);
            }
        })
        .catch(error => {
            console.error('Error fetching cart:', error);
        });
}); 