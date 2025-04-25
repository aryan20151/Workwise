// Authentication handling
document.addEventListener("DOMContentLoaded", async () => {
    // Check if user is already authenticated in localStorage
    const storedUser = localStorage.getItem('workwise_user');
    if (storedUser) {
        try {
            // Verify the stored session is still valid
            const response = await fetch("/api/auth/status", {
                credentials: "include"
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // User is still authenticated on the server
                    updateHeaderForLoggedInUser(data.user);
                    return;
                }
            }
            
            // If we get here, the stored session is invalid
            localStorage.removeItem('workwise_user');
        } catch (error) {
            console.error("Error verifying stored session:", error);
            localStorage.removeItem('workwise_user');
        }
    }
    
    // Check authentication status from server
    await checkAuthStatus();
    
    // Set up event listeners for login, signup, and signout forms
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }
    
    // Add event listener for signout button after a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        const signoutButton = document.getElementById("signout-button");
        if (signoutButton) {
            console.log("Signout button found, adding event listener");
            signoutButton.addEventListener("click", handleSignout);
        } else {
            console.log("Signout button not found");
        }
    }, 500);
});

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch("/api/auth/status", {
            credentials: "include"
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store user data in localStorage if authenticated
        if (data.authenticated && data.user) {
            localStorage.setItem('workwise_user', JSON.stringify(data.user));
        } else {
            localStorage.removeItem('workwise_user');
        }
        
        // Update header based on authentication status
        if (data.authenticated) {
            updateHeaderForLoggedInUser(data.user);
            
            // If on login or signup page, redirect to homepage
            if (window.location.pathname.includes('/login') || 
                window.location.pathname.includes('/signup')) {
                window.location.href = "/homepage";
            }
        } else {
            updateHeaderForLoggedOutUser();
            
            // If not on login or signup page, redirect to login
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/signup') &&
                !window.location.pathname.includes('/about') &&
                !window.location.pathname.includes('/contact') &&
                !window.location.pathname.includes('/companies')) {
                window.location.href = "/login";
            }
        }
    } catch (error) {
        console.error("Error checking auth status:", error);
        updateHeaderForLoggedOutUser();
    }
}

// Update header for logged in user
function updateHeaderForLoggedInUser(user) {
    // Hide sign in/sign up links
    const authLinks = document.querySelectorAll(".auth-links");
    authLinks.forEach(link => {
        link.style.display = "none";
    });
    
    // Show user profile and cart
    const userProfile = document.querySelector(".user-profile");
    const cartLink = document.querySelector(".cart-link");
    
    if (userProfile) {
        userProfile.style.display = "block";
        const usernameElement = userProfile.querySelector(".username");
        if (usernameElement && user.username) {
            usernameElement.textContent = user.username;
        }
        
        // Add event listener to signout button
        const signoutButton = userProfile.querySelector("#signout-button");
        if (signoutButton) {
            console.log("Signout button found in updateHeaderForLoggedInUser");
            signoutButton.addEventListener("click", handleSignout);
        }
    }
    
    if (cartLink) {
        cartLink.style.display = "block";
    }
}

// Update header for logged out user
function updateHeaderForLoggedOutUser() {
    // Show sign in/sign up links
    const authLinks = document.querySelectorAll(".auth-links");
    authLinks.forEach(link => {
        link.style.display = "block";
    });
    
    // Hide user profile and cart
    const userProfile = document.querySelector(".user-profile");
    const cartLink = document.querySelector(".cart-link");
    
    if (userProfile) {
        userProfile.style.display = "none";
    }
    
    if (cartLink) {
        cartLink.style.display = "none";
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data in localStorage
            localStorage.setItem('workwise_user', JSON.stringify(data.user));
            
            // Update header and redirect
            updateHeaderForLoggedInUser(data.user);
            window.location.href = "/homepage";
        } else {
            alert(data.message || "Login failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    
    try {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert("Account created successfully! Please log in.");
            window.location.href = "/login";
        } else {
            alert(data.message || "Signup failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during signup:", error);
        alert("An error occurred during signup. Please try again.");
    }
}

// Handle signout
async function handleSignout() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear user data from localStorage
            localStorage.removeItem('workwise_user');
            
            // Update header and redirect
            updateHeaderForLoggedOutUser();
            window.location.href = "/login";
        } else {
            alert(data.message || "Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred during logout. Please try again.");
    }
} 