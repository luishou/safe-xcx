// pages/admin/admin.js
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
    currentUser: null,
    // 饼图相关数据
    hazardDistribution: [],
    canvasWidth: 0,
    canvasHeight: 0,
    // 视图面板：stats 或 tasks
    currentPanel: 'tasks',

    // 统计筛选
    statsFilterType: 'all', // all | month | year | custom
    customStartDate: '',
    customEndDate: '',

    // 统计汇总
    statsPendingCount: 0,
    statsProcessingCount: 0,
    statsCompletedCount: 0,
    totalReports: 0,
    resolutionRate: 0
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

    console.log('管理员页面 - 当前用户:', currentUser);

    // 不做权限检查，前端控制菜单显示

    this.setData({
      currentUser: currentUser || {
        name: '安全环保部',
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

    // 定义映射与处理函数
    const mapHazardType = (type) => {
      const mapping = {
        'fire': '消防安全隐患',
        'electric': '电气安全隐患',
        'chemical': '化学品安全隐患',
        'mechanical': '机械设备安全隐患',
        'height': '高空作业安全隐患',
        'traffic': '交通安全隐患',
        'environment': '环境安全隐患',
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
      return (reports || []).map(report => ({
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

    // 三类状态的后端查询，分别请求（统一为三状态）
    const tabStatuses = {
      pending: ['submitted'],
      processing: ['processing'],
      completed: ['completed']
    };

    let done = 0;
    const finishOne = () => {
      done += 1;
      if (done === 3) {
        this.setData({ loading: false });
        // 统计与图表改为使用后端统计接口
        this.fetchStats();
      }
    };

    const fetchByStatuses = (statuses, onSuccess) => {
      wx.request({
        url: app.globalData.baseUrl + '/report/list',
        method: 'GET',
        header: { 'Authorization': 'Bearer ' + app.globalData.token },
        data: { section: currentSection.section_code, status: statuses.join(',') },
        success: (res) => {
          if (res.data && res.data.success) {
            onSuccess(res.data.data.reports || []);
          } else {
            wx.showToast({ title: '获取举报记录失败', icon: 'none' });
            onSuccess([]);
          }
          finishOne();
        },
        fail: (err) => {
          console.error('获取举报记录请求失败:', err);
          wx.showToast({ title: '网络错误', icon: 'none' });
          onSuccess([]);
          finishOne();
        }
      });
    };

    // 请求待处理
    fetchByStatuses(tabStatuses.pending, (list) => {
      const processed = processReports(list);
      this.setData({
        pendingReports: processed,
        pendingCount: processed.length
      });
    });

    // 请求处理中
    fetchByStatuses(tabStatuses.processing, (list) => {
      const processed = processReports(list);
      this.setData({
        processingReports: processed,
        processingCount: processed.length
      });
    });

    // 请求已办结
    fetchByStatuses(tabStatuses.completed, (list) => {
      const processed = processReports(list);
      this.setData({
        completedReports: processed,
        completedCount: processed.length
      });
    });
  },

  // 统计隐患类型分布
  processHazardDistribution(reports) {
    const totalReports = reports.length;
    const hazardTypes = {};
    const hazardColors = {
      'fire': '#ef4444',
      'electric': '#f97316',
      'chemical': '#3b82f6',
      'mechanical': '#f59e0b',
      'other': '#8b5cf6'
    };
    const hazardNames = {
      'fire': '消防隐患',
      'electric': '用电隐患',
      'chemical': '化学品隐患',
      'mechanical': '机械设备隐患',
      'other': '其他隐患'
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
      const largestItem = hazardDistribution.reduce((max, item) =>
        item.percentage > max.percentage ? item : max
      );
      largestItem.percentage += (100 - totalPercentage);
    }

    this.setData({ hazardDistribution });
  },

  // 设置画布尺寸
  setCanvasSize() {
    if (!this.data.hazardDistribution || this.data.hazardDistribution.length === 0) return;

    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.screenWidth;
    const canvasSize = Math.round(screenWidth * 0.72);

    this.setData({
      canvasWidth: canvasSize,
      canvasHeight: canvasSize
    });

    setTimeout(() => {
      this.drawPieChart();
    }, 200);
  },

  // 绘制饼图
  drawPieChart() {
    if (!this.data.hazardDistribution || this.data.hazardDistribution.length === 0) return;

    const canvasSize = this.data.canvasWidth;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = canvasSize * 0.35;
    const innerRadius = canvasSize * 0.18;

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
        ctx.moveTo(
          centerX + Math.cos(currentAngle) * innerRadius,
          centerY + Math.sin(currentAngle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(currentAngle) * radius,
          centerY + Math.sin(currentAngle) * radius
        );
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

  // 进入安全知识管理
  goKnowledgeAdmin() {
    wx.navigateTo({ url: '/pages/knowledge-admin/knowledge-admin' });
  },

  goBack: function() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 切换面板为统计
  showStatsPanel() {
    this.setData({ currentPanel: 'stats' });
    // 切换到统计时，按照当前筛选拉取统计数据
    this.fetchStats();
  },

  // 导出Excel（当前标段全部隐患）
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
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: 'xlsx',
            success: () => {
              wx.showToast({ title: '已打开Excel', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '已下载至本地', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('导出失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 切换面板为任务中心
  showTasksPanel() {
    this.setData({ currentPanel: 'tasks' });
  },

  // 统计：计算时间范围
  computeDateRange(type) {
    const now = new Date();
    let start = new Date();
    if (type === 'all') {
      // 显示所有数据，返回null表示不限制时间
      return { startDate: null, endDate: null };
    } else if (type === 'month') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (type === 'year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      // custom 使用用户选择的日期
      if (this.data.customStartDate && this.data.customEndDate) {
        start = new Date(this.data.customStartDate + 'T00:00:00');
        const end = new Date(this.data.customEndDate + 'T23:59:59');
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      // 未选择完整日期范围时不加时间条件
      return { startDate: null, endDate: null };
    }
    const end = now;
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  },

  // 统计：切换筛选类型
  onChangeStatsFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ statsFilterType: type });
    if (type !== 'custom') {
      this.fetchStats();
    }
  },

  // 统计：自定义日期选择
  onStartDateChange(e) {
    this.setData({ customStartDate: e.detail.value });
  },
  onEndDateChange(e) {
    this.setData({ customEndDate: e.detail.value });
  },
  applyCustomFilter() {
    if (!this.data.customStartDate || !this.data.customEndDate) {
      wx.showToast({ title: '请选择开始和结束日期', icon: 'none' });
      return;
    }
    this.fetchStats();
  },

  // 统计：拉取后端统计数据并更新视图
  fetchStats() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;
    if (!currentSection || !app.globalData.token) {
      return;
    }

    const type = this.data.statsFilterType;
    const range = this.computeDateRange(type);
    const requestData = { section: currentSection.section_code };

    // 自定义优先使用用户选择的日期范围
    if (type === 'custom' && this.data.customStartDate && this.data.customEndDate) {
      const start = new Date(this.data.customStartDate + 'T00:00:00').toISOString();
      const end = new Date(this.data.customEndDate + 'T23:59:59').toISOString();
      requestData.startDate = start;
      requestData.endDate = end;
    } else if (range.startDate && range.endDate) {
      requestData.startDate = range.startDate;
      requestData.endDate = range.endDate;
    }

    console.log('统计数据请求参数:', requestData);

    wx.request({
      url: app.globalData.baseUrl + '/report/stats',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: requestData,
      success: (res) => {
        if (res.data && res.data.success) {
          const { statusCounts, hazardDistribution, totalReports, resolutionRate } = res.data.data || {};

          console.log('统计数据返回的状态分布:', statusCounts);

          // 统一三状态统计卡片：直接使用后端聚合结果
          const pending = statusCounts.submitted || 0;
          const processing = statusCounts.processing || 0;
          const completed = statusCounts.completed || 0;

          // 将后端的类型分布(count)转为百分比供环形图使用
          const total = hazardDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
          const hazardColors = {
            'fire': '#ef4444',
            'electric': '#f97316',
            'chemical': '#3b82f6',
            'mechanical': '#f59e0b',
            'other': '#8b5cf6'
          };
          const hazardNames = {
            'fire': '消防隐患',
            'electric': '用电隐患',
            'chemical': '化学品隐患',
            'mechanical': '机械设备隐患',
            'other': '其他隐患'
          };
          let dist = (hazardDistribution || []).map(h => ({
            name: hazardNames[h.type] || h.type,
            color: hazardColors[h.type] || '#6b7280',
            percentage: total > 0 ? Math.round(((h.count || 0) / total) * 100) : 0
          }));
          const totalPct = dist.reduce((s, i) => s + i.percentage, 0);
          if (totalPct < 100 && dist.length > 0) {
            dist[0].percentage += (100 - totalPct);
          }

          this.setData({
            statsPendingCount: pending,
            statsProcessingCount: processing,
            statsCompletedCount: completed,
            hazardDistribution: dist,
            totalReports: totalReports || 0,
            resolutionRate: resolutionRate || 0
          });

          // 更新画布绘制
          this.setCanvasSize();
        } else {
          wx.showToast({ title: '统计数据获取失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('统计数据请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
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
  },

  // 刷新所有数据
  refreshAllData() {
    wx.showLoading({
      title: '刷新中...'
    });

    // 刷新任务中心数据
    this.loadData();

    // 如果当前在统计面板，也刷新统计数据
    if (this.data.currentPanel === 'stats') {
      this.fetchStats();
    }

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '刷新完成',
        icon: 'success'
      });
    }, 1000);
  }
})
