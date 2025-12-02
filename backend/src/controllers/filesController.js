import { fetchStoredFile } from '../utils/fileStorage.js';

function streamToResponse(res, file, downloadName) {
  if (!file) {
    res.status(404).json({ message: 'Datei wurde nicht gefunden.' });
    return;
  }

  if (file.contentType) {
    res.setHeader('Content-Type', file.contentType);
  }
  if (file.contentLength) {
    res.setHeader('Content-Length', file.contentLength);
  }
  if (downloadName) {
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  }

  file.stream.once('error', (error) => {
    console.error('Error while streaming file from S3', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Datei konnte nicht geladen werden.' });
    } else {
      res.end();
    }
  });

  file.stream.pipe(res);
}

export async function streamFile(req, res) {
  const key = decodeURIComponent(req.params[0] || '');
  if (!key) {
    return res.status(400).json({ message: 'Ungültiger Dateipfad.' });
  }

  try {
    const file = await fetchStoredFile(key);
    streamToResponse(res, file);
  } catch (error) {
    console.error('Failed to stream file', error);
    res.status(500).json({ message: 'Datei konnte nicht geladen werden.' });
  }
}

export async function downloadFileByKey(key, res, downloadName) {
  try {
    const file = await fetchStoredFile(key);
    streamToResponse(res, file, downloadName);
  } catch (error) {
    console.error('Failed to download file', error);
    res.status(500).json({ message: 'Datei konnte nicht geladen werden.' });
  }
}
