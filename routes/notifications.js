const router = require('express').Router();
const axios = require('axios');

/**
 * 发送预约通知给管理员
 * POST /api/notifications/appointment
 */
router.post('/appointment', async (req, res) => {
  try {
    const {
      appointmentId,
      userName,
      userPhone,
      service,
      appointmentDate,
      appointmentTime,
      clinicName,
      notes,
      serviceType,
      advisorId
    } = req.body;

    console.log('收到预约通知请求:', req.body);

    // 这里可以实现多种通知方式：
    // 1. 微信订阅消息
    // 2. 企业微信机器人
    // 3. 邮件通知
    // 4. 短信通知

    // 方法1：使用企业微信机器人（最简单，无需额外配置）
    const webhookUrl = process.env.WECHAT_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        const message = {
          msgtype: 'markdown',
          markdown: {
            content: `## 📅 新预约通知
> 预约ID：${appointmentId}

**客户信息**
- 姓名：${userName}
- 联系方式：${userPhone}

**预约详情**
- 服务项目：${service}
- 预约日期：${appointmentDate}
- 预约时间：${appointmentTime}
- 机构：${clinicName || '未选择'}
- 服务类型：${serviceType === 'accompany' ? '陪同服务' : '独自前往'}

**备注**
${notes || '无'}

---
请及时处理该预约`
          }
        };

        await axios.post(webhookUrl, message);
        console.log('企业微信通知发送成功');
      } catch (webhookError) {
        console.error('企业微信通知发送失败:', webhookError.message);
      }
    }

    // 方法2：微信订阅消息（需要先配置模板ID和获取用户授权）
    // 注：这需要在微信公众平台配置模板并获取access_token
    const accessToken = await getWechatAccessToken();

    if (accessToken && process.env.ADMIN_OPENID) {
      try {
        // 获取管理员OpenID列表
        const adminOpenIds = process.env.ADMIN_OPENID.split(',');

        // 订阅消息模板ID（需要在微信公众平台申请）
        const templateId = process.env.NOTIFICATION_TEMPLATE_ID;

        if (templateId) {
          // 向每个管理员发送订阅消息
          for (const openId of adminOpenIds) {
            const notificationData = {
              touser: openId.trim(),
              template_id: templateId,
              page: '/pages/manage/config', // 管理员点击后跳转的页面
              data: {
                thing1: { value: userName }, // 客户姓名
                phone_number2: { value: userPhone }, // 联系方式
                thing3: { value: service }, // 服务项目
                date4: { value: `${appointmentDate} ${appointmentTime}` }, // 预约时间
                thing5: { value: notes?.substring(0, 20) || '无' } // 备注
              }
            };

            await sendSubscribeMessage(accessToken, notificationData);
          }
          console.log('订阅消息发送成功');
        }
      } catch (subscribeError) {
        console.error('订阅消息发送失败:', subscribeError.message);
      }
    }

    // 无论通知是否成功，都返回成功（不影响预约流程）
    res.json({
      success: true,
      message: '通知已发送',
      appointmentId
    });

  } catch (error) {
    console.error('处理通知请求失败:', error);
    // 即使失败也返回成功，不影响预约
    res.json({
      success: true,
      message: '通知处理完成',
      note: '部分通知可能发送失败'
    });
  }
});

/**
 * 获取微信 Access Token
 */
async function getWechatAccessToken() {
  try {
    const appId = process.env.WX_APP_ID;
    const appSecret = process.env.WX_APP_SECRET;

    if (!appId || !appSecret) {
      console.log('未配置微信 AppId 或 AppSecret');
      return null;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await axios.get(url);

    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      console.error('获取 Access Token 失败:', response.data);
      return null;
    }
  } catch (error) {
    console.error('获取 Access Token 异常:', error.message);
    return null;
  }
}

/**
 * 发送订阅消息
 */
async function sendSubscribeMessage(accessToken, data) {
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
  const response = await axios.post(url, data);

  if (response.data.errcode !== 0) {
    throw new Error(`发送失败: ${response.data.errmsg}`);
  }

  return response.data;
}

module.exports = router;
