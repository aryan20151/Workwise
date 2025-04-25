document.addEventListener("DOMContentLoaded", async function () {
    const companyNameInput = document.getElementById("company-name");
    const companySuggestionsDatalist = document.getElementById("company-suggestions");
    const companyGrid = document.getElementById("company-grid");
    const searchForm = document.querySelector(".search-form");
    let companies = [];
  
    // Create a hidden form for company application
    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = '/apply';
    hiddenForm.style.display = 'none';
    document.body.appendChild(hiddenForm);

    async function loadCompanies() {
        console.log('🔄 Loading companies from MongoDB Atlas...');
        companyGrid.innerHTML = "<p class='text-center'>Loading companies from database...</p>";
        
        try {
            // Add a random query parameter to avoid caching
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/companies?nocache=${timestamp}`, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error('Server response:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }
            
            const data = await response.json();
            console.log('🔍 API Response:', data);
            
            if (data.success && Array.isArray(data.companies)) {
                companies = data.companies;
                console.log(`✅ Received ${companies.length} companies from MongoDB Atlas`);
                
                if (companies.length === 0) {
                    companyGrid.innerHTML = `
                        <div class="alert alert-warning text-center" role="alert">
                            <h4>No companies found in database</h4>
                            <p>Please make sure your MongoDB Atlas database contains companies.</p>
                        </div>`;
                    return;
                }
                
                console.log('📋 First 5 companies:', companies.slice(0, 5).map(c => c.name));
                updateCompanySuggestions();
                
                // Display all companies
                displayCompanies(companies);
            } else {
                throw new Error(data.message || 'Invalid data received from server');
            }
        } catch (error) {
            console.error("❌ Error loading companies:", error);
            companyGrid.innerHTML = `
                <div class="alert alert-danger text-center" role="alert">
                    <h4>Failed to load companies from MongoDB Atlas</h4>
                    <p>Error: ${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="loadCompanies()">Try Again</button>
                </div>`;
        }
    }
  
    async function searchCompanies(searchTerm) {
        console.log('🔍 Searching companies with term:', searchTerm);
        try {
            const response = await fetch(`/api/companies/search?name=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error('Server response:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }
            
            const data = await response.json();
            if (data.success && Array.isArray(data.companies)) {
                console.log(`✅ Found ${data.companies.length} matching companies`);
                return data.companies;
            } else {
                throw new Error(data.message || 'Invalid data received from server');
            }
        } catch (error) {
            console.error("❌ Error searching companies:", error);

        }
    }

    function updateCompanySuggestions() {
        if (!companySuggestionsDatalist) return;
        companySuggestionsDatalist.innerHTML = "";
        companies.forEach(company => {
            const option = document.createElement("option");
            option.value = company.name;
            companySuggestionsDatalist.appendChild(option);
        });
    }
  
    function createCompanyCard(company) {
        const card = document.createElement("div");
        card.classList.add("company-card", "card", "mb-3", "shadow-sm");
        card.innerHTML = `
            <div class="card-body">
                <h3 class="card-title">${company.name}</h3>
                <p class="card-text"><strong>Industry:</strong> ${company.industry}</p>
                <p class="card-text"><strong>Location:</strong> ${company.headquarters}</p>
                <button class="btn btn-info view-details-btn" data-id="${company.companyId}">View Details</button>
                <div class="company-description mt-3" id="desc-${company.companyId}" style="display: none;">
                    <p class="card-text">${company.description}</p>
                    <form action="/apply" method="POST" class="apply-form">
                        <input type="hidden" name="companyId" value="${company.companyId}">
                        <input type="hidden" name="companyName" value="${company.name}">
                        <button type="submit" class="btn btn-primary">Apply Now</button>
                    </form>
                </div>
            </div>
        `;
        return card;
    }
  
    function displayCompanies(companiesToShow) {
        if (!companyGrid) return;
        
        if (companiesToShow.length === 0) {
            companyGrid.innerHTML = `
                <div class="alert alert-info text-center" role="alert">
                    No companies available
                </div>`;
            return;
        }

        const cardsContainer = document.createElement("div");
        cardsContainer.classList.add("row", "justify-content-center", "g-4");
        
        companiesToShow.forEach(company => {
            const cardWrapper = document.createElement("div");
            cardWrapper.classList.add("col-12", "col-md-6", "col-lg-4");
            cardWrapper.appendChild(createCompanyCard(company));
            cardsContainer.appendChild(cardWrapper);
        });
        
        companyGrid.innerHTML = '';
        companyGrid.appendChild(cardsContainer);
        attachViewDetailsListeners();
    }
  
    async function filterCompanyCards() {
        if (!companyGrid) return;
        const searchTerm = companyNameInput ? companyNameInput.value.trim() : "";
        
        // Show loading state
        companyGrid.innerHTML = "<p class='text-center'>Searching...</p>";
  
        if (!searchTerm) {
            // If no search term, show all companies
            displayCompanies(companies);
            return;
        }
  
        const filteredCompanies = await searchCompanies(searchTerm);
        displayCompanies(filteredCompanies);
    }
  
    function attachViewDetailsListeners() {
        document.querySelectorAll(".view-details-btn").forEach(button => {
            button.addEventListener("click", function () {
                const companyId = this.getAttribute("data-id");
                const description = document.getElementById(`desc-${companyId}`);
                const isVisible = description.style.display === "block";
                description.style.display = isVisible ? "none" : "block";
                this.innerText = isVisible ? "View Details" : "Hide Details";
                this.classList.toggle("btn-info");
                this.classList.toggle("btn-secondary");
            });
        });
    }
  
    if (companyNameInput) {
        let debounceTimeout;
        companyNameInput.addEventListener("input", function() {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                filterCompanyCards();
            }, 300);
        });
    }
    
    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            filterCompanyCards();
        });
    }
  
    // Initial load of companies
    await loadCompanies();
});

  