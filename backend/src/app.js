const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const app = express();
// Routes
const authRoutes = require('./routes/auth.routes');

// Middleware


app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('ngrok-free.dev') ||
      origin.includes('ngrok-free.app') ||
      origin.includes('ngrok.io') ||
      origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get("/",(req, res)=>{
    res.send("Hello")
})

module.exports = app;