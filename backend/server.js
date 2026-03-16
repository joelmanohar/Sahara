const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
app.use(express.json());

// DB Connection — skip if URI still has placeholder credentials
const mongoUri = process.env.MONGODB_URI || '';
const hasRealMongoUri = mongoUri.length > 0 && !mongoUri.includes('<');

if (hasRealMongoUri) {
    global.USE_DB = true;
    mongoose.connect(mongoUri)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    global.USE_DB = false;
    console.log('⚠️  No valid MONGODB_URI — running in mock (no-DB) mode.');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/guidance', require('./routes/guidance'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/accounts', require('./routes/accounts'));


// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
