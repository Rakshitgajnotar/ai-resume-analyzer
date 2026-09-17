const pdf = require('pdf-parse');
const axios = require('axios');

async function extractTextFromPdfUrl(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.error('Error extracting text from PDF:', err);
    throw new Error('Failed to extract text from PDF');
  }
}

module.exports = {
  extractTextFromPdfUrl
};
