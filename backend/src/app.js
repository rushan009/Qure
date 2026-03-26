const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const app = express();
// Routes
const authRoutes = require('./routes/auth.routes');

// Middleware


app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true,                // allow cookies
}));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get("/",(req, res)=>{
    res.send("Hello")
})

module.exports = app;