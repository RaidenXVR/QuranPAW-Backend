const express = require('express');
const Bookmark = require('../models/Bookmark');
const router = express.Router();

// Tambah bookmark
router.post('/add', async (req, res) => {
    try {
        const { userId, surah, ayah } = req.body;

        if (!userId || !surah || !ayah) {
            return res.status(400).json({ message: 'Semua field (userId, surah, ayah) harus diisi' });
        }

        const bookmark = new Bookmark({ userId, surah, ayah });
        await bookmark.save();

        res.status(201).json({ message: 'Bookmark added successfully', bookmark });
    } catch (error) {
        console.error('Error adding bookmark:', error.message);
        res.status(500).json({ message: 'Failed to add bookmark', error: error.message });
    }
});

// Ambil bookmark berdasarkan userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'UserId diperlukan' });
        }

        const bookmarks = await Bookmark.find({ userId });

        if (bookmarks.length === 0) {
            return res.status(404).json({ message: 'Tidak ada bookmark ditemukan untuk user ini' });
        }

        res.json(bookmarks);
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).json({ message: 'Failed to fetch bookmarks', error: error.message });
    }
});

// Hapus bookmark berdasarkan verseKey
router.delete('/:verseKey', async (req, res) => {
    try {
        const { verseKey } = req.params;

        if (!verseKey) {
            return res.status(400).json({ message: 'VerseKey diperlukan' });
        }

        // Mencari bookmark berdasarkan verseKey
        const deletedBookmark = await Bookmark.findOneAndDelete({ verseKey });

        if (!deletedBookmark) {
            return res.status(404).json({ message: 'Bookmark tidak ditemukan' });
        }

        res.status(200).json({ message: 'Bookmark removed successfully' });
    } catch (error) {
        console.error('Error removing bookmark:', error.message);
        res.status(500).json({ message: 'Failed to remove bookmark', error: error.message });
    }
});

module.exports = router;
