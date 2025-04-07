const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const open = require('open');

const app = express();
const port = 5000;

mongoose.connect("mongodb://localhost:27017/workwiseDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(" MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
  secret: 'workwise-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Import User model
const User = require('./Backend/models/User');

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

// Define API routes first
app.post("/api/cart", async (req, res) => {
  console.log("Cart API request received:", req.body);
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      console.error("User not authenticated");
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }

    const { companyId, companyName, name, email, resumePath } = req.body;
    console.log("Processing cart request for user:", req.session.userId);
    
    const application = new Application({
      companyId,
      companyName,
      name,
      email,
      resumePath,
      userId: req.session.userId
    });
    
    console.log("Saving application to database");
    await application.save();
    console.log("Application saved successfully");
    
    res.status(201).json({ 
      success: true, 
      message: "Application added to cart" 
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error: " + err.message 
    });
  }
});

app.get("/api/cart", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }

    const applications = await Application.find({ 
      userId: req.session.userId 
    }).sort({ createdAt: -1 });
    
    console.log("applications", applications);
    res.status(200).json({ success: true, cart: applications });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete one item
app.delete("/api/cart/:companyId", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }

    await Application.deleteOne({ 
      companyId: req.params.companyId,
      userId: req.session.userId 
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete all
app.delete("/api/cart", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }

    await Application.deleteMany({ userId: req.session.userId });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Then serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname)); 

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

const serveFile = (filePath, res) => {
  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      console.error("File read error:", err);
      res.status(500).send('<h1>500 Internal Server Error</h1>');
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(data);
    }
  });
};

app.get('/', (req, res) => {
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    // User is authenticated, redirect to homepage
    res.redirect('/homepage.html');
  } else {
    // User is not authenticated, redirect to login
    res.redirect('/login.html');
  }
});

app.get('/homepage.html', (req, res) => {
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    // User is authenticated, serve homepage
    serveFile('homepage.html', res);
  } else {
    // User is not authenticated, redirect to login
    res.redirect('/login.html');
  }
});

app.get('/about.html', (req, res) => serveFile('about.html', res));
app.get('/contact.html', (req, res) => serveFile('contact.html', res));
app.get('/companies.html', (req, res) => serveFile('companies.html', res));
app.get('/login.html', (req, res) => serveFile('login.html', res));
app.get('/signup.html', (req, res) => serveFile('signup.html', res));
app.get('/apply.html', (req, res) => {
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    // User is authenticated, serve apply page
    serveFile('apply.html', res);
  } else {
    // User is not authenticated, redirect to login
    res.redirect('/login.html');
  }
});
app.get('/cart.html', (req, res) => {
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    // User is authenticated, serve cart page
    serveFile('cart.html', res);
  } else {
    // User is not authenticated, redirect to login
    res.redirect('/login.html');
  }
});
app.get('*', (req, res) => serveFile('homepage.html', res));

const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  resumePath: String,
  companyId: String,
  companyName: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

app.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, companyId, companyName } = req.body;
    const resumePath = req.file?.path;

    if (!name || !email || !companyId || !companyName || !resumePath) {
      return res.status(400).send('<h1>400 Bad Request</h1><p>All fields including resume are required.</p>');
    }

    const application = new Application({ name, email, resumePath, companyId, companyName });
    await application.save();

    res.send('<h1>Application submitted successfully!</h1>');
  } catch (err) {
    console.error(" Error saving application:", err);
    res.status(500).send('<h1>500 Internal Server Error</h1><p>Failed to submit application.</p>');
  }
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

app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`\n✅ Server is running at: `, url); // cyan-colored clickable URL
});


