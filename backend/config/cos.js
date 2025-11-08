const fs = require('fs');
const path = require('path');

function parseCosEnv(filePath) {
  const cfg = {};
  try {
    if (!fs.existsSync(filePath)) return cfg;
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      // 支持有无引号的值，忽略尾部分号
      const m = line.match(/^\s*([^=]+)\s*=\s*['\"]?([^'";\r\n]+)['\"]?\s*;?\s*$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim();
      if (key && val) cfg[key] = val;
    }
  } catch (_) {
    // ignore
  }
  // normalize keys (support English and common Chinese labels)
  const norm = (k) => (cfg[k] || '').trim();
  let secretId = norm('SECRET_ID') || norm('SecretId') || norm('密钥ID') || norm('密钥');
  let secretKey = norm('SECRET_KEY') || norm('SecretKey') || norm('密钥KEY') || norm('密钥密文');
  let bucket = norm('BUCKET') || norm('Bucket') || norm('存储桶');
  let region = norm('REGION') || norm('Region') || norm('地域');

  // 轻度清洗无效空格
  bucket = bucket.replace(/\s+/g, '');
  region = region.replace(/\s+/g, '');

  return { secretId, secretKey, bucket, region };
}

function loadCosConfig() {
  // 支持两处 cos.env：项目根目录与 backend 目录内
  const rootCosEnv = path.join(__dirname, '../../cos.env');
  const backendCosEnv = path.join(__dirname, '../cos.env');
  const fromRoot = parseCosEnv(rootCosEnv);
  const fromBackend = parseCosEnv(backendCosEnv);

  const pick = (k) => {
    return process.env[k] || fromBackend[k.toLowerCase()] || fromRoot[k.toLowerCase()] || '';
  };

  const secretId = process.env.COS_SECRET_ID || fromBackend.secretId || fromRoot.secretId || '';
  const secretKey = process.env.COS_SECRET_KEY || fromBackend.secretKey || fromRoot.secretKey || '';
  const bucket = process.env.COS_BUCKET || fromBackend.bucket || fromRoot.bucket || '';
  const region = process.env.COS_REGION || fromBackend.region || fromRoot.region || '';

  const cfg = {
    secretId,
    secretKey,
    bucket,
    region,
    host: (bucket && region) ? `https://${bucket}.cos.${region}.myqcloud.com` : ''
  };

  // 打印一次配置概览（隐藏密钥），方便排查
  try {
    const mask = (s) => (s ? s.slice(0, 4) + '...' : '');
    console.log('[COS配置]', {
      bucket: cfg.bucket,
      region: cfg.region,
      secretId: mask(cfg.secretId),
      secretKey: mask(cfg.secretKey),
      host: cfg.host
    });
  } catch (_) {}

  return cfg;
}

module.exports = {
  loadCosConfig
};