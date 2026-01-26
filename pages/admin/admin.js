// pages/admin/admin.js
Page({
  data: {
    currentSection: null,
    currentTab: 'pending',
    isAdmin: false,
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    pendingReports: [],
    processingReports: [],
    completedReports: [],
    allReports: [],
    loading: true,
    currentUser: null,
    hazardDistribution: [],
    canvasWidth: 0,
    canvasHeight: 0,
    currentPanel: 'tasks',
    statsFilterType: 'all',
    customStartDate: '',
    customEndDate: '',
    statsPendingCount: 0,
    statsProcessingCount: 0,
    statsCompletedCount: 0,
    totalReports: 0,
    resolutionRate: 0
  },

  onLoad(options) {
    const isAdmin = options.isAdmin === 'true' || options.isAdmin === true;
    this.setData({ isAdmin });
    this.loadData();
    this.loadUserInfo();
  },

  onShow() {
    this.loadData();
    this.loadUserInfo();
  },

  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;
    this.setData({
      currentUser: currentUser || {
        name: '数据中心',
        department: '监管部门',
        avatar: '/images/manager-avatar.png',
        phone: '137****9012'
      },
      currentSection: app.globalData.currentSection
    });
  },

  loadData() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;
    const isAdmin = this.data.isAdmin;

    // 举报公示（isAdmin=false）允许未登录用户浏览
    if (!currentSection) {
      this.setData({ loading: false });
      return;
    }

    // 如果是管理功能（数据中心），需要登录
    if (isAdmin && !app.globalData.token) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

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
    const hazardTypeColors = {
      '消防安全隐患': '#ef4444', '电气安全隐患': '#f97316', '化学品安全隐患': '#3b82f6',
      '机械设备安全隐患': '#f59e0b', '高空作业安全隐患': '#fb7185', '临边防护安全隐患': '#10b981',
      '环境安全隐患': '#059669', '个人防护装备隐患': '#6366f1', '其他安全隐患': '#8b5cf6'
    };

    const processReports = (reports) => {
      return (reports || []).map(report => ({
        ...report,
        hazardType: mapHazardType(report.hazard_type),
        hazardTypeColor: hazardTypeColors[mapHazardType(report.hazard_type)] || '#6b7280',
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

    // 状态映射关系：
    // 待处理：submitted
    // 处理中：confirmed, supervisor_confirmed, photo_uploaded
    // 已办结：completed
    const tabStatuses = {
      pending: ['submitted'],
      processing: ['confirmed', 'supervisor_confirmed', 'photo_uploaded'],
      completed: ['completed']
    };

    let done = 0;
    const finishOne = () => {
      done += 1;
      if (done === 3) {
        this.setData({ loading: false });
        this.fetchStats();
        this.generateAllReports();
      }
    };

    const fetchByStatuses = (statuses, onSuccess) => {
      const isAdmin = this.data.isAdmin;
      const token = app.globalData.token;
      
      // 如果是举报公示（isAdmin=false），使用公开接口，不需要token
      // 如果是数据中心（isAdmin=true），使用管理接口，需要token
      const url = isAdmin 
        ? app.globalData.baseUrl + '/report/list'
        : app.globalData.baseUrl + '/report/public';
      
      const headers = isAdmin && token 
        ? { 'Authorization': 'Bearer ' + token }
        : {};
      
      const requestData = {
        section: currentSection.section_code
      };
      
      // 管理接口可以按状态筛选，公开接口返回所有
      if (isAdmin && statuses.length > 0) {
        requestData.status = statuses.join(',');
      }

      wx.request({
        url: url,
        method: 'GET',
        header: headers,
        data: requestData,
        success: (res) => {
          if (res.data?.success) {
            let reports = res.data.data.reports || [];
            // 如果是公开接口，需要按状态筛选
            if (!isAdmin && statuses.length > 0) {
              reports = reports.filter(r => statuses.includes(r.status));
            }
            onSuccess(reports);
          } else {
            wx.showToast({ title: '获取举报记录失败', icon: 'none' });
            onSuccess([]);
          }
          finishOne();
        },
        fail: () => {
          wx.showToast({ title: '网络错误', icon: 'none' });
          onSuccess([]);
          finishOne();
        }
      });
    };

    fetchByStatuses(tabStatuses.pending, (list) => {
      const processed = processReports(list);
      this.setData({ pendingReports: processed, pendingCount: processed.length });
    });

    fetchByStatuses(tabStatuses.processing, (list) => {
      const processed = processReports(list);
      this.setData({ processingReports: processed, processingCount: processed.length });
    });

    fetchByStatuses(tabStatuses.completed, (list) => {
      const processed = processReports(list);
      this.setData({ completedReports: processed, completedCount: processed.length });
    });
  },

  processHazardDistribution(reports) {
    const totalReports = reports.length;
    const hazardTypes = {};
    const hazardColors = {
      'fire': '#ef4444', 'electric': '#f97316', 'chemical': '#3b82f6', 'mechanical': '#f59e0b',
      'height': '#fb7185', 'edge': '#10b981', 'environment': '#059669', 'ppe': '#6366f1', 'other': '#8b5cf6'
    };
    const hazardNames = {
      'fire': '消防隐患', 'electric': '用电隐患', 'chemical': '化学品隐患', 'mechanical': '机械设备隐患',
      'height': '高空作业安全隐患', 'edge': '临边防护安全隐患', 'environment': '环境安全隐患',
      'ppe': '个人防护装备隐患', 'other': '其他隐患'
    };

    reports.forEach(report => {
      const type = report.hazard_type || 'other';
      hazardTypes[type] = (hazardTypes[type] || 0) + 1;
    });

    let hazardDistribution = Object.keys(hazardTypes).map(type => ({
      name: hazardNames[type] || type,
      color: hazardColors[type] || '#6b7280',
      percentage: totalReports > 0 ? Math.round((hazardTypes[type] / totalReports) * 100) : 0
    }));

    const totalPercentage = hazardDistribution.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage < 100 && hazardDistribution.length > 0) {
      const largestItem = hazardDistribution.reduce((max, item) => item.percentage > max.percentage ? item : max);
      largestItem.percentage += (100 - totalPercentage);
    }

    this.setData({ hazardDistribution });
  },

  setCanvasSize() {
    if (!this.data.hazardDistribution?.length) return;
    const systemInfo = wx.getSystemInfoSync();
    const canvasSize = Math.round(systemInfo.screenWidth * 0.72);
    this.setData({ canvasWidth: canvasSize, canvasHeight: canvasSize });
    setTimeout(() => this.drawPieChart(), 200);
  },

  drawPieChart() {
    if (!this.data.hazardDistribution?.length) return;
    const canvasSize = this.data.canvasWidth;
    const centerX = canvasSize / 2, centerY = canvasSize / 2;
    const radius = canvasSize * 0.35, innerRadius = canvasSize * 0.18;
    const ctx = wx.createCanvasContext('adminPieChart', this);
    let currentAngle = -Math.PI / 2;

    this.data.hazardDistribution.forEach(item => {
      if (item.percentage > 0) {
        const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.setFillStyle(item.color);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(currentAngle) * innerRadius, centerY + Math.sin(currentAngle) * innerRadius);
        ctx.lineTo(centerX + Math.cos(currentAngle) * radius, centerY + Math.sin(currentAngle) * radius);
        ctx.setStrokeStyle('#ffffff');
        ctx.setLineWidth(2);
        ctx.stroke();
        currentAngle += sliceAngle;
      }
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.setStrokeStyle('#ffffff');
    ctx.setLineWidth(3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.setStrokeStyle('#ffffff');
    ctx.setLineWidth(3);
    ctx.stroke();
    ctx.draw(true);
  },

  goKnowledgeAdmin() { wx.navigateTo({ url: '/pages/knowledge-admin/knowledge-admin' }); },
  goVerificationAdmin() { wx.navigateTo({ url: '/pages/verification-admin/verification-admin' }); },
  goBack: function () { wx.reLaunch({ url: '/pages/index/index' }); },
  showStatsPanel() { this.setData({ currentPanel: 'stats' }); this.fetchStats(); },

  exportExcel() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;
    const token = app.globalData.token;

    if (!token || !currentSection) {
      wx.showToast({ title: '请先选择标段并登录', icon: 'none' });
      return;
    }

    const url = `${app.globalData.baseUrl}/report/export?section=${encodeURIComponent(currentSection.section_code)}`;
    wx.showLoading({ title: '导出中...' });

    wx.downloadFile({
      url,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200) {
          this._saveAndOpenFile(res.tempFilePath, currentSection.section_code);
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => wx.hideLoading()
    });
  },

  _saveAndOpenFile(tempFilePath, sectionCode) {
    const filename = `隐患导出_${sectionCode}_${Date.now()}.xlsx`;
    const dest = `${wx.env.USER_DATA_PATH}/${filename}`;
    const fs = wx.getFileSystemManager();

    fs.copyFile({
      src: tempFilePath,
      dest,
      success: () => {
        wx.showModal({
          title: '文件已保存',
          content: `文件已保存：${filename}`,
          confirmText: '打开文件',
          cancelText: '完成',
          success: (m) => { if (m.confirm) wx.openDocument({ filePath: dest, fileType: 'xlsx' }); }
        });
      },
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  },

  showTasksPanel() { this.setData({ currentPanel: 'tasks' }); },

  computeDateRange(type) {
    const now = new Date();
    let start = new Date();
    if (type === 'all') return { startDate: null, endDate: null };
    if (type === 'month') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (type === 'year') start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    else if (type === 'custom' && this.data.customStartDate && this.data.customEndDate) {
      start = new Date(this.data.customStartDate + 'T00:00:00');
      const end = new Date(this.data.customEndDate + 'T23:59:59');
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else return { startDate: null, endDate: null };
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  },

  onChangeStatsFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ statsFilterType: type });
    if (type !== 'custom') this.fetchStats();
  },

  onStartDateChange(e) { this.setData({ customStartDate: e.detail.value }); },
  onEndDateChange(e) { this.setData({ customEndDate: e.detail.value }); },

  applyCustomFilter() {
    if (!this.data.customStartDate || !this.data.customEndDate) {
      wx.showToast({ title: '请选择开始和结束日期', icon: 'none' });
      return;
    }
    this.fetchStats();
  },

  fetchStats() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;
    if (!currentSection || !app.globalData.token) return;

    const type = this.data.statsFilterType;
    const range = this.computeDateRange(type);
    const requestData = { section: currentSection.section_code };

    if (type === 'custom' && this.data.customStartDate && this.data.customEndDate) {
      requestData.startDate = new Date(this.data.customStartDate + 'T00:00:00').toISOString();
      requestData.endDate = new Date(this.data.customEndDate + 'T23:59:59').toISOString();
    } else if (range.startDate && range.endDate) {
      requestData.startDate = range.startDate;
      requestData.endDate = range.endDate;
    }

    wx.request({
      url: app.globalData.baseUrl + '/report/stats',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: requestData,
      success: (res) => {
        if (res.data?.success) {
          const { statusCounts, hazardDistribution, totalReports, resolutionRate } = res.data.data || {};
          const pending = statusCounts.submitted || 0;
          const processing = statusCounts.processing || 0;
          const completed = statusCounts.completed || 0;

          const total = hazardDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
          const hazardColors = {
            'fire': '#ef4444', 'electric': '#f97316', 'chemical': '#3b82f6', 'mechanical': '#f59e0b',
            'height': '#fb7185', 'edge': '#10b981', 'environment': '#059669', 'ppe': '#6366f1', 'other': '#8b5cf6'
          };
          const hazardNames = {
            'fire': '消防隐患', 'electric': '用电隐患', 'chemical': '化学品隐患', 'mechanical': '机械设备隐患',
            'height': '高空作业安全隐患', 'edge': '临边防护安全隐患', 'environment': '环境安全隐患',
            'ppe': '个人防护装备隐患', 'other': '其他隐患'
          };

          let dist = (hazardDistribution || []).map(h => ({
            name: hazardNames[h.type] || h.type,
            color: hazardColors[h.type] || '#6b7280',
            percentage: total > 0 ? Math.round(((h.count || 0) / total) * 100) : 0
          }));

          const totalPct = dist.reduce((s, i) => s + i.percentage, 0);
          if (totalPct < 100 && dist.length > 0) dist[0].percentage += (100 - totalPct);

          this.setData({
            statsPendingCount: pending,
            statsProcessingCount: processing,
            statsCompletedCount: completed,
            hazardDistribution: dist,
            totalReports: totalReports || 0,
            resolutionRate: resolutionRate || 0
          });

          this.setCanvasSize();
        } else {
          wx.showToast({ title: '统计数据获取失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  switchTab(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); },

  showReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    const status = this.data.currentTab;
    const isPublicView = !this.data.isAdmin;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}&status=${status}&isPublicView=${isPublicView}` });
  },

  refreshAllData() {
    wx.showLoading({ title: '刷新中...' });
    this.loadData();
    if (this.data.currentPanel === 'stats') this.fetchStats();
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '刷新完成', icon: 'success' });
    }, 1000);
  },

  generateAllReports() {
    const { pendingReports, processingReports, completedReports } = this.data;
    const allReports = [
      ...pendingReports.map(item => ({ ...item, statusClass: 'pending-item', statusText: '待处理' })),
      ...processingReports.map(item => ({ ...item, statusClass: 'processing-item', statusText: '处理中' })),
      ...completedReports.map(item => ({ ...item, statusClass: 'completed-item', statusText: '已办结' }))
    ];
    allReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    this.setData({ allReports });
  }
})