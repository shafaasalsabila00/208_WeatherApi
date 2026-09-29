require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

// Ambil nama wilayah dari feature MapTiler berdasarkan tipe (country, region, dst.)
function ambilWilayah(feature, tipe) {
  const tipeFeature = feature.place_type || [];
  if (tipe.some((t) => tipeFeature.includes(t))) return feature.text;

  const konteks = feature.context || [];
  const ketemu = konteks.find((c) => tipe.some((t) => c.id.startsWith(t)));
  return ketemu ? ketemu.text : null;
}

app.get("/api/lokasi", async (req, res) => {
  const kota = (req.query.q || "").trim();
  const apiKey = process.env.MAPTILER_API_KEY;
  const baseUrl = process.env.MAPTILER_BASE_URL;

  if (!kota) {
    return res.status(400).json({ message: "Isi nama lokasi terlebih dahulu" });
  }

  const url = `${baseUrl}/${encodeURIComponent(kota)}.json?key=${apiKey}&limit=1&language=id`;

  try {
    const response = await axios.get(url);
    const feature = response.data.features[0];

    if (!feature) {
      return res.status(404).json({ message: `Lokasi "${kota}" tidak ditemukan` });
    }

    const [longitude, latitude] = feature.geometry.coordinates;

    res.json({
      lokasi: feature.text,
      alamat_lengkap: feature.place_name,
      negara: ambilWilayah(feature, ["country"]),
      provinsi: ambilWilayah(feature, ["region"]),
      kecamatan: ambilWilayah(feature, ["municipal_district", "county", "locality"]),
      longitude,
      latitude,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});