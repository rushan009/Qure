const mongoose = require('mongoose')

function connectDB() {
    mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{

        console.log("database connected successfully");
    }
    )
    .catch((err)=>{
        console.error(err)
    })
}

module.exports = connectDB