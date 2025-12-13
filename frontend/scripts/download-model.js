import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip';
const DEST_DIR = path.join(__dirname, '../public/models');
const ZIP_PATH = path.join(DEST_DIR, 'model.zip');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

console.log(`Downloading model from ${MODEL_URL}...`);

const file = fs.createWriteStream(ZIP_PATH);

https
  .get(MODEL_URL, (response) => {
    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log(
        'Download completed. extracting is not implemented in this script, please unzip specifically to public/models/vosk-model-small-en-in-0.4'
      );
      console.log(`File saved to ${ZIP_PATH}`);
    });
  })
  .on('error', (err) => {
    fs.unlink(ZIP_PATH, () => {}); // Delete the file async. (But we don't check the result)
    console.error(`Error downloading file: ${err.message}`);
  });
