# WorkWise - Job Application Portal

A Node.js web application for job searching and applications, using MongoDB Atlas for data storage.

## Database Setup

This application uses MongoDB Atlas for data storage. The connection is already configured to use a specific Atlas cluster:


## Project Structure

- `website.js` - Main application entry point
- `Backend/` - Backend code and database models
  - `models/` - Mongoose models for database entities
  - `config/` - Configuration files including database connection
- `views/` - EJS templates for frontend pages
- `public/` - Static files (CSS, client-side JS)
- `assets/` - Application assets and frontend JavaScript
- `uploads/` - Uploaded files (resumes, etc.)

## Available Commands

- `npm start` - Start the application
- `npm run dev` - Start with nodemon for development
- `node Backend/seedCompanies.js` - Check companies in the database
- `node Backend/importCompanies.js` - Import companies from a JSON file

## Data Models

### Companies

Companies are stored in the MongoDB Atlas database with the following schema:

- `companyId` - Unique identifier for the company
- `name` - Company name
- `industry` - Industry sector
- `headquarters` - Company headquarters location
- `description` - Company description

### Users

Users can register, log in, and apply to companies. User data includes:

- `username` - User's chosen username
- `email` - User's email address
- `password` - Encrypted password
- `profile` - Additional user profile information

### Applications

When users apply to companies, application data is stored with:

- `companyId` - ID of the company
- `companyName` - Name of the company
- `name` - Applicant's name
- `email` - Applicant's email
- `resumePath` - Path to the uploaded resume
- `userId` - ID of the user who applied

## Importing Data

To import company data, create a JSON file at `data/companies.json` with the following structure:

```json
[
  {
    "id": "COMPANY001",
    "name": "Company Name",
    "industry": "Industry",
    "headquarters": "Location",
    "description": "Description of the company"
  }
]
```

Then run:

```
node Backend/importCompanies.js 