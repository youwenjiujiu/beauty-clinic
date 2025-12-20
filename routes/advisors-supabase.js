const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 缓存
let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 5000; // 5秒缓存

/**
 * 获取管理员顾问列表
 * GET /api/advisors/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 转换数据格式（数据库字段是snake_case，API返回camelCase）
    const advisors = data.map(advisor => ({
      _id: advisor.id,
      name: advisor.name,
      nameKr: advisor.name_kr,
      phone: advisor.phone,
      wechat: advisor.wechat,
      kakaoTalk: advisor.kakao_talk,
      avatar: advisor.avatar,
      gender: advisor.gender,
      languages: advisor.languages || [],
      specialties: advisor.specialties || [],
      experience: advisor.experience,
      serviceAreas: advisor.service_areas || [],
      serviceTypes: advisor.service_types || [],
      introduction: advisor.introduction,
      introductionKr: advisor.introduction_kr,
      rating: advisor.rating,
      reviewCount: advisor.review_count,
      totalServices: advisor.total_services,
      consultationFee: advisor.consultation_fee,
      accompanyFee: advisor.accompany_fee,
      status: advisor.status,
      featured: advisor.featured,
      tags: advisor.tags || [],
      qrCodes: advisor.qr_codes,
      sortOrder: advisor.sort_order,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at
    }));

    res.json({
      success: true,
      data: advisors,
      total: advisors.length
    });
  } catch (error) {
    console.error('获取管理员顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败',
      error: error.message
    });
  }
});

/**
 * 获取所有顾问列表（带筛选）
 * GET /api/advisors
 */
router.get('/', async (req, res) => {
  try {
    const { area, specialty, featured, status = 'active' } = req.query;

    // 检查缓存
    if (!area && !specialty && !featured && status === 'active' && cache && Date.now() - cacheTime < CACHE_DURATION) {
      return res.json({
        success: true,
        data: cache,
        total: cache.length
      });
    }

    // 构建查询
    let query = supabase.from('advisors').select('*');

    // 应用筛选条件
    if (status) {
      query = query.eq('status', status);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // 排序
    query = query
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: false })
      .order('rating', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // 转换数据格式
    let advisors = data.map(advisor => ({
      _id: advisor.id,
      name: advisor.name,
      nameKr: advisor.name_kr,
      phone: advisor.phone,
      wechat: advisor.wechat,
      kakaoTalk: advisor.kakao_talk,
      avatar: advisor.avatar,
      gender: advisor.gender,
      languages: advisor.languages || [],
      specialties: advisor.specialties || [],
      experience: advisor.experience,
      serviceAreas: advisor.service_areas || [],
      serviceTypes: advisor.service_types || [],
      introduction: advisor.introduction,
      introductionKr: advisor.introduction_kr,
      rating: advisor.rating,
      reviewCount: advisor.review_count,
      totalServices: advisor.total_services,
      consultationFee: advisor.consultation_fee,
      accompanyFee: advisor.accompany_fee,
      status: advisor.status,
      featured: advisor.featured,
      tags: advisor.tags || [],
      qrCodes: advisor.qr_codes,
      sortOrder: advisor.sort_order,
      createdAt: advisor.created_at,
      updatedAt: advisor.updated_at
    }));

    // 在JavaScript中进行数组字段的筛选（因为PostgreSQL数组查询比较复杂）
    if (area) {
      advisors = advisors.filter(a =>
        a.serviceAreas && a.serviceAreas.includes(area)
      );
    }

    if (specialty) {
      advisors = advisors.filter(a =>
        a.specialties && a.specialties.includes(specialty)
      );
    }

    // 更新缓存
    if (!area && !specialty && !featured && status === 'active') {
      cache = advisors;
      cacheTime = Date.now();
    }

    res.json({
      success: true,
      data: advisors,
      total: advisors.length
    });
  } catch (error) {
    console.error('获取顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败',
      error: error.message
    });
  }
});

/**
 * 获取单个顾问详情
 * GET /api/advisors/detail/:id
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '顾问不存在'
        });
      }
      throw error;
    }

    // 转换数据格式
    const advisor = {
      _id: data.id,
      name: data.name,
      nameKr: data.name_kr,
      phone: data.phone,
      wechat: data.wechat,
      kakaoTalk: data.kakao_talk,
      avatar: data.avatar,
      gender: data.gender,
      languages: data.languages || [],
      specialties: data.specialties || [],
      experience: data.experience,
      serviceAreas: data.service_areas || [],
      serviceTypes: data.service_types || [],
      introduction: data.introduction,
      introductionKr: data.introduction_kr,
      rating: data.rating,
      reviewCount: data.review_count,
      totalServices: data.total_services,
      consultationFee: data.consultation_fee,
      accompanyFee: data.accompany_fee,
      status: data.status,
      featured: data.featured,
      tags: data.tags || [],
      qrCodes: data.qr_codes,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    res.json({
      success: true,
      data: advisor
    });
  } catch (error) {
    console.error('获取顾问详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问详情失败',
      error: error.message
    });
  }
});

/**
 * 添加新顾问
 * POST /api/advisors/add
 */
