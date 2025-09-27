const { createApp } = Vue;

createApp({
  data() {
    return {
      // API基础地址
      apiBase: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://backend.vercel.app',

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
      editingClinic: null,

      // 轮播图
      banners: []
    }
  },

  mounted() {
    // 检查登录状态
    if (!this.token) {
      this.showLogin();
      return;
    }

    // 加载初始数据
    this.loadHotSearches();
  },

  methods: {
    // 显示登录框
    showLogin() {
      const password = prompt('请输入管理员密码：');
      if (password === 'admin2025') {
        // 模拟登录成功
        this.token = 'mock_admin_token_' + Date.now();
        localStorage.setItem('admin_token', this.token);
        this.loadHotSearches();
      } else {
        alert('密码错误！');
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
      try {
        const config = {
          method: method,
          url: `${this.apiBase}/api${endpoint}`,
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);
        return response.data;
      } catch (error) {
        console.error('API请求失败:', error);
        if (error.response && error.response.status === 403) {
          alert('权限不足，请重新登录');
          this.logout();
        } else {
          alert('操作失败: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
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
      this.hotSearches.push({
        keyword: '',
        priority: 50,
        isHot: false
      });
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

    // 编辑诊所
    editClinic(clinic) {
      this.editingClinic = { ...clinic };
      this.showClinicModal = true;
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
      }
    }
  }
}).mount('#app');