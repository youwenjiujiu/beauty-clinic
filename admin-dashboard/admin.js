console.log('Admin.js loading...');

const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      // API基础地址 - 使用当前域名
      apiBase: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : window.location.origin,  // 使用当前页面的域名

      // 管理员信息
      adminName: '管理员',
      token: localStorage.getItem('admin_token') || '',

      // 菜单
      activeMenu: 'hot_searches',
      menuItems: [
        { id: 'hot_searches', name: '热门搜索管理' },
        { id: 'filter_options', name: '筛选选项管理' },
        { id: 'clinics', name: '诊所管理' },
        { id: 'consultants', name: '陪同顾问管理' },
        { id: 'banners', name: '轮播图管理' },
        { id: 'services', name: '服务项目管理' },
        { id: 'appointments', name: '预约管理' },
        { id: 'reviews', name: '评价管理' }
      ],

      // 热门搜索
      hotSearches: [],
      algorithmSearches: [],

      // 筛选选项
      filterOptions: {
        districts: [],
        services: [],
        priceRanges: []
      },
      expandedDistricts: {}, // 控制区域展开/收起

      // 诊所列表
      clinics: [],
      showClinicModal: false,
      editingClinic: {
        name: '',
        nameKr: '',
        district: '',
        address: '',
        phone: '',
        specialties: [],
        tags: [],
        priceRange: '中档',
        featured: false,
        logo: ''
      },
      uploadingLogo: false,  // Logo上传中状态

      // 陪同顾问管理
      consultants: [],
      showConsultantModal: false,
      editingConsultant: null,

      // 轮播图
      banners: [],

      // 预设选项
      specialtyOptions: ['皮肤管理', '整形手术', '填充', '激光治疗', '身体塑形', '抗衰老', '眼部整形', '鼻部整形', '面部轮廓', '胸部整形', '毛发移植', '牙齿美容'],
      tagOptions: ['中文服务', '价格优惠', '性价比', '推荐', 'VIP服务', '24小时服务', '免费咨询', '术后护理', '明星医院', '网红打卡'],

      // 服务项目管理
      services: [],
      serviceCategories: ['全部', '整形手术', '皮肤管理', '微整形', '激光治疗', '其他'],
      selectedCategory: '全部',
      showServiceModal: false,
      editingService: null,
      nextServiceId: 1,

      // 预约管理
      appointments: [],
      appointmentStatuses: [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待确认' },
        { value: 'confirmed', label: '已确认' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' }
      ],
      selectedAppointmentStatus: 'all',

      // 评价管理
      reviews: [],
      reviewStatuses: [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待审核' },
        { value: 'approved', label: '已通过' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'hidden', label: '已隐藏' }
      ],
      selectedReviewStatus: 'all'
    }
  },

  computed: {
    filteredServices() {
      if (this.selectedCategory === '全部') {
        return this.services;
      }
      return this.services.filter(s => s.category === this.selectedCategory);
    },

    filteredAppointments() {
      if (this.selectedAppointmentStatus === 'all') {
        return this.appointments;
      }
      return this.appointments.filter(a => a.status === this.selectedAppointmentStatus);
    },

    filteredReviews() {
      if (this.selectedReviewStatus === 'all') {
        return this.reviews;
      }
      return this.reviews.filter(r => r.status === this.selectedReviewStatus);
    }
  },

  async mounted() {
    console.log('Vue app mounted successfully');
    console.log('Current menu:', this.activeMenu);

    // 检查登录状态
    if (!this.token) {
      console.log('No token found, showing login');
      this.showLogin();
      return;
    }

    // 验证token是否有效
    try {
      console.log('Validating existing token...');
      // 尝试加载数据，如果token无效会失败
      await this.loadHotSearches();
      console.log('Token is valid, continuing...');
    } catch (error) {
      console.log('Token invalid, showing login');
      this.token = '';
      localStorage.removeItem('admin_token');
      this.showLogin();
      return;
    }

    // 测试按钮是否可点击
    setTimeout(() => {
      const buttons = document.querySelectorAll('button');
      console.log(`Found ${buttons.length} buttons on the page`);
      buttons.forEach((btn, index) => {
        console.log(`Button ${index}:`, btn.textContent, 'Clickable:', !btn.disabled);
      });
    }, 1000);
  },

  methods: {
    // 显示登录框
    async showLogin() {
      const password = prompt('请输入管理员密码：');

      try {
        // 调用真实的登录API
        const response = await axios.post(`${this.apiBase}/api/auth/admin-login`, {
          password: password
        });

        if (response.data.success) {
          // 登录成功，保存token
          this.token = response.data.data.token;
          localStorage.setItem('admin_token', this.token);
          this.adminName = response.data.data.userInfo.nickName || '管理员';
          console.log('登录成功！');
          this.loadHotSearches();
        } else {
          alert('密码错误！');
          this.showLogin();
        }
      } catch (error) {
        console.error('登录失败:', error);
        if (error.response && error.response.status === 401) {
          alert('密码错误！');
        } else {
          alert('登录失败，请稍后重试');
        }
        this.showLogin();
      }
    },

    // 退出登录
    logout() {
      localStorage.removeItem('admin_token');
      this.token = '';
      window.location.reload();
    },

    // API请求封装
    async apiRequest(method, endpoint, data = null) {
      console.log(`API Request: ${method} ${endpoint}`);
      try {
        const config = {
          method: method,
          url: `${this.apiBase}/api${endpoint}`,
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);
        console.log('API Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('API请求失败:', error);

        // 如果是网络错误或CORS问题，提供更友好的提示
        if (!error.response) {
          console.error('Network error or CORS issue');
          // 使用模拟数据继续运行
          return this.getMockData(endpoint);
        }

        if (error.response && error.response.status === 403) {
          alert('权限不足，请重新登录');
          this.logout();
        } else {
          alert('操作失败: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },

    // 获取模拟数据（用于开发和CORS错误时）
    getMockData(endpoint) {
      console.log('Using mock data for:', endpoint);

      if (endpoint.includes('hot_searches')) {
        return {
          success: true,
          data: {
            content: {
              items: [
                { keyword: '双眼皮', priority: 100, isHot: true },
                { keyword: '瘦脸针', priority: 90, isHot: true },
                { keyword: '玻尿酸', priority: 80, isHot: false }
              ]
            },
            searches: [
              { keyword: '隆鼻', count: 150, clickRate: 45, source: 'algorithm', isHot: true },
              { keyword: '美白针', count: 120, clickRate: 38, source: 'algorithm', isHot: false }
            ]
          }
        };
      }

      if (endpoint.includes('filter_options')) {
        return {
          success: true,
          data: {
            content: {
              districts: [
                // 首尔主要区域 - 完整列表
                {
                  value: 'gangnam-gu',
                  label: '江南区',
                  labelKr: '강남구',
                  children: [
                    { value: 'gangnam', label: '江南站', labelKr: '강남역' },
                    { value: 'sinsa', label: '新沙洞', labelKr: '신사동' },
                    { value: 'apgujeong', label: '狎鸥亭', labelKr: '압구정' },
                    { value: 'cheongdam', label: '清潭洞', labelKr: '청담동' },
                    { value: 'yeoksam', label: '驿三洞', labelKr: '역삼동' },
                    { value: 'daechi', label: '大峙洞', labelKr: '대치동' }
                  ]
                },
                {
                  value: 'seocho-gu',
                  label: '瑞草区',
                  labelKr: '서초구',
                  children: [
                    { value: 'seocho', label: '瑞草洞', labelKr: '서초동' },
                    { value: 'bangbae', label: '方背洞', labelKr: '방배동' },
                    { value: 'yangjae', label: '良才洞', labelKr: '양재동' },
                    { value: 'banpo', label: '盘浦洞', labelKr: '반포동' }
                  ]
                },
                {
                  value: 'mapo-gu',
                  label: '麻浦区',
                  labelKr: '마포구',
                  children: [
                    { value: 'hongdae', label: '弘大', labelKr: '홍대' },
                    { value: 'sinchon', label: '新村', labelKr: '신촌' },
                    { value: 'hapjeong', label: '合井', labelKr: '합정' },
                    { value: 'sangsu', label: '上水', labelKr: '상수' }
                  ]
                },
                {
                  value: 'jung-gu',
                  label: '中区',
                  labelKr: '중구',
                  children: [
                    { value: 'myeongdong', label: '明洞', labelKr: '명동' },
                    { value: 'euljiro', label: '乙支路', labelKr: '을지로' },
                    { value: 'chungmuro', label: '忠武路', labelKr: '충무로' }
                  ]
                },
                {
                  value: 'yongsan-gu',
                  label: '龙山区',
                  labelKr: '용산구',
                  children: [
                    { value: 'itaewon', label: '梨泰院', labelKr: '이태원' },
                    { value: 'hannam', label: '汉南洞', labelKr: '한남동' }
                  ]
                },
                {
                  value: 'songpa-gu',
                  label: '松坡区',
                  labelKr: '송파구',
                  children: [
                    { value: 'jamsil', label: '蚕室', labelKr: '잠실' },
                    { value: 'songpa', label: '松坡洞', labelKr: '송파동' },
                    { value: 'garak', label: '可乐洞', labelKr: '가락동' }
                  ]
                }
              ],
              services: [
                { value: 'skin', label: '皮肤管理' },
                { value: 'plastic', label: '整形手术' },
                { value: 'injection', label: '微整形' },
                { value: 'laser', label: '激光治疗' }
              ],
              priceRanges: [
                { value: '0-100', label: '100万韩元以下' },
                { value: '100-300', label: '100-300万韩元' },
                { value: '300-500', label: '300-500万韩元' },
                { value: '500+', label: '500万韩元以上' }
              ]
            }
          }
        };
      }

      if (endpoint.includes('clinics')) {
        return {
          success: true,
          data: {
            clinics: [
              {
                _id: '1',
                name: 'Beauty Clinic Seoul',
                district: '江南',
                phone: '02-1234-5678',
                rating: 4.8,
                status: 'active'
              }
            ]
          }
        };
      }

      if (endpoint.includes('banner')) {
        return {
          success: true,
          data: {
            content: {
              items: [
                {
                  imageUrl: '/images/banner1.jpg',
                  title: '新年特惠',
                  link: '/promotion',
                  sortOrder: 1
                }
              ]
            }
          }
        };
      }

      return { success: true, data: {} };
    },

    // 加载热门搜索
    async loadHotSearches() {
      try {
        // 获取管理员配置的热搜
        const configRes = await this.apiRequest('GET', '/admin/config/hot_searches');
        if (configRes.success && configRes.data.content) {
          this.hotSearches = configRes.data.content.items || [];
        } else {
          this.hotSearches = [];
        }

        // 获取算法生成的热搜
        const algoRes = await this.apiRequest('GET', '/admin/config/hot-searches/combined');
        if (algoRes.success) {
          this.algorithmSearches = algoRes.data.searches.filter(s => s.source === 'algorithm');
        }
      } catch (error) {
        console.error('加载热搜失败:', error);
      }
    },

    // 添加热搜词
    addHotSearch() {
      console.log('addHotSearch clicked');
      this.hotSearches.push({
        keyword: '',
        priority: 50,
        isHot: false
      });
      console.log('Hot searches:', this.hotSearches);
    },

    // 删除热搜词
    removeHotSearch(index) {
      this.hotSearches.splice(index, 1);
    },

    // 添加算法词到管理
    addToManaged(item) {
      this.hotSearches.push({
        keyword: item.keyword,
        priority: 60,
        isHot: item.isHot
      });
    },

    // 保存热搜配置
    async saveHotSearches() {
      console.log('saveHotSearches clicked');
      try {
        const result = await this.apiRequest('POST', '/admin/config', {
          type: 'hot_searches',
          name: '热门搜索配置',
          content: {
            items: this.hotSearches
          },
          isActive: true
        });

        if (result.success) {
          alert('保存成功！');
        }
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    // 加载筛选选项
    async loadFilterOptions() {
      try {
        const result = await this.apiRequest('GET', '/admin/config/filter_options');
        if (result.success && result.data.content) {
          this.filterOptions = result.data.content;
        }
      } catch (error) {
        console.error('加载筛选选项失败:', error);
      }
    },

    // 添加地区
    addDistrict() {
      this.filterOptions.districts.push({ value: '', label: '' });
    },

    removeDistrict(index) {
      this.filterOptions.districts.splice(index, 1);
    },

    // 添加服务
    addService() {
      this.filterOptions.services.push({ value: '', label: '' });
    },

    removeService(index) {
      this.filterOptions.services.splice(index, 1);
    },

    // 添加价格区间
    addPriceRange() {
      this.filterOptions.priceRanges.push({ value: '', label: '' });
    },

    removePriceRange(index) {
      this.filterOptions.priceRanges.splice(index, 1);
    },

    // 保存筛选选项
    async saveFilterOptions() {
      try {
        const result = await this.apiRequest('POST', '/admin/config', {
          type: 'filter_options',
          name: '筛选选项配置',
          content: this.filterOptions,
          isActive: true
        });

        if (result.success) {
          alert('保存成功！');
        }
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    // 加载诊所列表
    async loadClinics() {
      try {
        const result = await this.apiRequest('GET', '/clinics?limit=100');
        if (result.success) {
          this.clinics = result.data.clinics;
        }
      } catch (error) {
        console.error('加载诊所失败:', error);
      }
    },

    // 新建诊所
    addClinic() {
      this.editingClinic = {
        nameCn: '',  // 前端用nameCn
        nameKr: '',
        logo: '',
        district: '',
        address: '',
        phone: '',
        specialties: [],
        tags: [],
        priceRange: '中档',
        featured: false
      };
      this.showClinicModal = true;
      document.body.style.overflow = 'hidden';  // 禁止背景滚动
    },

    // 编辑诊所
    editClinic(clinic) {
      this.editingClinic = {
        ...clinic,
        nameCn: clinic.name  // 后端的name映射到前端的nameCn
      };
      this.showClinicModal = true;
      document.body.style.overflow = 'hidden';  // 禁止背景滚动
    },

    // 关闭诊所弹窗
    closeClinicModal() {
      this.showClinicModal = false;
      this.editingClinic = null;
      document.body.style.overflow = '';  // 恢复背景滚动
    },

    // 上传诊所Logo图片
    async uploadClinicLogo(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 检查文件大小（限制10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过10MB');
        return;
      }

      this.uploadingLogo = true;

      try {
        // 将图片转为 base64
        const base64 = await this.fileToBase64(file);

        // 上传到服务器
        const result = await this.apiRequest('POST', '/upload/image', {
          image: base64,
          folder: 'clinic-logos',
          filename: `clinic-logo-${Date.now()}.${file.name.split('.').pop()}`
        });

        if (result.success) {
          this.editingClinic.logo = result.data.url;
          console.log('Logo上传成功:', result.data.url);
        } else {
          alert('上传失败: ' + (result.message || '未知错误'));
        }
      } catch (error) {
        console.error('上传Logo失败:', error);
        alert('上传失败，请重试');
      } finally {
        this.uploadingLogo = false;
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
      }
    },

    // 文件转base64
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    // 专长领域选择相关方法
    isSpecialtySelected(specialty) {
      if (!this.editingClinic || !this.editingClinic.specialties) return false;
      const specs = Array.isArray(this.editingClinic.specialties)
        ? this.editingClinic.specialties
        : this.editingClinic.specialties.split(',').map(s => s.trim());
      return specs.includes(specialty);
    },

    toggleSpecialty(specialty) {
      if (!this.editingClinic.specialties) {
        this.editingClinic.specialties = [];
      }
      // 确保是数组
      if (typeof this.editingClinic.specialties === 'string') {
        this.editingClinic.specialties = this.editingClinic.specialties.split(',').map(s => s.trim()).filter(s => s);
      }
      const index = this.editingClinic.specialties.indexOf(specialty);
      if (index > -1) {
        this.editingClinic.specialties.splice(index, 1);
      } else {
        this.editingClinic.specialties.push(specialty);
      }
    },

    getSelectedSpecialties() {
      if (!this.editingClinic || !this.editingClinic.specialties) return '';
      const specs = Array.isArray(this.editingClinic.specialties)
        ? this.editingClinic.specialties
        : this.editingClinic.specialties.split(',').map(s => s.trim());
      return specs.join(', ');
    },

    // 标签选择相关方法
    isTagSelected(tag) {
      if (!this.editingClinic || !this.editingClinic.tags) return false;
      const tags = Array.isArray(this.editingClinic.tags)
        ? this.editingClinic.tags
        : this.editingClinic.tags.split(',').map(t => t.trim());
      return tags.includes(tag);
    },

    toggleTag(tag) {
      if (!this.editingClinic.tags) {
        this.editingClinic.tags = [];
      }
      // 确保是数组
      if (typeof this.editingClinic.tags === 'string') {
        this.editingClinic.tags = this.editingClinic.tags.split(',').map(t => t.trim()).filter(t => t);
      }
      const index = this.editingClinic.tags.indexOf(tag);
      if (index > -1) {
        this.editingClinic.tags.splice(index, 1);
      } else {
        this.editingClinic.tags.push(tag);
      }
    },

    getSelectedTags() {
      if (!this.editingClinic || !this.editingClinic.tags) return '';
      const tags = Array.isArray(this.editingClinic.tags)
        ? this.editingClinic.tags
        : this.editingClinic.tags.split(',').map(t => t.trim());
      return tags.join(', ');
    },

    // 保存诊所
    async saveClinic() {
      try {
        // 处理specialties和tags字段（确保是数组）
        const clinicData = {
          ...this.editingClinic,
          // 字段映射：前端用nameCn，后端用name
          name: this.editingClinic.nameCn || this.editingClinic.name,
          specialties: typeof this.editingClinic.specialties === 'string'
            ? this.editingClinic.specialties.split(',').map(s => s.trim()).filter(s => s)
            : (this.editingClinic.specialties || []),
          tags: typeof this.editingClinic.tags === 'string'
            ? this.editingClinic.tags.split(',').map(t => t.trim()).filter(t => t)
            : (this.editingClinic.tags || [])
        };

        // 删除nameCn字段，避免发送到后端
        delete clinicData.nameCn;

        let result;
        if (this.editingClinic._id) {
          // 更新现有诊所
          result = await this.apiRequest('PUT', `/clinics/admin/${this.editingClinic._id}`, clinicData);
        } else {
          // 创建新诊所
          result = await this.apiRequest('POST', '/clinics/admin', clinicData);
        }

        if (result.success) {
          alert('保存成功！');
          this.closeClinicModal();  // 关闭弹窗并恢复滚动
          // 重新加载诊所列表
          this.loadClinics();
        }
      } catch (error) {
        console.error('保存诊所失败:', error);
      }
    },

    // 切换诊所状态
    async toggleClinicStatus(clinic) {
      try {
        const newStatus = clinic.status === 'active' ? 'inactive' : 'active';
        const result = await this.apiRequest('PUT', `/clinics/admin/${clinic._id}`, {
          status: newStatus
        });

        if (result.success) {
          clinic.status = newStatus;
          alert('状态更新成功！');
        }
      } catch (error) {
        console.error('更新状态失败:', error);
      }
    },

    // 删除诊所
    async deleteClinic(clinicId) {
      if (!confirm('确定要删除该诊所吗？')) {
        return;
      }

      try {
        const result = await this.apiRequest('DELETE', `/clinics/admin/${clinicId}`);
        if (result.success) {
          this.clinics = this.clinics.filter(c => c._id !== clinicId);
          alert('删除成功！');
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    },

    // ========== 陪同顾问管理 ==========
    async loadConsultants() {
      try {
        const result = await this.apiRequest('GET', '/consultants');
        if (result.success && result.data) {
          this.consultants = result.data;
        }
      } catch (error) {
        console.error('加载顾问列表失败:', error);
        this.consultants = [];
      }
    },

    addConsultant() {
      this.editingConsultant = {
        name: '',
        nameKr: '',
        phone: '',
        wechat: '',
        kakaoTalk: '',
        gender: 'female',
        languages: [],
        specialties: [],
        experience: 0,
        serviceAreas: [],
        introduction: '',
        introductionKr: '',
        rating: 5.0,
        consultationFee: 0,
        accompanyFee: 0,
        status: 'active',
        featured: false,
        tags: []
      };
      this.showConsultantModal = true;
    },

    editConsultant(consultant) {
      this.editingConsultant = { ...consultant };
      this.showConsultantModal = true;
    },

    async saveConsultant() {
      if (!this.editingConsultant.name || !this.editingConsultant.wechat) {
        alert('请填写姓名和微信号');
        return;
      }

      try {
        const isEdit = !!this.editingConsultant._id;
        const url = isEdit ? `/consultants/${this.editingConsultant._id}` : '/consultants';
        const method = isEdit ? 'PUT' : 'POST';

        const result = await this.apiRequest(method, url, this.editingConsultant);
        if (result.success) {
          this.showConsultantModal = false;
          this.editingConsultant = null;
          alert(isEdit ? '更新成功！' : '添加成功！');
          this.loadConsultants();
        }
      } catch (error) {
        console.error('保存顾问失败:', error);
        alert('保存失败');
      }
    },

    async deleteConsultant(consultantId) {
      if (!confirm('确定要删除该顾问吗？')) {
        return;
      }

      try {
        const result = await this.apiRequest('DELETE', `/consultants/${consultantId}`);
        if (result.success) {
          this.consultants = this.consultants.filter(c => c._id !== consultantId);
          alert('删除成功！');
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    },

    getConsultantStatusText(status) {
      const map = { active: '在线', busy: '忙碌', vacation: '休假', inactive: '离线' };
      return map[status] || status;
    },

    getConsultantStatusClass(status) {
      const map = {
        active: 'text-green-600',
        busy: 'text-orange-600',
        vacation: 'text-blue-600',
        inactive: 'text-gray-600'
      };
      return map[status] || 'text-gray-600';
    },

    // 加载轮播图
    async loadBanners() {
      try {
        const result = await this.apiRequest('GET', '/admin/config/banner_images');
        if (result.success && result.data.content) {
          this.banners = result.data.content.items || [];
        }
      } catch (error) {
        console.error('加载轮播图失败:', error);
      }
    },

    // 添加轮播图
    addBanner() {
      this.banners.push({
        imageUrl: '',
        title: '',
        link: '',
        sortOrder: 0
      });
    },

    removeBanner(index) {
      this.banners.splice(index, 1);
    },

    // 切换区域展开/收起
    toggleDistrictExpand(index) {
      // Vue 3 需要使用 reactive 或确保响应式更新
      // 使用 Vue.set 的替代方式
      const newExpanded = { ...this.expandedDistricts };
      newExpanded[index] = !newExpanded[index];
      this.expandedDistricts = newExpanded;
    },

    // 加载服务项目
    async loadServices() {
      try {
        const result = await this.apiRequest('GET', '/admin/config/services');
        if (result.success && result.data.content) {
          this.services = result.data.content.items || [];
          if (this.services.length > 0) {
            this.nextServiceId = Math.max(...this.services.map(s => s.id || 0)) + 1;
          } else {
            this.nextServiceId = 1;
          }
        }
      } catch (error) {
        // 静默处理错误，不显示alert
        console.log('首次加载服务项目，使用默认配置');
      }
    },

    // 添加服务项目
    addService() {
      this.editingService = {
        name: '',
        nameKr: '',
        category: '皮肤管理',
        description: '',
        priceRange: '',
        duration: 60,
        isHot: false
      };
      this.showServiceModal = true;
    },

    // 编辑服务项目
    editService(service) {
      this.editingService = { ...service };
      this.showServiceModal = true;
    },

    // 保存服务项目
    async saveService() {
      try {
        if (!this.editingService.id) {
          // 新增
          this.editingService.id = this.nextServiceId++;
          this.services.push(this.editingService);
        } else {
          // 编辑
          const index = this.services.findIndex(s => s.id === this.editingService.id);
          if (index !== -1) {
            this.services[index] = { ...this.editingService };
          }
        }

        // 保存到配置
        await this.apiRequest('POST', '/admin/config', {
          type: 'services',
          name: '服务项目配置',
          content: { items: this.services },
          isActive: true
        });

        alert('保存成功！');
        this.showServiceModal = false;
        this.editingService = null;
      } catch (error) {
        console.error('保存服务项目失败:', error);
        alert('保存失败');
      }
    },

    // 删除服务项目
    async deleteService(id) {
      if (!confirm('确定要删除该服务项目吗？')) {
        return;
      }

      const index = this.services.findIndex(s => s.id === id);
      if (index !== -1) {
        this.services.splice(index, 1);

        try {
          await this.apiRequest('POST', '/admin/config', {
            type: 'services',
            name: '服务项目配置',
            content: { items: this.services },
            isActive: true
          });
          alert('删除成功！');
        } catch (error) {
          console.error('删除失败:', error);
        }
      }
    },

    // 加载预约数据
    async loadAppointments() {
      try {
        // Mock预约数据
        this.appointments = [
          {
            id: 'APT001',
            customerName: '李小明',
            phone: '010-12345678',
            clinicName: 'Seoul Beauty Clinic',
            serviceName: '双眼皮手术',
            appointmentTime: new Date('2025-02-01 14:00'),
            status: 'pending',
            createTime: new Date('2025-01-28')
          },
          {
            id: 'APT002',
            customerName: '王美丽',
            phone: '010-87654321',
            clinicName: 'Gangnam Medical Center',
            serviceName: '玻尿酸注射',
            appointmentTime: new Date('2025-02-02 10:00'),
            status: 'confirmed',
            createTime: new Date('2025-01-27')
          },
          {
            id: 'APT003',
            customerName: '张小花',
            phone: '010-55551234',
            clinicName: 'Seoul Beauty Clinic',
            serviceName: '激光美白',
            appointmentTime: new Date('2025-01-30 15:30'),
            status: 'completed',
            createTime: new Date('2025-01-25')
          },
          {
            id: 'APT004',
            customerName: '赵先生',
            phone: '010-99998888',
            clinicName: 'Test Beauty Clinic',
            serviceName: '皮肤管理',
            appointmentTime: new Date('2025-02-03 11:00'),
            status: 'pending',
            createTime: new Date('2025-01-28')
          },
          {
            id: 'APT005',
            customerName: '刘女士',
            phone: '010-66667777',
            clinicName: 'Gangnam Medical Center',
            serviceName: '水光针',
            appointmentTime: new Date('2025-01-31 09:00'),
            status: 'cancelled',
            createTime: new Date('2025-01-26')
          }
        ];
        console.log('预约数据加载成功，共', this.appointments.length, '条');
      } catch (error) {
        console.error('加载预约失败:', error);
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    // 获取状态标签
    getStatusLabel(status) {
      const statusMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'completed': '已完成',
        'cancelled': '已取消',
        'all': '全部'
      };
      return statusMap[status] || status;
    },

    // 获取状态样式
    getStatusClass(status) {
      const classMap = {
        'pending': 'text-yellow-600',
        'confirmed': 'text-blue-600',
        'completed': 'text-green-600',
        'cancelled': 'text-gray-500'
      };
      return classMap[status] || '';
    },

    // 获取状态数量
    getStatusCount(status) {
      if (status === 'all') {
        return this.appointments.length;
      }
      return this.appointments.filter(a => a.status === status).length;
    },

    // 更新预约状态
    async updateAppointmentStatus(id, newStatus) {
      const appointment = this.appointments.find(a => a.id === id);
      if (appointment) {
        appointment.status = newStatus;

        // 模拟保存到后端
        try {
          console.log(`更新预约 ${id} 状态为 ${newStatus}`);
          alert(`预约状态已更新为：${this.getStatusLabel(newStatus)}`);
        } catch (error) {
          console.error('更新预约状态失败:', error);
        }
      }
    },

    // 保存轮播图
    async saveBanners() {
      try {
        const result = await this.apiRequest('POST', '/admin/config', {
          type: 'banner_images',
          name: '轮播图配置',
          content: {
            items: this.banners
          },
          isActive: true
        });

        if (result.success) {
          alert('保存成功！');
        }
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    // 加载评价数据
    async loadReviews() {
      try {
        // Mock评价数据
        this.reviews = [
          {
            id: 'REV001',
            customerName: '张小美',
            clinicName: 'Seoul Beauty Clinic',
            serviceName: '双眼皮手术',
            rating: 5,
            content: '医生技术非常好，手术效果很自然，恢复也很快。整个过程都很专业，护士姐姐也很温柔。强烈推荐！',
            images: ['img1.jpg', 'img2.jpg'],
            status: 'approved',
            createTime: new Date('2025-01-26'),
            reply: '感谢您的认可！祝您越来越美丽！'
          },
          {
            id: 'REV002',
            customerName: '李女士',
            clinicName: 'Gangnam Medical Center',
            serviceName: '玻尿酸注射',
            rating: 4,
            content: '效果不错，就是价格有点贵。医生很细心，会详细讲解注意事项。',
            images: [],
            status: 'approved',
            createTime: new Date('2025-01-25'),
            reply: null
          },
          {
            id: 'REV003',
            customerName: '王先生',
            clinicName: 'Test Beauty Clinic',
            serviceName: '激光祛斑',
            rating: 3,
            content: '效果一般，可能需要多做几次才能看到明显效果。服务态度还可以。',
            images: ['img3.jpg'],
            status: 'pending',
            createTime: new Date('2025-01-28'),
            reply: null
          },
          {
            id: 'REV004',
            customerName: '赵小姐',
            clinicName: 'Seoul Beauty Clinic',
            serviceName: '水光针',
            rating: 5,
            content: '超级满意！皮肤变得水嫩有光泽，朋友都说我变年轻了。环境也很好，很干净。',
            images: ['img4.jpg', 'img5.jpg', 'img6.jpg'],
            status: 'approved',
            createTime: new Date('2025-01-24'),
            reply: '谢谢您的好评！期待您的下次光临！'
          },
          {
            id: 'REV005',
            customerName: '刘小姐',
            clinicName: 'Gangnam Medical Center',
            serviceName: '皮肤管理',
            rating: 2,
            content: '预约等待时间太长，体验不太好。',
            images: [],
            status: 'hidden',
            createTime: new Date('2025-01-23'),
            reply: null
          },
          {
            id: 'REV006',
            customerName: '陈女士',
            clinicName: 'Seoul Beauty Clinic',
            serviceName: '瘦脸针',
            rating: 1,
            content: '效果不明显，感觉被骗了。',
            images: [],
            status: 'rejected',
            createTime: new Date('2025-01-22'),
            reply: null
          }
        ];
        console.log('评价数据加载成功，共', this.reviews.length, '条');
      } catch (error) {
        console.error('加载评价失败:', error);
      }
    },

    // 获取评价状态标签
    getReviewStatusLabel(status) {
      const statusMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'hidden': '已隐藏',
        'all': '全部'
      };
      return statusMap[status] || status;
    },

    // 获取评价状态样式
    getReviewStatusClass(status) {
      const classMap = {
        'pending': 'px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-sm',
        'approved': 'px-2 py-1 bg-green-100 text-green-600 rounded text-sm',
        'rejected': 'px-2 py-1 bg-red-100 text-red-600 rounded text-sm',
        'hidden': 'px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm'
      };
      return classMap[status] || '';
    },

    // 获取评价状态数量
    getReviewStatusCount(status) {
      if (status === 'all') {
        return this.reviews.length;
      }
      return this.reviews.filter(r => r.status === status).length;
    },

    // 通过评价
    approveReview(id) {
      const review = this.reviews.find(r => r.id === id);
      if (review) {
        review.status = 'approved';
        alert('评价已通过审核');
      }
    },

    // 拒绝评价
    rejectReview(id) {
      const review = this.reviews.find(r => r.id === id);
      if (review) {
        review.status = 'rejected';
        alert('评价已拒绝');
      }
    },

    // 隐藏评价
    hideReview(id) {
      const review = this.reviews.find(r => r.id === id);
      if (review) {
        review.status = 'hidden';
        alert('评价已隐藏');
      }
    },

    // 回复评价
    replyReview(review) {
      const reply = prompt('请输入回复内容：');
      if (reply) {
        review.reply = reply;
        alert('回复成功');
      }
    },

    // 删除评价
    deleteReview(id) {
      if (confirm('确定要删除这条评价吗？')) {
        const index = this.reviews.findIndex(r => r.id === id);
        if (index !== -1) {
          this.reviews.splice(index, 1);
          alert('评价已删除');
        }
      }
    }
  },

  watch: {
    activeMenu(newMenu) {
      // 切换菜单时加载对应数据
      switch(newMenu) {
        case 'hot_searches':
          this.loadHotSearches();
          break;
        case 'filter_options':
          this.loadFilterOptions();
          break;
        case 'clinics':
          this.loadClinics();
          break;
        case 'consultants':
          this.loadConsultants();
          break;
        case 'banners':
          this.loadBanners();
          break;
        case 'services':
          this.loadServices();
          break;
        case 'appointments':
          this.loadAppointments();
          break;
        case 'reviews':
          this.loadReviews();
          break;
      }
    }
  }
});

// 确保DOM加载完成后再挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Mounting Vue app...');
    app.mount('#app');
  });
} else {
  console.log('Mounting Vue app immediately...');
  app.mount('#app');
}