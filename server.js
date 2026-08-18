const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Multer: save uploads with original extension preserved
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpe?g/i;
    cb(null, allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype));
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Upload an image and return its server path + raw XMP check
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid JPEG file uploaded.' });
  res.json({ filename: req.file.filename });
});

// Read GPano XMP tags + EXIF metadata via exiftool
app.get('/api/xmp/:filename', (req, res) => {
  const filepath = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found.' });

  const fields = [
    '-XMP:ProjectionType',
    '-XMP:UsePanoramaViewer',
    '-EXIF:DateTimeOriginal',
    '-EXIF:CreateDate',
    '-EXIF:Make',
    '-EXIF:Model',
    '-EXIF:ImageWidth',
    '-EXIF:ImageHeight',
    '-File:ImageWidth',
    '-File:ImageHeight',
    '-EXIF:ExposureTime',
    '-EXIF:FNumber',
    '-EXIF:ISO',
    '-EXIF:Flash',
    '-EXIF:ExposureProgram',
    '-EXIF:WhiteBalance',
    '-EXIF:MeteringMode',
  ].join(' ');

  exec(`exiftool ${fields} -json "${filepath}"`, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'exiftool failed.' });
    try {
      const data = JSON.parse(stdout)[0] || {};
      const panoramaRelevant = {};
      const relevantKeys = [
        'ProjectionType',
        'UsePanoramaViewer',
        'ImageWidth',
        'ImageHeight',
        'DateTimeOriginal',
        'CreateDate',
        'Make',
        'Model',
        'ExposureTime',
        'FNumber',
        'ISO',
        'Flash',
        'ExposureProgram',
        'WhiteBalance',
        'MeteringMode',
      ];

      relevantKeys.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          panoramaRelevant[key] = data[key];
        }
      });

      res.json({
        projectionType:   data.ProjectionType || null,
        usePanoramaViewer: data.UsePanoramaViewer || null,
        dateTime:         data.DateTimeOriginal || data.CreateDate || null,
        make:             data.Make || null,
        model:            data.Model || null,
        width:            data.ImageWidth || null,
        height:           data.ImageHeight || null,
        panoramaRelevant,
        raw: data,
      });
    } catch {
      res.status(500).json({ error: 'Failed to parse exiftool output.' });
    }
  });
});

// Write GPano equirectangular metadata via exiftool
app.post('/api/tag/:filename', (req, res) => {
  const filepath = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found.' });

  const cmd = `exiftool -overwrite_original \
    -XMP-GPano:ProjectionType="equirectangular" \
    -XMP-GPano:UsePanoramaViewer="True" \
    "${filepath}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'Failed to write metadata.', detail: stderr });
    res.json({ success: true });
  });
});

// Download the (tagged) file with original-style name
app.get('/api/download/:filename', (req, res) => {
  const filepath = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found.' });
  // Suggest a filename that makes it clear it has been tagged
  const ext = path.extname(req.params.filename);
  const base = path.basename(req.params.filename, ext);
  res.download(filepath, `${base}_tagged${ext}`);
});

// Cleanup: delete an uploaded file
app.delete('/api/file/:filename', (req, res) => {
  const filepath = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  fs.rm(filepath, () => res.json({ success: true }));
});

app.listen(PORT, () => {
  console.log(`er-viewer running at http://localhost:${PORT}`);
}).on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.\n   Run: kill $(lsof -ti :${PORT}) && npm start\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
