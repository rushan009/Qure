const express = require('express');
const cors = require('cors');
const app = express();
// Routes
const authRoutes = require('./routes/auth.routes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get("/",(req, res)=>{
    res.send("Hello")
})

module.exports = app;