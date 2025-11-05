const pool = require('./config/database');

async function fixImageData() {
  try {
    console.log('开始修复图片数据...');

    // 获取所有包含initial_images的记录
    const [rows] = await pool.execute(`
      SELECT id, initial_images, rectified_images
      FROM reports
      WHERE initial_images IS NOT NULL OR rectified_images IS NOT NULL
    `);

    console.log(`找到 ${rows.length} 条记录需要检查`);

    for (const row of rows) {
      console.log(`处理记录 ID: ${row.id}`);

      let needUpdate = false;
      let newInitialImages = row.initial_images;
      let newRectifiedImages = row.rectified_images;

      // 修复initial_images
      if (row.initial_images) {
        const fixedImages = fixImageArray(row.initial_images);
        if (fixedImages !== row.initial_images) {
          newInitialImages = fixedImages;
          needUpdate = true;
          console.log(`修复 initial_images: ${row.initial_images} -> ${fixedImages}`);
        }
      }

      // 修复rectified_images
      if (row.rectified_images) {
        const fixedImages = fixImageArray(row.rectified_images);
        if (fixedImages !== row.rectified_images) {
          newRectifiedImages = fixedImages;
          needUpdate = true;
          console.log(`修复 rectified_images: ${row.rectified_images} -> ${fixedImages}`);
        }
      }

      // 如果需要更新，执行更新
      if (needUpdate) {
        await pool.execute(`
          UPDATE reports
          SET initial_images = ?, rectified_images = ?
          WHERE id = ?
        `, [newInitialImages, newRectifiedImages, row.id]);

        console.log(`✓ 更新记录 ID: ${row.id}`);
      }
    }

    console.log('✅ 修复完成！');
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await pool.end();
  }
}

function fixImageArray(data) {
  if (!data) return null;

  // 如果已经是数组，转换为JSON字符串
  if (Array.isArray(data)) {
    return JSON.stringify(data);
  }

  // 如果是字符串
  if (typeof data === 'string') {
    try {
      // 尝试直接解析JSON
      JSON.parse(data);
      return data; // 如果解析成功，说明已经是有效JSON
    } catch (e) {
      // 解析失败，尝试修复

      // 处理JavaScript数组格式 [ 'url' ] -> ["url"]
      if (data.startsWith('[') && data.endsWith(']')) {
        // 将单引号替换为双引号
        let fixed = data.replace(/'/g, '"');

        try {
          JSON.parse(fixed); // 验证修复后的数据
          return fixed;
        } catch (e2) {
          // 如果还是失败，尝试提取URL
          const urlMatch = data.match(/https?:\/\/[^\s"'\]]+/g);
          if (urlMatch && urlMatch.length > 0) {
            return JSON.stringify(urlMatch);
          }
        }
      }
    }
  }

  return data; // 如果无法修复，返回原数据
}

// 运行修复
if (require.main === module) {
  fixImageData();
}

module.exports = { fixImageData, fixImageArray };