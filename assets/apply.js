document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get("companyId");
    const companyName = decodeURIComponent(params.get("companyName") || '');

    document.getElementById("companyId").value = companyId || '';
    document.getElementById("companyName").value = companyName || '';
    document.getElementById("company-details").innerHTML = companyName 
      ? `<h2>Applying to: ${companyName}</h2>` 
      : '';
      
    console.log("Form initialized with companyId:", companyId, "companyName:", companyName);
  });

  // Handle form submission
  document.getElementById("application-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Form submission started");

    const formData = new FormData(this);
    const resumeFile = formData.get("resume");
    console.log("Form data collected:", {
      name: formData.get("name"),
      email: formData.get("email"),
      companyId: formData.get("companyId"),
      companyName: formData.get("companyName"),
      resumeFile: resumeFile ? resumeFile.name : "No file selected"
    });
    
    // Create a new FormData object for the file upload
    const uploadFormData = new FormData();
    uploadFormData.append("resume", resumeFile);
    
    try {
      console.log("Attempting to upload resume file...");
      // First upload the resume file
      const uploadRes = await fetch("/upload-resume", {
        method: "POST",
        body: uploadFormData
      });
      
      console.log("Upload response status:", uploadRes.status);
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Upload failed with status:", uploadRes.status, "Response:", errorText);
        throw new Error(`Failed to upload resume: ${uploadRes.status} ${errorText}`);
      }
      
      const uploadResult = await uploadRes.json();
      console.log("Upload successful, result:", uploadResult);
      const resumePath = uploadResult.filename;
      
      console.log("Attempting to add application to cart...");
      // Then add to cart with the resume path
      const res = await fetch("/api/cart", {
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
          resumePath: resumePath
        })
      });

      console.log("Cart API response status:", res.status);
      const result = await res.json(); 
      console.log("Cart API response:", result);

      if (res.ok) {
        alert("✅ Application added to cart successfully!");
        window.location.href = "/cart.html";
      } else {
        alert("❌ Submission failed:\n" + (result.message || result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error during form submission:", err);
      alert("❌ Submission error. Please try again. Error: " + err.message);
    }
  });