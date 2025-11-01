// pages/main/main.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    currentSection: null,
    currentTab: 'pending', // 当前选中的标签

    // 状态统计数据
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,

    // 待处理工单数据
    pendingReports: [],

    // 处理中工单数据
    processingReports: [],

    // 已办结工单数据
    completedReports: [],

    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadData();
    this.loadUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadData();
    this.loadUserInfo();
  },

  loadUserInfo() {
    const app = getApp();
    this.setData({
      currentUser: app.globalData.currentUser || {
        name: '安全环保部',
        role: 'manager',
        department: '安全部门',
        avatar: '/images/manager-avatar.png',
        phone: '137****9012'
      },
      currentSection: app.globalData.currentSection
    });
  },

  loadData() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;

    if (!currentSection) {
      console.log('未选择标段，无法加载数据');
      this.setData({
        loading: false
      });
      return;
    }

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

    // 从后端加载举报数据
    wx.request({
      url: app.globalData.baseUrl + '/report/list',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        section: currentSection.section_code
      },
      success: (res) => {
        this.setData({
          loading: false
        });

        if (res.data.success) {
          console.log('获取举报记录成功:', res.data.data.reports);
          const reports = res.data.data.reports;

          // 按状态分类
          const pendingReports = reports.filter(report => report.status === 'pending' || report.status === 'submitted');
          const processingReports = reports.filter(report => report.status === 'processing' || report.status === 'assigned');
          const completedReports = reports.filter(report => report.status === 'completed' || report.status === 'rejected');

          // 为每个举报添加中文映射
          const mapHazardType = (type) => {
            const mapping = {
              'fire': '消防安全隐患',
              'electric': '电气安全隐患',
              'chemical': '化学品安全隐患',
              'mechanical': '机械设备安全隐患',
              'other': '其他安全隐患'
            };
            return mapping[type] || type;
          };

          const mapSeverity = (severity) => {
            const mapping = {
              'low': '一般',
              'medium': '紧急',
              'high': '非常紧急',
              'critical': '极其紧急'
            };
            return mapping[severity] || severity;
          };

          const mapStatus = (status) => {
            const mapping = {
              'submitted': '已提交',
              'pending': '待处理',
              'assigned': '已分配',
              'processing': '处理中',
              'completed': '已办结',
              'rejected': '已驳回'
            };
            return mapping[status] || status;
          };

          const processReports = (reports) => {
            return reports.map(report => ({
              ...report,
              hazardType: mapHazardType(report.hazard_type),
              severity: mapSeverity(report.severity),
              status: mapStatus(report.status),
              reporter: report.reporter_name || '未知',
              reportTime: report.created_at,
              location: report.location,
              priority: report.severity,
              assignee: report.assignee_name,
              processTime: report.processed_at,
              completeTime: report.completed_at,
              resultType: report.status === 'rejected' ? 'rejected' : 'confirmed'
            }));
          };

          this.setData({
            pendingReports: processReports(pendingReports),
            processingReports: processReports(processingReports),
            completedReports: processReports(completedReports),
            pendingCount: pendingReports.length,
            processingCount: processingReports.length,
            completedCount: completedReports.length
          });
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

  goBack: function() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 切换状态标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 显示举报详情（所有状态通用）
  showReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    const status = this.data.currentTab;

    wx.navigateTo({
      url: `/pages/report-detail/report-detail?id=${id}&status=${status}`
    });
  }
})