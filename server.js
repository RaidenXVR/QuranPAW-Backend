require('dotenv').config(); // Memuat variabel lingkungan dari file .env
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Sesuaikan dengan URL frontend Anda
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());  // Middleware untuk meng-handle request JSON

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Model Bookmark dan User
const bookmarkSchema = new mongoose.Schema({
  verseKey: String,
  text: String,
  translation: String,
  userId: String, // Menambahkan userId untuk autentikasi bookmark
});
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

// Schema dan Model User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Middleware untuk autentikasi
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token not provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Menyimpan decoded user ke dalam request untuk digunakan pada route
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Endpoint untuk registrasi
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validasi input
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Harap isi semua kolom' });
  }

  // Cek apakah username sudah ada
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ msg: 'Username sudah terdaftar' });
  }

  // Cek apakah email sudah ada
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ msg: 'Email sudah terdaftar' });
  }

  // Enkripsi password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Simpan user baru ke database
  const newUser = new User({
    username,
    email,
    password: hashedPassword
  });

  try {
    await newUser.save();
    res.status(201).json({ msg: 'Registrasi berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint untuk login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi jika email atau password kosong
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Mencari pengguna berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verifikasi password yang dimasukkan dengan password yang di-hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token menggunakan JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Kirim token sebagai respon
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// Endpoint untuk logout
app.post('/api/logout', (req, res) => {
  // Hanya hapus token dari klien, karena logout dikelola di klien
  res.status(200).json({ message: 'Logout berhasil' });
});

// Endpoint untuk menambahkan bookmark
app.post('/api/bookmarks', authenticate, async (req, res) => {
  try {
    const { verseKey, text, translation } = req.body;
    const newBookmark = new Bookmark({
      verseKey,
      text,
      translation,
      userId: req.user.id  // Menyimpan userId terkait bookmark
    });
    await newBookmark.save();

    res.status(201).json({ message: 'Bookmark added successfully', bookmark: newBookmark });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Failed to add bookmark' });
  }
});

// Endpoint untuk mendapatkan bookmark berdasarkan user
app.get('/api/bookmarks', authenticate, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id });
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Gagal mengambil bookmarks' });
  }
});

app.delete('/api/bookmarks/:id', authenticate, async (req, res) => {
  const bookmarkId = req.params.id;  // Pastikan ID bookmark diambil dari URL params
  console.log('Trying to delete bookmark with ID:', bookmarkId);  // Log ID bookmark yang ingin dihapus

  try {
    const deletedBookmark = await Bookmark.findOneAndDelete({
      _id: bookmarkId,
      userId: req.user.id,  // Pastikan user yang menghapus adalah pemilik bookmark
    });

    if (!deletedBookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.status(200).json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ message: 'Failed to delete bookmark' });
  }
});

app.get('/api/get_audio/:chapter_id/', async (req, res) => {
  const { chapter_id } = req.params;
  const { chapter_length } = req.query;
  const base_url = "https://verses.quran.com/";
  const urls = [];

  await axios.get(`https://api.quran.com/api/v4/recitations/2/by_chapter/${chapter_id}?per_page=${chapter_length}`)
    .then((result) => {
      var verses = result.data.audio_files;
      verses.forEach((audio_file) => {
        urls.push(base_url + audio_file.url);

      })
      return res.status(200).send({ "urls": urls })
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).send({ "message": "Something is wrong with the request" });
    });
})


app.post('/api/audio_files/', async (req, res) => {
  const { verse_keys } = req.body;
  const base_url = "https://verses.quran.com/";
  const urls = [];

  verse_keys.forEach(async (verseKey) => {

    await axios.get(`https://api.quran.com/api/v4/quran/recitations/2?verse_key=${verseKey}`)
      .then((result) => {
        var audio_file = result.data.audio_files[0];
        urls.push({ "verse_key": verseKey, "audio_url": base_url + audio_file.url });

        if (urls.length === verse_keys.length) {
          return res.status(200).send({ "urls": urls })
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).send({ "message": "Something is wrong with the request" });
      });
  })
})

// Pastikan server berjalan pada port 5000
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
