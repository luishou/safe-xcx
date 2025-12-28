// pages/my-reports/my-reports.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    currentSection: 'TJ01',
    loading: true,

    // 举报数据 - 从后端获取
    reports: [],
    filteredReports: [],
    currentFilter: 'processing', // processing, completed, evaluated
    processingCount: 0,
    completedCount: 0,
    evaluatedCount: 0,

    // 页面配置
    pageTitle: '我的举报',
    isPublicView: false // 是否为公示视图（无安全管理部权限）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
    this.loadReports();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
    this.loadReports();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;

    const currentSection = app.globalData.currentSection || 'TJ01';

    if (!currentUser) {
      // 设置默认用户信息
      this.setData({
        currentUser: {
          name: '微信用户',
          department: '未设置部门',
          avatar: '👷'
        },
        currentSection: currentSection,
        displayUserId: 'default_user',
        userRole: 'guest',
        canOperate: false,
        pageTitle: '举报公示',
        isPublicView: true
      });
      return;
    }

    // 检查用户是否有安全管理部权限
    const hasManagementAccess = this.checkManagementAccess(currentUser);

    this.setData({
      currentUser: currentUser,
      currentSection: currentSection,
      pageTitle: hasManagementAccess ? '我的举报' : '举报公示',
      isPublicView: !hasManagementAccess
    });
  },

  /**
   * 检查用户是否有安全管理部权限
   */
  checkManagementAccess(user) {
    if (!user) return false;

    // 检查managed_sections字段
    if (user.managed_sections && user.managed_sections.length > 0) {
      return true;
    }

    // 检查角色
    if (user.role === 'admin' || user.role === 'manager') {
      return true;
    }

    return false;
  },

  /**
   * 加载举报数据
   */
  loadReports() {
    const app = getApp();

    if (!app.globalData.token) {
      console.log('未登录，无法加载数据');
      this.setData({
        loading: false
      });
      return;
    }

    this.setData({
      loading: true
    });

    const currentUser = app.globalData.currentUser;
    console.log('=== 我的举报页面加载 ===');
    console.log('当前用户信息:', currentUser);
    console.log('用户ID:', currentUser?.id);
    console.log('用户角色:', currentUser?.role);
    console.log('是否为公示视图:', this.data.isPublicView);

    // 根据视图类型选择不同的接口
    const apiUrl = this.data.isPublicView 
      ? app.globalData.baseUrl + '/report/public-reports'
      : app.globalData.baseUrl + '/report/personal-reports';

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        section: app.globalData.currentSection?.section_code
      },
      success: (res) => {
        this.setData({
          loading: false
        });

        if (res.data.success) {
          console.log('获取举报记录成功:', res.data.data.reports);
          const reports = res.data.data.reports;

          // 映射函数
          const mapHazardType = (type) => {
            const mapping = {
              'fire': '消防安全隐患',
              'electric': '电气安全隐患',
              'chemical': '化学品安全隐患',
              'mechanical': '机械设备安全隐患',
              'height': '高空作业安全隐患',
              'edge': '临边防护安全隐患',
              'environment': '环境安全隐患',
              'ppe': '个人防护装备隐患',
              'other': '其他安全隐患'
            };
            return mapping[type] || type;
          };

          const mapStatus = (status) => {
            const mapping = {
              'submitted': '待处理',
              'processing': '处理中',
              'completed': '已办结'
            };
            return mapping[status] || status;
          };

          const { formatBeijing } = require('../../utils/time.js');

          // 安全解析JSON数据
          const safeParseJSON = (jsonString) => {
            try {
              if (!jsonString) return [];
              return JSON.parse(jsonString);
            } catch (error) {
              console.error('JSON解析失败:', error, '原始数据:', jsonString);
              return [];
            }
          };

          const processReports = (reports) => {
            return reports.map(report => {
              console.log('处理举报记录:', report);
              return {
                ...report,
                hazardType: mapHazardType(report.hazard_type),
                status: mapStatus(report.status),
                reporter: report.reporter_name || '未知',
                reportTime: formatBeijing(report.created_at),
                location: report.location,
                initialImages: safeParseJSON(report.initial_images),
                rectifiedImages: safeParseJSON(report.rectified_images)
              };
            });
          };

          const processedReports = processReports(reports);

          // 按状态分类
          const processingReports = processedReports.filter(report => report.status === '处理中' || report.status === '待处理');
          const completedReports = processedReports.filter(report => report.status === '已办结');
          const evaluatedReports = completedReports.filter(report => report.status === '已办结'); // 假设已办结的就是已评价的

          console.log('状态统计:', {
            总数: processedReports.length,
            处理中: processingReports.length,
            已办结: completedReports.length,
            已评价: evaluatedReports.length
          });

          // 默认显示处理中的记录，如果没有则显示全部
          const defaultFilteredReports = processingReports.length > 0 ? processingReports : processedReports;
          const defaultFilter = processingReports.length > 0 ? 'processing' : 'all';

          this.setData({
            reports: processedReports,
            filteredReports: defaultFilteredReports,
            currentFilter: defaultFilter,
            processingCount: processingReports.length,
            completedCount: completedReports.length,
            evaluatedCount: evaluatedReports.length
          });

          console.log('处理后的举报数据:', processedReports);
          console.log('当前显示的举报数据:', defaultFilteredReports);
        } else {
          console.error('获取举报记录失败:', res.data.message);
          wx.showToast({
            title: '获取举报记录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取举报记录请求失败:', err);
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 筛选举报记录
   */
  filterReports(e) {
    const filter = e.currentTarget.dataset.filter;
    let filteredReports = [];

    switch (filter) {
      case 'processing':
        filteredReports = this.data.reports.filter(report => report.status === '处理中' || report.status === '已分配');
        break;
      case 'completed':
        filteredReports = this.data.reports.filter(report => report.status === '已办结' || report.status === '已驳回');
        break;
      case 'evaluated':
        filteredReports = this.data.reports.filter(report => report.status === '已办结');
        break;
      case 'all':
        filteredReports = this.data.reports;
        break;
      default:
        filteredReports = this.data.reports;
    }

    console.log(`筛选 ${filter} 状态的记录:`, filteredReports);

    this.setData({
      currentFilter: filter,
      filteredReports: filteredReports
    });
  },

  goBack: function () {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 查看举报详情
   */
  viewReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/report-detail/report-detail?id=${id}&readonly=1&isPublicView=${this.data.isPublicView ? 1 : 0}`
    });
  },

  /**
   * 查看图片
   */
  viewImage(e) {
    const src = e.currentTarget.dataset.src;
    const list = e.currentTarget.dataset.list;
    const urls = Array.isArray(list) ? list : (typeof list === 'string' ? list.split(',') : [src]);
    wx.previewImage({
      current: src,
      urls: urls
    });
  }
})