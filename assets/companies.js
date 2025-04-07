document.addEventListener("DOMContentLoaded", async function () {
    const companyNameInput = document.getElementById("company-name");
    const companySuggestionsDatalist = document.getElementById("company-suggestions");
    const companyGrid = document.getElementById("company-grid");
    const searchForm = document.querySelector(".search-form");
    let companies = [];
  
    async function loadCompanies() {
      try {
        const response = await fetch("data/companies.json");
        companies = await response.json();
        updateCompanySuggestions();
        // Don't display companies initially
        companyGrid.innerHTML = "<p class='text-center'>Please search for companies to see results.</p>";
      } catch (error) {
        console.error("Error loading company data:", error);
        companyGrid.innerHTML = "<p class='text-center'>Error loading companies. Please try again later.</p>";
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
      card.classList.add("company-card");
      // Use company ID instead of encoding the name
      const companyId = company.id;
      card.innerHTML = `
        <h3>${company.name}</h3>
        <p>${company.industry}</p>
        <p>Headquarters: ${company.headquarters}</p>
        <button class="btn view-details-btn" data-id="${companyId}">View Details</button>
        <div class="company-description" id="desc-${companyId}" style="display: none; margin-top: 10px;">
          <p>${company.description}</p>
          <button class="btn apply-btn" data-id="${companyId}" data-name="${encodeURIComponent(company.name)}">Apply</button>
        </div>
      `;
      return card;
    }
  
    function filterCompanyCards() {
      if (!companyGrid) return;
      const inputValue = companyNameInput ? companyNameInput.value.toLowerCase() : "";
      companyGrid.innerHTML = "";
  
      // If search input is empty, show message to search
      if (!inputValue) {
        companyGrid.innerHTML = "<p class='text-center'>Please search for companies to see results.</p>";
        return;
      }
  
      const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(inputValue)
      );
  
      if (filteredCompanies.length === 0) {
        companyGrid.innerHTML = "<p class='text-center'>No results found. Try a different search term.</p>";
        return;
      }
  
      // Create a container for the cards to center them
      const cardsContainer = document.createElement("div");
      cardsContainer.classList.add("d-flex", "flex-wrap", "justify-content-center", "gap-3");
      
      filteredCompanies.forEach(company => {
        const card = createCompanyCard(company);
        cardsContainer.appendChild(card);
      });
      
      companyGrid.appendChild(cardsContainer);
  
      attachViewDetailsListeners();
      attachApplyButtonListeners();
    }
  
    function attachViewDetailsListeners() {
      document.querySelectorAll(".view-details-btn").forEach(button => {
        button.addEventListener("click", function () {
          const companyId = this.getAttribute("data-id");
          const description = document.getElementById(`desc-${companyId}`);
          const isVisible = description.style.display === "block";
          description.style.display = isVisible ? "none" : "block";
          this.innerText = isVisible ? "View Details" : "Hide Details";
        });
      });
    }
  
    function attachApplyButtonListeners() {
      document.querySelectorAll(".apply-btn").forEach(button => {
        button.addEventListener("click", function () {
          const companyId = this.getAttribute("data-id");
          const companyName = this.getAttribute("data-name");
          window.location.href = `apply.html?companyId=${companyId}&companyName=${companyName}`;
        });
      });
    }
  
    if (companyNameInput) {
      // Update suggestions as user types
      companyNameInput.addEventListener("input", function() {
        updateCompanySuggestions();
        // Also update search results in real-time
        filterCompanyCards();
      });
    }
    
    if (searchForm) {
      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        filterCompanyCards();
      });
    }
  
    loadCompanies();
});

  