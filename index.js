const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const open = require('open');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB Atlas connected successfully");
})
.catch(err => {
    console.error("MongoDB Atlas connection error:", err);
});

const app = express();
const port = 5001;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Session middleware
app.use(session({
    secret: 'workwise-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'workwise.sid'
}));

// Configure uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Import models
const User = require('./Backend/models/User');
const Company = require('./Backend/models/Company');
const Application = require('./Backend/models/Application');

// Page Routes
app.get('/', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        // User is authenticated, render homepage
        res.render('homepage');
    } else {
        // User is not authenticated, redirect to login
        res.redirect('/login');
    }
});

app.get('/homepage', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        res.render('homepage');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/companies', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        res.render('companies');
    } else {
        res.redirect('/login');
    }
});

app.get('/cart', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        res.render('cart');
    } else {
        res.redirect('/login');
    }
});

app.get('/apply', (req, res) => {
    // Check if user is authenticated
    if (req.session && req.session.userId) {
        res.render('apply');
    } else {
        res.redirect('/login');
    }
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully' 
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    // Clear session
    req.session.destroy();
    
    res.status(200).json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.get('/api/auth/status', (req, res) => {
  try {
    if (req.session && req.session.userId) {
      res.status(200).json({ 
        authenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username
        }
      });
    } else {
      res.status(200).json({ 
        authenticated: false 
      });
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/user-details', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Find user by ID
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user details
        res.status(200).json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Cart routes with improved error handling
app.get("/api/cart", async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            console.log('User not authenticated for cart access');
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Fetching cart for user:', req.session.userId);
        const applications = await Application.find({ 
            userId: req.session.userId 
        }).sort({ createdAt: -1 });
        
        console.log(`Found ${applications.length} applications in cart`);
        res.status(200).json({ 
            success: true, 
            cart: applications 
        });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch applications" 
        });
    }
});

app.post("/api/cart", async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            console.log('User not authenticated for cart addition');
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        const { companyId, companyName, name, email, resumePath } = req.body;
        console.log("Adding to cart:", { companyId, companyName, name, email });

        // Validate required fields
        if (!companyId || !companyName || !name || !email || !resumePath) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Verify company exists
        const company = await Company.findOne({ companyId });
        if (!company) {
            return res.status(404).json({
                success: false,
                error: "Company not found"
            });
        }

        // Create and save application
        const application = new Application({
            companyId,
            companyName,
            name,
            email,
            resumePath,
            userId: req.session.userId
        });

        await application.save();
        console.log("Application saved successfully:", application._id);

        res.status(201).json({ 
            success: true, 
            message: "Application added to cart",
            application: application
        });
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to add application to cart" 
        });
    }
});

app.delete("/api/cart/:companyId", async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Deleting application:', req.params.companyId);
        const result = await Application.deleteOne({ 
            companyId: req.params.companyId,
            userId: req.session.userId 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: "Application not found"
            });
        }

        res.status(200).json({ 
            success: true,
            message: "Application removed from cart"
        });
    } catch (err) {
        console.error("Error deleting application:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to delete application" 
        });
    }
});

app.delete("/api/cart", async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                error: "User not authenticated" 
            });
        }

        console.log('Clearing cart for user:', req.session.userId);
        const result = await Application.deleteMany({ 
            userId: req.session.userId 
        });

        res.status(200).json({ 
            success: true,
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Error clearing cart:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to clear cart" 
        });
    }
});

// Company routes with improved error handling
app.get('/api/companies', async (req, res) => {
    console.log('📊 Fetching ALL companies from MongoDB Atlas...');
    try {
        // Set cache control headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Direct query from MongoDB collection to get all companies
        const db = mongoose.connection.db;
        const companies = await db.collection('companies').find({}).toArray();
        console.log(`✅ Successfully fetched ${companies.length} companies directly from MongoDB Atlas`);
        
        // Return ALL companies
        res.status(200).json({ 
            success: true, 
            companies: companies,
            total: companies.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Error fetching companies from MongoDB Atlas:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch companies from database',
            error: err.message 
        });
    }
});

