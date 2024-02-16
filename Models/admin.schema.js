const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true,
    unique: true
  },
  Password: {
    type: String,
    required: true
  }
},{
    versionKey:false
});

// Create the model
const User = mongoose.model('User', userSchema);

// Export the model
module.exports = {User};