router.post('/add', async (req, res) => {
  try {
    // 清除缓存
    cache = null;

    const newAdvisor = {
      id: 'advisor_' + Date.now(),
      name: req.body.name,
      name_kr: req.body.nameKr || req.body.name_kr,
      phone: req.body.phone,
      wechat: req.body.wechat,
      kakao_talk: req.body.kakaoTalk || req.body.kakao_talk,
      avatar: req.body.avatar || '',
      gender: req.body.gender || 'other',
      languages: req.body.languages || [],
      specialties: req.body.specialties || [],
      experience: req.body.experience || 0,
      service_areas: req.body.serviceAreas || req.body.service_areas || [],
      service_types: req.body.serviceTypes || req.body.service_types || [],
      introduction: req.body.introduction || '',
      introduction_kr: req.body.introductionKr || req.body.introduction_kr || '',
      rating: req.body.rating || 5.0,
      review_count: req.body.reviewCount || req.body.review_count || 0,
      total_services: req.body.totalServices || req.body.total_services || 0,
      consultation_fee: req.body.consultationFee || req.body.consultation_fee || 0,
      accompany_fee: req.body.accompanyFee || req.body.accompany_fee || 0,
      status: req.body.status || 'active',
      featured: req.body.featured || false,
      tags: req.body.tags || [],
      qr_codes: req.body.qrCodes || req.body.qr_codes || null,
      sort_order: req.body.sortOrder || req.body.sort_order || 0
    };

    const { data, error } = await supabase
      .from('advisors')
      .insert([newAdvisor])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        _id: data.id,
        ...req.body,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      },
      message: '顾问添加成功'
    });
  } catch (error) {
    console.error('添加顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '添加顾问失败',
      error: error.message
    });
  }
});

/**
 * 更新顾问信息
 * PUT /api/advisors/update/:id
 */
router.put('/update/:id', async (req, res) => {
  try {
    // 清除缓存
    cache = null;

    const updateData = {};

    // 映射字段
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.nameKr !== undefined) updateData.name_kr = req.body.nameKr;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.wechat !== undefined) updateData.wechat = req.body.wechat;
    if (req.body.kakaoTalk !== undefined) updateData.kakao_talk = req.body.kakaoTalk;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
    if (req.body.gender !== undefined) updateData.gender = req.body.gender;
    if (req.body.languages !== undefined) updateData.languages = req.body.languages;
    if (req.body.specialties !== undefined) updateData.specialties = req.body.specialties;
    if (req.body.experience !== undefined) updateData.experience = req.body.experience;
    if (req.body.serviceAreas !== undefined) updateData.service_areas = req.body.serviceAreas;
    if (req.body.serviceTypes !== undefined) updateData.service_types = req.body.serviceTypes;
    if (req.body.introduction !== undefined) updateData.introduction = req.body.introduction;
    if (req.body.introductionKr !== undefined) updateData.introduction_kr = req.body.introductionKr;
    if (req.body.rating !== undefined) updateData.rating = req.body.rating;
    if (req.body.reviewCount !== undefined) updateData.review_count = req.body.reviewCount;
    if (req.body.totalServices !== undefined) updateData.total_services = req.body.totalServices;
    if (req.body.consultationFee !== undefined) updateData.consultation_fee = req.body.consultationFee;
    if (req.body.accompanyFee !== undefined) updateData.accompany_fee = req.body.accompanyFee;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.featured !== undefined) updateData.featured = req.body.featured;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.qrCodes !== undefined) updateData.qr_codes = req.body.qrCodes;
    if (req.body.sortOrder !== undefined) updateData.sort_order = req.body.sortOrder;

    const { data, error } = await supabase
      .from('advisors')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '顾问不存在'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        _id: data.id,
        ...req.body,
        updatedAt: data.updated_at
      },
      message: '顾问信息更新成功'
    });
  } catch (error) {
    console.error('更新顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '更新顾问失败',
      error: error.message
    });
  }
});

/**
 * 删除顾问
 * DELETE /api/advisors/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    // 清除缓存
    cache = null;

    // 先获取要删除的顾问信息
    const { data: advisor, error: fetchError } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '顾问不存在'
        });
      }
      throw fetchError;
    }

    // 删除顾问
    const { error: deleteError } = await supabase
      .from('advisors')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      data: {
        _id: advisor.id,
        name: advisor.name
      },
      message: '顾问删除成功'
    });
  } catch (error) {
    console.error('删除顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '删除顾问失败',
      error: error.message
    });
  }
});

module.exports = router;