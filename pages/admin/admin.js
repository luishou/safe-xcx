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

    // 检查是否是管理员
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!isAdmin) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限访问安全管理部页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.setData({
      currentUser: currentUser || {
        name: '安全环保部',
        role: 'admin',
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

          console.log('任务中心状态分类结果:', {
            总数: reports.length,
            待处理: pendingReports.length,
            处理中: processingReports.length,
            已办结: completedReports.length,
            待处理状态: pendingReports.map(r => ({ id: r.id, status: r.status })),
            处理中状态: processingReports.map(r => ({ id: r.id, status: r.status }))
          });

          // 为每个举报添加中文映射
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
              'submitted': '已提交',
              'pending': '待处理',
              'assigned': '已分配',
              'processing': '处理中',
              'completed': '已办结',
              'rejected': '已驳回'
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

          // 计算隐患类型分布用于饼图
          this.processHazardDistribution(reports);
          // 设置画布尺寸并绘制饼图
          this.setCanvasSize();
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

    const range = this.computeDateRange(this.data.statsFilterType);
    const requestData = {
      section: currentSection.section_code
    };

    // 只有当时间范围不为null时才添加时间参数
    if (range.startDate && range.endDate) {
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

          // 映射到三类统计卡片（与任务中心保持一致）
          const pending = (statusCounts.pending || 0) + (statusCounts.submitted || 0);
          const processing = (statusCounts.processing || 0) + (statusCounts.assigned || 0);
          const completed = (statusCounts.completed || 0) + (statusCounts.rejected || 0);

          console.log('统计卡片计算结果:', {
            pending: `${pending} = (${statusCounts.pending || 0}) + (${statusCounts.submitted || 0})`,
            processing: `${processing} = (${statusCounts.processing || 0}) + (${statusCounts.assigned || 0})`,
            completed: `${completed} = (${statusCounts.completed || 0}) + (${statusCounts.rejected || 0})`
          });

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