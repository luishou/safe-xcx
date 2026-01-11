// pages/my-reports/my-reports.js
Page({
  data: {
    currentUser: {},
    currentSection: 'TJ01',
    loading: true,
    reports: [],
    filteredReports: [],
    currentFilter: 'processing',
    processingCount: 0,
    completedCount: 0,
    evaluatedCount: 0,
    pageTitle: '我的举报',
    isPublicView: false
  },

  onLoad(options) {
    this.loadUserInfo();
    this.loadReports();
  },

  onShow() {
    this.loadUserInfo();
    this.loadReports();
  },

  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;
    const currentSection = app.globalData.currentSection || 'TJ01';

    if (!currentUser) {
      this.setData({
        currentUser: { name: '微信用户', department: '未设置部门', avatar: '👷' },
        currentSection,
        displayUserId: 'default_user',
        userRole: 'guest',
        canOperate: false,
        pageTitle: '举报公示',
        isPublicView: true
      });
      return;
    }

    const hasManagementAccess = this.checkManagementAccess(currentUser);
    this.setData({
      currentUser,
      currentSection,
      pageTitle: hasManagementAccess ? '我的举报' : '举报公示',
      isPublicView: !hasManagementAccess
    });
  },

  checkManagementAccess(user) {
    if (!user) return false;
    if (user.managed_sections?.length > 0) return true;
    if (user.role === 'admin' || user.role === 'manager') return true;
    return false;
  },

  loadReports() {
    const app = getApp();
    if (!app.globalData.token) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    const apiUrl = this.data.isPublicView
      ? app.globalData.baseUrl + '/report/public-reports'
      : app.globalData.baseUrl + '/report/personal-reports';

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: { section: app.globalData.currentSection?.section_code },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.success) {
          const reports = res.data.data.reports;
          const { formatBeijing } = require('../../utils/time.js');

          const mapHazardType = (type) => {
            const mapping = {
              'fire': '消防安全隐患', 'electric': '电气安全隐患', 'chemical': '化学品安全隐患',
              'mechanical': '机械设备安全隐患', 'height': '高空作业安全隐患', 'edge': '临边防护安全隐患',
              'environment': '环境安全隐患', 'ppe': '个人防护装备隐患', 'other': '其他安全隐患'
            };
            return mapping[type] || type;
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

          const safeParseJSON = (jsonString) => {
            try { return jsonString ? JSON.parse(jsonString) : []; }
            catch { return []; }
          };

          const processedReports = reports.map(report => ({
            ...report,
            hazardType: mapHazardType(report.hazard_type),
            status: mapStatus(report.status),
            reporter: report.reporter_name || '未知',
            reportTime: formatBeijing(report.created_at),
            location: report.location,
            initialImages: safeParseJSON(report.initial_images),
            rectifiedImages: safeParseJSON(report.rectified_images)
          }));

          const processingReports = processedReports.filter(r => r.status !== '已办结');
          const completedReports = processedReports.filter(r => r.status === '已办结');
          const defaultFilteredReports = processingReports.length > 0 ? processingReports : processedReports;
          const defaultFilter = processingReports.length > 0 ? 'processing' : 'all';

          this.setData({
            reports: processedReports,
            filteredReports: defaultFilteredReports,
            currentFilter: defaultFilter,
            processingCount: processingReports.length,
            completedCount: completedReports.length,
            evaluatedCount: completedReports.length
          });
        } else {
          wx.showToast({ title: '获取举报记录失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  filterReports(e) {
    const filter = e.currentTarget.dataset.filter;
    let filteredReports = [];

    switch (filter) {
      case 'processing':
        filteredReports = this.data.reports.filter(r => r.status === '处理中' || r.status === '已分配');
        break;
      case 'completed':
        filteredReports = this.data.reports.filter(r => r.status === '已办结' || r.status === '已驳回');
        break;
      case 'evaluated':
        filteredReports = this.data.reports.filter(r => r.status === '已办结');
        break;
      default:
        filteredReports = this.data.reports;
    }

    this.setData({ currentFilter: filter, filteredReports });
  },

  goBack: function () { wx.reLaunch({ url: '/pages/index/index' }); },

  viewReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}&readonly=1&isPublicView=${this.data.isPublicView ? 1 : 0}` });
  },

  viewImage(e) {
    const src = e.currentTarget.dataset.src;
    const list = e.currentTarget.dataset.list;
    const urls = Array.isArray(list) ? list : (typeof list === 'string' ? list.split(',') : [src]);
    wx.previewImage({ current: src, urls });
  }
})