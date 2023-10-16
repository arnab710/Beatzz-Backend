const mongoose = require('mongoose');
const DbString = process.env.DB_STRING.replace('<password>',process.env.DB_PASSWORD);

const dbConnection = async()=>{

    try{
    await mongoose.connect(DbString);
    console.log("DB Connected");
    }
    catch(err){
        process.exit(1); // Exit process with failure
    }
}

module.exports = dbConnection;