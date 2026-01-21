const router = require('express').Router();
const COS = require('cos-nodejs-sdk-v5');
const sharp = require('sharp');

// 图片压缩配置
const COMPRESSION_CONFIG = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 80,
  maxSizeKB: 200
};

// 初始化 COS 客户端
function getCosClient() {
  if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY) {
    return null;
  }
  return new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
  });
}

const COS_BUCKET = process.env.COS_BUCKET;
const COS_REGION = process.env.COS_REGION || 'ap-shanghai';

/**
 * 压缩图片
 * @param {Buffer} imageBuffer - 原始图片数据
 * @param {string} contentType - 图片类型
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
async function compressImage(imageBuffer, contentType) {
  const originalSizeKB = imageBuffer.length / 1024;
  console.log(`原始图片大小: ${originalSizeKB.toFixed(2)}KB`);

  if (originalSizeKB <= COMPRESSION_CONFIG.maxSizeKB) {
    console.log('图片大小合适，无需压缩');
    return { buffer: imageBuffer, contentType };
  }

  try {
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`原始尺寸: ${metadata.width}x${metadata.height}`);

    let width = metadata.width;
    let height = metadata.height;

    if (width > COMPRESSION_CONFIG.maxWidth || height > COMPRESSION_CONFIG.maxHeight) {
      const ratio = Math.min(
        COMPRESSION_CONFIG.maxWidth / width,
        COMPRESSION_CONFIG.maxHeight / height
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    let compressedBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: COMPRESSION_CONFIG.quality, progressive: true })
      .toBuffer();

    const compressedSizeKB = compressedBuffer.length / 1024;
    console.log(`压缩后大小: ${compressedSizeKB.toFixed(2)}KB (节省 ${((1 - compressedSizeKB/originalSizeKB) * 100).toFixed(1)}%)`);

    return { buffer: compressedBuffer, contentType: 'image/jpeg' };
  } catch (error) {
    console.error('图片压缩失败，使用原图:', error.message);
    return { buffer: imageBuffer, contentType };
  }
}

/**
 * 上传到腾讯云 COS
 */
function uploadToCOS(cos, key, buffer, contentType) {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // 返回公开访问 URL
        const url = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;
        resolve({ url, ...data });
      }
    });
  });
}

/**
 * 从腾讯云 COS 删除
 */
function deleteFromCOS(cos, key) {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * 图片上传API
 * POST /api/upload/image
 *
 * 接收 base64 格式的图片数据，自动压缩后上传到腾讯云 COS 存储
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

    const cos = getCosClient();
    if (!cos || !COS_BUCKET) {
      return res.status(500).json({
        success: false,
        message: 'COS存储未配置，请联系管理员'
      });
    }

    // 解析 base64 图片数据
    let imageBuffer;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
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
      imageBuffer = Buffer.from(image, 'base64');
    }

    // 自动压缩图片
    const compressed = await compressImage(imageBuffer, contentType);
    imageBuffer = compressed.buffer;
    contentType = compressed.contentType;

    // 生成文件名
    const ext = contentType === 'image/jpeg' ? 'jpg' : (contentType.split('/')[1] || 'jpg');
    const finalFilename = filename
      ? filename.replace(/\.[^.]+$/, `.${ext}`)
      : `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const key = `${folder}/${finalFilename}`;

    // 上传到腾讯云 COS
    const result = await uploadToCOS(cos, key, imageBuffer, contentType);

    console.log('图片上传成功:', result.url);

    res.json({
      success: true,
      message: '上传成功',
      data: {
        url: result.url,
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

    const cos = getCosClient();
    if (!cos || !COS_BUCKET) {
      return res.status(500).json({
        success: false,
        message: 'COS存储未配置'
      });
    }

    // 从 URL 提取 key
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // 去掉开头的 /

    await deleteFromCOS(cos, key);

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
