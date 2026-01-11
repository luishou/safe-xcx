// pages/main/main.js
Page({
  data: {
    currentUser: {},
    currentSection: null,
    currentTab: 'pending',
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    pendingReports: [],
    processingReports: [],
    completedReports: [],
    loading: true
  },

  onLoad(options) {
    this.loadData();
    this.loadUserInfo();
  },

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

    if (!currentSection || !app.globalData.token) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    const baseUrl = app.globalData.baseUrl + '/report/list';
    const headers = { 'Authorization': 'Bearer ' + app.globalData.token };
    const section = currentSection.section_code;

    const mapHazardType = (type) => {
      const mapping = {
        'fire': '消防安全隐患', 'electric': '电气安全隐患', 'chemical': '化学品安全隐患',
        'mechanical': '机械设备安全隐患', 'height': '高空作业安全隐患', 'edge': '临边防护安全隐患',
        'environment': '环境安全隐患', 'ppe': '个人防护装备隐患', 'other': '其他安全隐患'
      };
      return mapping[type] || type;
    };

    const mapSeverity = (severity) => {
      const mapping = { 'low': '一般', 'medium': '紧急', 'high': '非常紧急', 'critical': '极其紧急' };
      return mapping[severity] || severity;
    };

    const mapStatus = (status) => {
      const mapping = {
        'submitted': '待处理',
        'confirmed': '待监理确认',
        'supervisor_confirmed': '待整改',
        'photo_uploaded': '待下发奖金',
        'completed': '已办结'
      };
      return mapping[status] || status;
    };

    const { formatBeijing } = require('../../utils/time.js');
    const processReports = (reports) => reports.map(report => ({
      ...report,
      hazardType: mapHazardType(report.hazard_type),
      severity: mapSeverity(report.severity),
      status: mapStatus(report.status),
      reporter: report.reporter_name || '未知',
      reporter_verified: report.reporter_verified || false,
      reportTime: formatBeijing(report.created_at),
      location: report.location,
      priority: report.severity,
      assignee: report.assignee_name,
      processTime: formatBeijing(report.processed_at),
      completeTime: formatBeijing(report.completed_at),
      resultType: 'confirmed'
    }));

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
          if (res.data?.success) {
            const processed = processReports(res.data.data.reports || []);
            const update = {};
            if (req.key === 'pending') { update.pendingReports = processed; update.pendingCount = processed.length; }
            else if (req.key === 'processing') { update.processingReports = processed; update.processingCount = processed.length; }
            else if (req.key === 'completed') { update.completedReports = processed; update.completedCount = processed.length; }
            this.setData(update);
          } else {
            wx.showToast({ title: '获取举报记录失败', icon: 'none' });
          }
        },
        fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
        complete: () => {
          finished += 1;
          if (finished === requests.length) this.setData({ loading: false });
        }
      });
    });
  },

  goBack: function () { wx.reLaunch({ url: '/pages/index/index' }); },
  switchTab(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); },

  showReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}&status=${this.data.currentTab}` });
  }
})