app.get('/api/companies/search', async (req, res) => {
    const searchTerm = req.query.name || '';
    console.log('🔍 Searching companies in MongoDB Atlas with term:', searchTerm);
    
    try {
        // Direct query from MongoDB collection for search
        const cp = require('./Backend/models/Company');
        const companies = await cp.find({});
        console.log(companies);
        
        console.log(`✅ Found ${companies.length} companies matching "${searchTerm}"`);
        
        res.status(200).json({ 
            success: true, 
            companies: companies,
            total: companies.length,
            searchTerm: searchTerm
        });
    } catch (err) {
        console.error('❌ Error searching companies in MongoDB Atlas:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search companies in database',
            error: err.message 
        });
    }
});

// Add endpoint for resume uploads
app.post('/upload-resume', upload.single('resume'), (req, res) => {
  console.log("Resume upload request received");
  try {
    if (!req.file) {
      console.error("No file uploaded in request");
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }
    
    console.log("File uploaded successfully:", req.file);
    // Return the filename which will be used to access the file
    res.status(200).json({ 
      success: true, 
      filename: req.file.filename 
    });
  } catch (err) {
    console.error("Error uploading resume:", err);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error: " + err.message 
    });
  }
});

// Apply endpoint for resume uploads
app.post('/apply', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            console.log('User not authenticated, redirecting to login');
            return res.redirect('/login');
        }

        const { companyId, companyName } = req.body;
        console.log('Apply request received:', { companyId, companyName });

        // Verify company exists in database
        const company = await Company.findOne({ companyId });
        if (!company) {
            console.error('Company not found:', companyId);
            return res.status(404).send('<h1>404 Not Found</h1><p>Company not found.</p>');
        }

        // Store company data in session
        req.session.applyData = {
            companyId: company.companyId,
            companyName: company.name
        };

        // Force session save and wait for it to complete
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    console.error('Failed to save session:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully:', req.session);
                    resolve();
                }
            });
        });

        res.redirect('/apply');
    } catch (err) {
        console.error('Error in apply route:', err);
        res.status(500).send('<h1>500 Internal Server Error</h1><p>Failed to process application.</p>');
    }
});

// Add back the /api/apply/data endpoint with proper JSON handling
app.get('/api/apply/data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Apply data requested. Session:', {
        userId: req.session?.userId,
        applyData: req.session?.applyData
    });

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to continue'
        });
    }

    if (!req.session.applyData) {
        return res.status(404).json({
            success: false,
            message: 'No application data found. Please select a company first.'
        });
    }

    return res.status(200).json({
        success: true,
        data: req.session.applyData
    });
});

// Keep the debug endpoint as well
app.get('/api/debug/session', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('Current session:', {
        id: req.session.id,
        userId: req.session.userId,
        applyData: req.session.applyData
    });
    res.json({
        authenticated: !!req.session.userId,
        hasApplyData: !!req.session.applyData,
        sessionId: req.session.id
    });
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newMessage = new Contact({ name, email, message });
    await newMessage.save();
    res.status(200).json({ message: "Message submitted successfully!" });
  } catch (err) {
    console.error(" Error saving contact message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a diagnostic endpoint
app.get('/api/debug/database', async (req, res) => {
    console.log('📊 Running database diagnostics...');
    try {
        // Check database details
        const result = await Company.checkAllCompanies();
        
        // Check if users collection exists and has data
        const db = mongoose.connection.db;
        const userCount = await db.collection('users').countDocuments();
        const applicationCount = await db.collection('applications').countDocuments();
        
        res.status(200).json({
            success: true,
            database: mongoose.connection.db.databaseName,
            collections: {
                companies: {
                    directCount: result.directCount,
                    mongooseCount: result.mongooseCount,
                    sampleCompanies: result.companies.slice(0, 5).map(c => c.name)
                },
                users: {
                    count: userCount
                },
                applications: {
                    count: applicationCount
                }
            }
        });
    } catch (err) {
        console.error('❌ Error during database diagnostics:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to run database diagnostics',
            error: err.message
        });
    }
});

// Then serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page not found' });
});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

// Update the server startup code at the end of the file
const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`\n✅ Server is running at: ${url}`);
        resolve();
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`\n❌ Port ${port} is already in use. Please:\n1. Close any other running servers\n2. Try a different port\n3. Wait a few seconds and try again`);
        } else {
          console.error('\n❌ Server error:', error);
        }
        reject(error);
      });
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      // Try to find an available port
      const newPort = port + 1;
      console.log(`\n🔄 Attempting to use port ${newPort} instead...`);
      port = newPort;
      await startServer(); // Recursively try the next port
    } else {
      console.error('\n❌ Failed to start server:', error);
      process.exit(1);
    }
  }
};

startServer();


