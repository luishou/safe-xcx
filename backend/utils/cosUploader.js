const fs = require('fs');
const path = require('path');
const { getCosClient, cosConfig } = require('./cosClient');

async function uploadFileToCOS(localPath, keyInBucket) {
  const client = getCosClient();
  if (!client) {
    throw new Error('COS客户端未配置');
  }
  if (!cosConfig.bucket || !cosConfig.region) {
    throw new Error('COS存储桶或地域未配置');
  }
  const Key = keyInBucket.replace(/^\/+/, '');
  const Body = fs.createReadStream(localPath);

  await new Promise((resolve, reject) => {
    client.putObject({
      Bucket: cosConfig.bucket,
      Region: cosConfig.region,
      Key,
      Body,
    }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });

  const url = cosConfig.host ? `${cosConfig.host}/${Key}` : '';
  return { url, key: Key };
}

module.exports = {
  uploadFileToCOS
};