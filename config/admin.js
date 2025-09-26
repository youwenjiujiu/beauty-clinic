/**
 * 管理员配置
 */

// 从环境变量读取管理员OpenID列表
const ADMIN_OPENIDS = (process.env.ADMIN_OPENIDS || '').split(',').filter(id => id);

// 硬编码的管理员列表（备用）
const HARDCODED_ADMINS = [
  // 在这里添加你的OpenID
  // 'oXXXX-XXXXXXXXXXXXXXXXXX',  // DUDU_0o0
  // 'oYYYY-YYYYYYYYYYYYYYYY',    // 其他管理员
];

/**
 * 检查用户是否是管理员
 * @param {string} openId - 用户的OpenID
 * @returns {boolean}
 */
function isAdmin(openId) {
  if (!openId) return false;

  // 检查环境变量中的管理员列表
  if (ADMIN_OPENIDS.includes(openId)) {
    console.log(`管理员登录（环境变量）: ${openId}`);
    return true;
  }

  // 检查硬编码的管理员列表
  if (HARDCODED_ADMINS.includes(openId)) {
    console.log(`管理员登录（硬编码）: ${openId}`);
    return true;
  }

  return false;
}

/**
 * 获取所有管理员OpenID
 * @returns {string[]}
 */
function getAllAdminIds() {
  return [...new Set([...ADMIN_OPENIDS, ...HARDCODED_ADMINS])];
}

/**
 * 添加管理员（运行时）
 * @param {string} openId
 */
function addAdmin(openId) {
  if (!HARDCODED_ADMINS.includes(openId)) {
    HARDCODED_ADMINS.push(openId);
    console.log(`添加管理员: ${openId}`);
    return true;
  }
  return false;
}

/**
 * 移除管理员（运行时）
 * @param {string} openId
 */
function removeAdmin(openId) {
  const index = HARDCODED_ADMINS.indexOf(openId);
  if (index > -1) {
    HARDCODED_ADMINS.splice(index, 1);
    console.log(`移除管理员: ${openId}`);
    return true;
  }
  return false;
}

module.exports = {
  isAdmin,
  getAllAdminIds,
  addAdmin,
  removeAdmin
};