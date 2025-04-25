const mongoose = require('mongoose');

// Define the schema
const companySchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: true
    },
    headquarters: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, { 
    timestamps: true,
    collection: 'Companies' // Explicitly set collection name
});

// Add debugging to log every query
companySchema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], function() {
    console.log('🔍 Executing query on collection:', this.model.collection.name);
    console.log('Query conditions:', this.getQuery());
    console.log('Model options:', this.model.schema.options);
});

// Add a static method to check all companies in the collection
companySchema.statics.checkAllCompanies = async function() {
    try {
        // Check if we're connected to the right database
        const db = mongoose.connection.db;
        console.log('Current database:', db.databaseName);
        
        // Check all collections
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Count companies directly from MongoDB
        const companiesCollection = db.collection('companies');
        const count = await companiesCollection.countDocuments();
        console.log(`Direct count from 'companies' collection: ${count}`);
        
        // Get companies via Mongoose
        const companies = await this.find({}).lean();
        console.log(`Companies retrieved via Mongoose: ${companies.length}`);
        
        return {
            directCount: count,
            mongooseCount: companies.length,
            companies: companies
        };
    } catch (error) {
        console.error('Error checking companies:', error);
        throw error;
    }
};

// Create and export the model
const Company = mongoose.model('Companies', companySchema);

// Log model creation
console.log('✅ Company model initialized:');
console.log(' - Collection name:', Company.collection.name);
console.log(' - Database:', mongoose.connection.name);

module.exports = Company; 