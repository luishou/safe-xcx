// 测试后端接口的简单脚本
const axios = require('axios');

const BASE_URL = 'http://124.223.187.95:3300/api';

async function testAuth() {
  try {
    console.log('测试健康检查接口...');
    const healthRes = await axios.get('http://124.223.187.95:3300/health');
    console.log('健康检查响应:', healthRes.data);

    console.log('\n测试验证接口...');
    const verifyRes = await axios.post(BASE_URL + '/auth/verify', {
      token: 'test_token'
    });
    console.log('验证接口响应:', verifyRes.data);

  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };