const router = require('express').Router();
const { put, del } = require('@vercel/blob');

/**
 * 图片上传API
 * POST /api/upload/image
 *
 * 接收 base64 格式的图片数据，上传到 Vercel Blob 存储
 */
router.post('/image', async (req, res) => {
  try {
    const { image, filename, folder = 'images' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: '请提供图片数据'
      });
    }

    // 检查是否配置了 Blob 存储
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Blob存储未配置，请联系管理员'
      });
    }

    // 解析 base64 图片数据
    let imageBuffer;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
      // 格式: data:image/jpeg;base64,/9j/4AAQ...
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({
          success: false,
          message: '图片格式不正确'
        });
      }
      contentType = matches[1];
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      // 纯 base64 字符串
      imageBuffer = Buffer.from(image, 'base64');
    }

    // 生成文件名
    const ext = contentType.split('/')[1] || 'jpg';
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const blobPath = `${folder}/${finalFilename}`;

    // 上传到 Vercel Blob
    const blob = await put(blobPath, imageBuffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: false
    });

    console.log('图片上传成功:', blob.url);

    res.json({
      success: true,
      message: '上传成功',
      data: {
        url: blob.url,
        filename: finalFilename,
        size: imageBuffer.length,
        contentType: contentType
      }
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '上传失败: ' + error.message
    });
  }
});

/**
 * 删除图片
 * DELETE /api/upload/image
 */
router.delete('/image', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '请提供图片URL'
      });
    }

    // 检查是否配置了 Blob 存储
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Blob存储未配置'
      });
    }

    await del(url);

    res.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('图片删除失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败: ' + error.message
    });
  }
});

module.exports = router;
