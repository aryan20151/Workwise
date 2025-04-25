// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fetch cart data from MongoDB
    fetch('/api/cart')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCartItems(data.cart);
            } else {
                console.error('Error fetching cart:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

function displayCartItems(cartItems) {
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    
    if (!cartContainer || !cartTotal || !cartCount) {
        console.error('Required cart elements not found');
        return;
    }

    // Clear existing items
    cartContainer.innerHTML = '';
    
    if (!cartItems || cartItems.length === 0) {
        cartContainer.innerHTML = '<p class="text-center">Your cart is empty</p>';
        cartTotal.textContent = '₹0.00';
        cartCount.textContent = '0';
        return;
    }

    let total = 0;
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-details">
                <h3>${item.title}</h3>
                <p class="price">₹${item.price.toFixed(2)}</p>
                <div class="quantity-controls">
                    <button onclick="updateQuantity('${item._id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item._id}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item._id}')">Remove</button>
        `;
        cartContainer.appendChild(itemElement);
    });

    cartTotal.textContent = `₹${total.toFixed(2)}`;
    cartCount.textContent = cartItems.length;
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;

    fetch('/api/cart/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            itemId: itemId,
            quantity: newQuantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCartItems(data.cart);
        } else {
            console.error('Error updating quantity:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function removeFromCart(itemId) {
    fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            itemId: itemId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCartItems(data.cart);
        } else {
            console.error('Error removing item:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function checkout() {
    fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order placed successfully!');
            window.location.href = '/orders';
        } else {
            alert('Error placing order: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    });
} 