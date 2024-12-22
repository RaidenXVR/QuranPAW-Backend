const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Pastikan bcryptjs terinstall
const jwt = require('jsonwebtoken');  // Jika Anda ingin menambahkan autentikasi berbasis JWT

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v); // Regex untuk validasi email
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true,
  },
});

// Password hashing sebelum menyimpan user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  // Jika password tidak diubah, lanjutkan

  // Generate salt dan hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Menambahkan metode untuk memverifikasi password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);  // Membandingkan password yang dimasukkan dengan yang terhash
};

// Menambahkan metode untuk menghasilkan JWT token (optional)
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ id: this._id }, 'secretkey', { expiresIn: '1h' });  // Menggunakan secret key untuk JWT token
  return token;
};

module.exports = mongoose.model('User', userSchema);
