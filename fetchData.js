const axios = require('axios');

// Gantilah ':chapter_number' dengan ID surah yang sesuai
const chapterNumber = 1; // Misalnya untuk Surah Al-Fatihah, ID-nya adalah 1

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: `https://api.quran.com/api/v4/verses/by_chapter/${chapterNumber}`, // Gantilah bagian ini dengan chapter number yang sesuai
  headers: { 
    'Accept': 'application/json'
  }
};

axios(config)
.then((response) => {
  // Memeriksa apakah data tersedia dan menampilkan data ayat
  if (response.data && response.data.data && response.data.data.verses) {
    const verses = response.data.data.verses;
    verses.forEach((verse) => {
      console.log(`Ayat: ${verse.text_uthmani} | Terjemahan: ${verse.translation}`);
    });
  } else {
    console.log("Data ayat tidak ditemukan");
  }
})
.catch((error) => {
  console.log("Terjadi error:", error);
});
