document.addEventListener("DOMContentLoaded", async () => {
    if (await checkAuth()) {
        await loadCart();
        await updateCartCount();
    }
    const clearCartBtn = document.getElementById("clear-cart");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", clearCart);
    }
});

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = "/login";
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = "/login";
        return false;
    }
}

async function loadCart() {
    const container = document.getElementById("cart-items");
    const emptyMessage = document.getElementById("empty-cart-message");
  
    try {
      const res = await fetch("/api/cart", {
        credentials: "include",
      });
  
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
  
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
  
      const data = await res.json();
  
      if (!data.success || !data.cart || !data.cart.length) {
        emptyMessage.style.display = "block";
        container.innerHTML = `<div class="col-12 text-center"><p>Your cart is empty</p></div>`;
        return;
      }
  
      emptyMessage.style.display = "none";
      container.innerHTML = "";
  
      data.cart.forEach((app) => {
        const card = document.createElement("div");
        card.className = "col-md-4 mb-4";
        card.innerHTML = `
          <div class="card p-3 h-100">
            <h5>${app.companyName}</h5>
            <p><strong>Applicant:</strong> ${app.name}</p>
            <p><strong>Email:</strong> ${app.email}</p>
            <p><strong>Company ID:</strong> ${app.companyId}</p>
            <a href='https://modern-meet.vercel.app'><button id="vcbutton">Start a Video Call</button></a>
            <a href="/uploads/${app.resumePath}" target="_blank">📄 View Resume</a>
            <button class="btn btn-danger btn-sm mt-2 remove-item" data-id="${app.companyId}">Remove</button>
          </div>
        `;
        container.appendChild(card);
      });
  
      document.querySelectorAll(".remove-item").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const companyId = e.target.getAttribute("data-id");
          await removeFromCart(companyId);
        });
      });
    } catch (err) {
      console.error("Error fetching applications:", err);
      container.innerHTML = `<p class="text-danger text-center">⚠️ Failed to load applications: ${err.message}</p>`;
    }
}
  
async function removeFromCart(companyId) {
    try {
      const res = await fetch(`/api/cart/${companyId}`, {
        method: "DELETE",
        credentials: "include",
      });
  
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
  
      const data = await res.json();
  
      if (data.success) {
        await loadCart();
      } else {
        console.error('Failed to remove item:', data.error);
        alert('Failed to remove item from cart');
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
      alert("Failed to remove item from cart. Please try again.");
    }
}
  
async function clearCart() {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
      });
  
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
  
      const data = await res.json();
  
      if (data.success) {
        window.location.href = "/cart";
      } else {
        console.error('Failed to clear cart:', data.error);
        alert('Failed to clear cart');
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      alert("Failed to clear cart. Please try again.");
    }
}
  
async function updateCartCount() {
    try {
      const res = await fetch("/api/cart", {
        credentials: "include",
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          return;
        }
        throw new Error(`Server responded with status: ${res.status}`);
      }
  
      const data = await res.json();
      const cartCount = document.getElementById("cart-count");
      if (cartCount) {
        cartCount.textContent = data.cart ? data.cart.length : 0;
      }
    } catch (err) {
      console.error("Error updating cart count:", err);
    }
  }
  
async function addToCart(companyId, companyName) {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          companyId,
          companyName,
          name: document.getElementById("name").value,
          email: document.getElementById("email").value,
          resumePath: document.getElementById("resume").files[0]?.name || "",
        }),
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          alert("Please sign in to add items to cart");
          window.location.href = "/login.html";
          return;
        }
        throw new Error("Failed to add to cart");
      }
  
      const data = await res.json();
      if (data.success) {
        alert("Added to cart successfully!");
        window.location.href = "/cart.html";
      } else {
        alert(data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding to cart. Please try again.");
    }
  }
  
