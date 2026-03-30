const app = require('./src/app');
const dotenv = require('dotenv');

dotenv.config();
const connectDB = require("./src/db/db")

const PORT = process.env.PORT || 5000;
connectDB()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});