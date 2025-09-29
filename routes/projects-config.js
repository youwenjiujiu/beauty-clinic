const router = require('express').Router();

// 内存存储（用于Vercel环境）
let projectsStore = {
  projects: [
    { id: 'double_eyelid', name: '双眼皮手术', category: '眼部整形', order: 1 },
    { id: 'rhinoplasty', name: '隆鼻手术', category: '鼻部整形', order: 2 },
    { id: 'facial_contour', name: '面部轮廓', category: '面部整形', order: 3 },
    { id: 'liposuction', name: '吸脂塑形', category: '形体雕塑', order: 4 },
    { id: 'hyaluronic_acid', name: '玻尿酸填充', category: '微整形', order: 5 },
    { id: 'botox', name: '肉毒素注射', category: '微整形', order: 6 },
    { id: 'aqua_shine', name: '水光针', category: '皮肤美容', order: 7 },
    { id: 'thermage', name: '热玛吉', category: '抗衰老', order: 8 },
    { id: 'picosecond', name: '皮秒激光', category: '激光美容', order: 9 },
    { id: 'chemical_peel', name: '果酸焕肤', category: '皮肤美容', order: 10 },
    { id: 'thread_lift', name: '线雕提升', category: '抗衰老', order: 11 },
    { id: 'other', name: '其他项目', category: '其他', order: 12 }
  ],
  categories: [
    '眼部整形', '鼻部整形', '面部整形', '形体雕塑',
    '微整形', '皮肤美容', '激光美容', '抗衰老', '其他'
  ],
  lastUpdated: new Date()
};

/**
 * 获取所有项目列表
 * GET /api/config/projects
 */
router.get('/', (req, res) => {
  try {
    // 按order排序
    const sortedProjects = [...projectsStore.projects].sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        projects: sortedProjects,
        categories: projectsStore.categories,
        lastUpdated: projectsStore.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
});

/**
 * 获取项目名称列表（供小程序使用）
 * GET /api/config/projects/names
 */
router.get('/names', (req, res) => {
  try {
    const sortedProjects = [...projectsStore.projects].sort((a, b) => a.order - b.order);
    const projectNames = sortedProjects.map(p => p.name);

    res.json({
      success: true,
      data: projectNames
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取项目名称列表失败',
      error: error.message
    });
  }
});

/**
 * 更新项目列表（管理员）
 * POST /api/config/projects
 */
router.post('/', (req, res) => {
  try {
    const { projects, categories } = req.body;

    if (!projects || !Array.isArray(projects)) {
      return res.status(400).json({
        success: false,
        message: '项目列表格式不正确'
      });
    }

    // 验证每个项目都有必要的字段
    const validProjects = projects.every(p =>
      p.id && p.name && typeof p.order === 'number'
    );

    if (!validProjects) {
      return res.status(400).json({
        success: false,
        message: '项目数据不完整，每个项目需要id、name和order字段'
      });
    }

    // 更新存储
    projectsStore = {
      projects: projects,
      categories: categories || projectsStore.categories,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      message: '项目列表更新成功',
      data: projectsStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新项目列表失败',
      error: error.message
    });
  }
});

/**
 * 添加单个项目（管理员）
 * POST /api/config/projects/add
 */
router.post('/add', (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '项目名称不能为空'
      });
    }

    // 生成ID
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

    // 检查是否已存在
    if (projectsStore.projects.find(p => p.id === id)) {
      return res.status(400).json({
        success: false,
        message: '该项目已存在'
      });
    }

    // 获取最大order值
    const maxOrder = Math.max(...projectsStore.projects.map(p => p.order), 0);

    // 添加新项目
    const newProject = {
      id,
      name,
      category: category || '其他',
      order: maxOrder + 1
    };

    projectsStore.projects.push(newProject);
    projectsStore.lastUpdated = new Date();

    // 如果有新分类，添加到分类列表
    if (category && !projectsStore.categories.includes(category)) {
      projectsStore.categories.push(category);
    }

    res.json({
      success: true,
      message: '项目添加成功',
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加项目失败',
      error: error.message
    });
  }
});

/**
 * 删除项目（管理员）
 * DELETE /api/config/projects/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const projectIndex = projectsStore.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 删除项目
    projectsStore.projects.splice(projectIndex, 1);
    projectsStore.lastUpdated = new Date();

    // 重新排序
    projectsStore.projects.forEach((p, index) => {
      p.order = index + 1;
    });

    res.json({
      success: true,
      message: '项目删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
});

/**
 * 更新项目顺序（管理员）
 * PUT /api/config/projects/reorder
 */
router.put('/reorder', (req, res) => {
  try {
    const { projectIds } = req.body;

    if (!projectIds || !Array.isArray(projectIds)) {
      return res.status(400).json({
        success: false,
        message: '项目ID列表格式不正确'
      });
    }

    // 根据新顺序更新order值
    projectIds.forEach((id, index) => {
      const project = projectsStore.projects.find(p => p.id === id);
      if (project) {
        project.order = index + 1;
      }
    });

    projectsStore.lastUpdated = new Date();

    res.json({
      success: true,
      message: '项目顺序更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新项目顺序失败',
      error: error.message
    });
  }
});

module.exports = router;