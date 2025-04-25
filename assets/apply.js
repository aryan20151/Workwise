document.addEventListener("DOMContentLoaded", async () => {
    const companyDetailsDiv = document.getElementById("company-details");
    const applicationForm = document.getElementById("application-form");
    
    async function loadFormData() {
        try {
            // First check if we're authenticated
            const sessionResponse = await fetch("/api/debug/session");
            const sessionData = await sessionResponse.json();
            
            if (!sessionData.authenticated) {
                window.location.href = '/login';
                return;
            }

            if (!sessionData.hasApplyData) {
                throw new Error('No application data found. Please select a company first.');
            }

            console.log("Fetching company data from session...");
            // Fetch company data from session
            const companyResponse = await fetch("/api/apply/data");
            console.log("Company response status:", companyResponse.status);
            
            if (!companyResponse.ok) {
                const errorText = await companyResponse.text();
                console.error("Failed to get company data:", errorText);
                throw new Error('Failed to get company data');
            }
            
            const companyData = await companyResponse.json();
            console.log("Company data received:", companyData);
            
            if (!companyData.success || !companyData.data) {
                throw new Error(companyData.message || 'No company data found');
            }

            const { companyId, companyName } = companyData.data;
            console.log("Setting form fields with:", { companyId, companyName });

            // Set company information
            document.getElementById("companyId").value = companyId || '';
            document.getElementById("companyName").value = companyName || '';
            
            if (companyDetailsDiv) {
                companyDetailsDiv.innerHTML = companyName 
                    ? `<div class="alert alert-info">
                         <h4 class="alert-heading">Applying to: ${companyName}</h4>
                         <p>Please complete the form below to submit your application.</p>
                       </div>` 
                    : '';
            }
            
            console.log("Fetching user details...");
            // Fetch user information and pre-fill form
            const userResponse = await fetch("/api/auth/user-details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            
            console.log("User response status:", userResponse.status);
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log("User data received:", userData);
                
                if (userData.success && userData.user) {
                    // Pre-fill form with user data
                    document.getElementById("name").value = userData.user.username || '';
                    document.getElementById("email").value = userData.user.email || '';
                    
                    // Make name and email fields readonly since they're from user profile
                    document.getElementById("name").readOnly = true;
                    document.getElementById("email").readOnly = true;
                }
            } else {
                console.error("Failed to fetch user details:", await userResponse.text());
            }
        } catch (error) {
            console.error("Error initializing form:", error);
            if (companyDetailsDiv) {
                companyDetailsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading">Error</h4>
                        <p>${error.message}</p>
                        <hr>
                        <p class="mb-0">
                            <a href="/companies" class="alert-link">Return to Companies Page</a>
                        </p>
                    </div>`;
            }
            if (applicationForm) {
                applicationForm.style.display = 'none';
            }
        }
    }

    // Load form data when page loads
    await loadFormData();

    // Handle form submission
    if (applicationForm) {
        applicationForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

            try {
                const formData = new FormData(this);
                const resumeFile = formData.get("resume");
                console.log("Form data collected:", {
                    name: formData.get("name"),
                    email: formData.get("email"),
                    companyId: formData.get("companyId"),
                    companyName: formData.get("companyName"),
                    resumeFile: resumeFile ? resumeFile.name : "No file selected"
                });

                // First upload the resume file
                const uploadFormData = new FormData();
                uploadFormData.append("resume", resumeFile);
                
                const uploadRes = await fetch("/upload-resume", {
                    method: "POST",
                    body: uploadFormData
                });
                
                if (!uploadRes.ok) {
                    throw new Error(`Failed to upload resume: ${await uploadRes.text()}`);
                }
                
                const uploadResult = await uploadRes.json();
                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Failed to upload resume');
                }
                
                // Then add to cart with the resume path
                const cartRes = await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        companyId: formData.get("companyId"),
                        companyName: formData.get("companyName"),
                        name: formData.get("name"),
                        email: formData.get("email"),
                        resumePath: uploadResult.filename
                    })
                });

                const cartResult = await cartRes.json();
                if (!cartRes.ok || !cartResult.success) {
                    throw new Error(cartResult.message || cartResult.error || "Failed to add application to cart");
                }

                alert("✅ Application added to cart successfully!");
                window.location.href = "/cart";
            } catch (err) {
                console.error("Error during form submission:", err);
                alert("❌ Submission error: " + err.message);
                submitButton.disabled = false;
                submitButton.innerHTML = 'Apply';
            }
        });
    }
});