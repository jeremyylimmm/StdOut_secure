const express = require('express');
const multer = require('multer');
const { default: OpenAI, toFile } = require('openai');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const audioFile = await toFile(req.file.buffer, 'audio.webm', {
      type: req.file.mimetype || 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-transcribe',
      language: 'en',
    });

    res.json({ text: transcription.text });
  } catch (err) {
    console.error('Whisper error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

module.exports = router;
