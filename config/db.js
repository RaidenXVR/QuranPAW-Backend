require('dotenv').config();  // Pastikan file .env dimuat dengan benar

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI; // Mendapatkan URI dari file .env
    
    // Log untuk memeriksa apakah MONGO_URI terdefinisi dengan benar
    console.log("Mongo URI:", dbUri);  // Memastikan bahwa nilai MONGO_URI sudah benar
    
    if (!dbUri) {
      console.error('MONGO_URI is not defined!');
      process.exit(1); // Keluar jika MONGO_URI tidak ditemukan
    }

    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Keluar jika terjadi error saat menghubungkan ke MongoDB
  }
};

module.exports = connectDB;
