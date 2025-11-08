// pages/employee/employee.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
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

    loading: true,
    currentUser: null
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
    const currentUser = app.globalData.currentUser;

    console.log('员工页面 - 当前用户:', currentUser);

    // 检查是否是普通员工
    const isEmployee = currentUser && currentUser.role === 'employee';

    if (!isEmployee) {
      wx.showModal({
        title: '权限提示',
        content: '您不是普通员工用户',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.setData({
      currentUser: currentUser || {
        name: '员工',
        role: 'employee',
        department: '生产车间',
        avatar: '/images/employee-avatar.png',
        phone: '138****1234'
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

    // 后端按状态分组拉取，避免前端再筛选
    const baseUrl = app.globalData.baseUrl + '/report/list';
    const headers = { 'Authorization': 'Bearer ' + app.globalData.token };
    const section = currentSection.section_code;

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
        'submitted': '待处理',
        'processing': '处理中',
        'completed': '已办结'
      };
      return mapping[status] || status;
    };

    const { formatBeijing } = require('../../utils/time.js');
    const processReports = (reports) => {
      return reports.map(report => ({
        ...report,
        hazardType: mapHazardType(report.hazard_type),
        severity: mapSeverity(report.severity),
        status: mapStatus(report.status),
        reporter: report.reporter_name || '未知',
        reportTime: formatBeijing(report.created_at),
        location: report.location,
        priority: report.severity,
        assignee: report.assignee_name,
        processTime: formatBeijing(report.processed_at),
        completeTime: formatBeijing(report.completed_at),
        resultType: 'confirmed'
      }));
    };

    const requests = [
      { key: 'pending', status: 'submitted' },
      { key: 'processing', status: 'processing' },
      { key: 'completed', status: 'completed' }
    ];

    let finished = 0;

    requests.forEach(req => {
      wx.request({
        url: baseUrl,
        method: 'GET',
        header: headers,
        data: { section, status: req.status },
        success: (res) => {
          if (res.data && res.data.success) {
            const reports = res.data.data.reports || [];
            const processed = processReports(reports);
            const update = {};
            if (req.key === 'pending') {
              update.pendingReports = processed;
              update.pendingCount = processed.length;
            } else if (req.key === 'processing') {
              update.processingReports = processed;
              update.processingCount = processed.length;
            } else if (req.key === 'completed') {
              update.completedReports = processed;
              update.completedCount = processed.length;
            }
            this.setData(update);
          } else {
            wx.showToast({ title: '获取举报记录失败', icon: 'none' });
          }
        },
        fail: () => {
          wx.showToast({ title: '网络错误', icon: 'none' });
        },
        complete: () => {
          finished += 1;
          if (finished === requests.length) {
            this.setData({ loading: false });
          }
        }
      });
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

  // 显示举报详情（仅查看）
  showReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    const status = this.data.currentTab;

    wx.navigateTo({
      url: `/pages/report-detail/report-detail?id=${id}&status=${status}`
    });
  }
})