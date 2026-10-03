import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handleChat, handleEnhancePrompt, handleGenerateImage } from './server/api.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.post('/api/chat', handleChat);
app.post('/api/generate-image', handleGenerateImage);
app.post('/api/enhance-prompt', handleEnhancePrompt);

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Korea AI server running on port ${PORT}`);
});
