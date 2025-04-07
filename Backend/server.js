const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/workwise', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Models
const Cart = require('./models/Cart');
const User = require('./models/User');
const Job = require('./models/Job');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/homepage.html'));
});

// Cart API Endpoints
app.get('/api/cart', async (req, res) => {
    try {
        const cart = await Cart.find();
        res.json({ success: true, cart });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/cart/add', async (req, res) => {
    try {
        const { itemId, title, price, quantity } = req.body;
        const cartItem = new Cart({
            itemId,
            title,
            price,
            quantity
        });
        await cartItem.save();
        const cart = await Cart.find();
        res.json({ success: true, cart });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/cart/update', async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        await Cart.findByIdAndUpdate(itemId, { quantity });
        const cart = await Cart.find();
        res.json({ success: true, cart });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    try {
        const { itemId } = req.body;
        await Cart.findByIdAndDelete(itemId);
        const cart = await Cart.find();
        res.json({ success: true, cart });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/cart/checkout', async (req, res) => {
    try {
        await Cart.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 