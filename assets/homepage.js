
        document.addEventListener("DOMContentLoaded", function () {
            const jobTitles = [
                "Software Engineer",
                "Marketing Manager",
                "Data Analyst",
                "Product Manager",
                "Graphic Designer",
                "Web Developer",
                "UX Designer",
                "Project Manager",
                "Sales Executive",
                "Content Writer",
                "Cybersecurity Analyst",
                "AI/ML Engineer",
                "Cloud Engineer",
                "DevOps Engineer",
                "Database Administrator",
                "Network Administrator",
                "Business Analyst",
                "SEO Specialist",
                "HR Manager",
                "Social Media Manager",
                "Software Architect",
                "IT Support Specialist",
                "Data Scientist",
                "Blockchain Developer",
                "E-commerce Manager",
                "Game Developer",
                "Mobile App Developer",
                "Financial Analyst",
                "Technical Writer",
                "Digital Marketing Specialist",
                "System Administrator"
            ];

            const jobTitleInput = document.getElementById("job-title");
            const jobSuggestionsDatalist = document.getElementById("job-suggestions");

            jobTitleInput.addEventListener("input", function () {
                const inputValue = jobTitleInput.value.toLowerCase();
                jobSuggestionsDatalist.innerHTML = "";

                if (inputValue) {
                    jobTitles.filter(title => title.toLowerCase().includes(inputValue))
                        .forEach(title => {
                            let option = document.createElement("option");
                            option.value = title;
                            jobSuggestionsDatalist.appendChild(option);
                        });
                }
            });

            const jobLocations = [
                "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
                "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
                "Surat", "Kanpur", "Nagpur", "Visakhapatnam", "Indore",
                "Thane", "Bhopal", "Patna", "Vadodara", "Ghaziabad",
                "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
                "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
                "Amritsar", "Navi Mumbai", "Allahabad", "Howrah", "Gwalior",
                "Jabalpur", "Coimbatore", "Vijayawada", "Jodhpur", "Madurai"
            ];

            const jobLocationInput = document.getElementById("job-location");
            const locationSuggestionsDatalist = document.getElementById("location-suggestions");

            jobLocationInput.addEventListener("input", function () {
                const inputValue = jobLocationInput.value.toLowerCase();
                locationSuggestionsDatalist.innerHTML = "";

                if (inputValue) {
                    jobLocations.filter(location => location.toLowerCase().includes(inputValue))
                        .forEach(location => {
                            let option = document.createElement("option");
                            option.value = location;
                            locationSuggestionsDatalist.appendChild(option);
                        });
                }
            });
        });
