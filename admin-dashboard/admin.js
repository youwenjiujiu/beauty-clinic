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

      // 诊所列表
      clinics: [],
      showClinicModal: false,
      editingClinic: {
        name: '',
        nameKr: '',
        district: '',
        address: '',
        phone: '',
        specialties: '',
        priceRange: '中档',
        featured: false
      },

      // 轮播图
      banners: [],

      // 服务项目管理
      services: [],
      serviceCategories: ['全部', '整形手术', '皮肤管理', '微整形', '激光治疗', '其他'],
      selectedCategory: '全部',
      showServiceModal: false,
      editingService: null,
      nextServiceId: 1
    }
  },

  computed: {
    filteredServices() {
      if (this.selectedCategory === '全部') {
        return this.services;
      }
      return this.services.filter(s => s.category === this.selectedCategory);
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
                { value: 'gangnam', label: '江南' },
                { value: 'sinsa', label: '新沙' }
              ],
              services: [
                { value: 'skin', label: '皮肤管理' },
                { value: 'plastic', label: '整形手术' }
              ],
              priceRanges: [
                { value: '0-100', label: '100万韩元以下' },
                { value: '100-300', label: '100-300万韩元' }
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
        name: '',
        nameKr: '',
        district: '',
        address: '',
        phone: '',
        specialties: '',
        priceRange: '中档',
        featured: false
      };
      this.showClinicModal = true;
    },

    // 编辑诊所
    editClinic(clinic) {
      this.editingClinic = { ...clinic };
      this.showClinicModal = true;
    },

    // 保存诊所
    async saveClinic() {
      try {
        // 处理specialties字段（字符串转数组）
        const clinicData = {
          ...this.editingClinic,
          specialties: typeof this.editingClinic.specialties === 'string'
            ? this.editingClinic.specialties.split(',').map(s => s.trim()).filter(s => s)
            : this.editingClinic.specialties
        };

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
          this.showClinicModal = false;
          this.editingClinic = null;
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

    // 加载服务项目
    async loadServices() {
      try {
        const result = await this.apiRequest('GET', '/admin/config/services');
        if (result.success && result.data.content) {
          this.services = result.data.content.items || [];
          this.nextServiceId = Math.max(...this.services.map(s => s.id || 0)) + 1;
        }
      } catch (error) {
        console.error('加载服务项目失败:', error);
        // 使用默认数据
        this.services = [
          { id: 1, name: '双眼皮手术', nameKr: '쌍꺼풀 수술', category: '整形手术', description: '精细双眼皮成形术', priceRange: '150-300万韩元', duration: 60, isHot: true },
          { id: 2, name: '玻尿酸注射', nameKr: '히알루론산 주사', category: '微整形', description: '面部填充塑形', priceRange: '50-150万韩元', duration: 30, isHot: true },
          { id: 3, name: '激光美白', nameKr: '레이저 미백', category: '激光治疗', description: '改善肤色均匀度', priceRange: '80-200万韩元', duration: 45, isHot: false },
          { id: 4, name: '皮肤管理', nameKr: '피부 관리', category: '皮肤管理', description: '深层清洁保养', priceRange: '30-80万韩元', duration: 90, isHot: false }
        ];
        this.nextServiceId = 5;
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
        case 'banners':
          this.loadBanners();
          break;
        case 'services':
          this.loadServices();
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