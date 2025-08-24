const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middlewares/rateLimiter');
const authRoutes = require('./routes/authRoutes');


const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: false }));
app.use(express.json());
app.use(morgan('dev'));


app.use('/api/auth', rateLimiter);
app.use('/api/auth', authRoutes);


app.get('/health', (req, res) => res.json({ ok: true }));


module.exports = app;