const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const Company = require('./models/Company');

console.log('📊 Checking companies in MongoDB Atlas...');

// Connect to MongoDB Atlas
connectDB()
  .then(() => checkCompanies())
  .catch(err => {
    console.error("❌ MongoDB Atlas connection error:", err);
    process.exit(1);
  });

/**
 * Production-ready company check utility
 * This script only examines the database - it doesn't add any sample data
 */
async function checkCompanies() {
    try {
        // Check existing companies
        const existingCount = await Company.countDocuments();
        console.log(`📊 Found ${existingCount} companies in MongoDB Atlas database`);
        
        if (existingCount === 0) {
            console.log("⚠️ No companies found in the database.");
            console.log("ℹ️ To import companies, run the importCompanies.js script.");
        } else {
            // Get company distribution by industry
            const industries = await Company.aggregate([
                { $group: { _id: "$industry", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            console.log("\n📈 Companies by industry:");
            industries.forEach(industry => {
                console.log(`- ${industry._id || 'Unknown'}: ${industry.count} companies`);
            });
            
            // List a few sample companies
            console.log("\n🏢 Sample companies in database:");
            const sampleCompanies = await Company.find({});
            sampleCompanies.forEach(company => {
                console.log(`- ${company.name} (${company.companyId}) - ${company.industry}`);
            });
            
            if (existingCount > 5) {
                console.log(`... and ${existingCount - 5} more companies`);
            }
        }
        
        // Close the connection
        await mongoose.connection.close();
        console.log("\n👋 MongoDB Atlas connection closed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error checking companies:", error);
        
        try {
            await mongoose.connection.close();
        } catch (err) {
            console.error("❌ Error closing database connection:", err);
        }
        
        process.exit(1);
    }
} 