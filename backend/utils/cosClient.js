const COS = require('cos-nodejs-sdk-v5');
const { loadCosConfig } = require('../config/cos');

const cfg = loadCosConfig();

let client = null;
function getCosClient() {
  if (client) return client;
  if (!cfg.secretId || !cfg.secretKey) {
    console.warn('[COS] SecretId/SecretKey not configured. Please set in cos.env or environment.');
    return null;
  }
  client = new COS({
    SecretId: cfg.secretId,
    SecretKey: cfg.secretKey,
  });
  return client;
}

module.exports = {
  getCosClient,
  cosConfig: cfg
};