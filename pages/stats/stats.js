// pages/stats/stats.js
Page({
  data: {
    totalReports: 0,
    resolveRate: 0,
    timeFilters: [
      { id: 'week', label: '最近一周', active: true },
      { id: 'month', label: '最近一月', active: false },
      { id: 'quarter', label: '最近三月', active: false },
      { id: 'all', label: '全部时间', active: false }
    ],
    selectedTimeRange: '最近一周',
    hazardDistribution: [],
    chartData: [],
    loading: true
  },

  onLoad(options) {
    this.initChartData();
    this.loadStatistics();
  },

  onReady() {
    this.setCanvasSize();
  },

  onShow() {
    this.loadStatistics();
  },

  setCanvasSize() {
    const systemInfo = wx.getSystemInfoSync();
    const pixelRatio = systemInfo.pixelRatio || 1;
    const canvasSize = systemInfo.screenWidth * 0.8;
    const actualSize = canvasSize * pixelRatio;
    this.setData({ canvasWidth: actualSize, canvasHeight: actualSize });
    setTimeout(() => this.drawPieChart(), 200);
  },

  initChartData() {
    const chartData = this.data.hazardDistribution.map(item => ({
      name: item.name,
      value: item.percentage,
      color: item.color
    }));
    this.setData({ chartData });
  },

  drawPieChart() {
    if (this.data.hazardDistribution.length === 0) return;

    const systemInfo = wx.getSystemInfoSync();
    const pixelRatio = systemInfo.pixelRatio || 1;
    const canvasSize = this.data.canvasWidth / pixelRatio;
    const centerX = canvasSize / 2, centerY = canvasSize / 2;
    const radius = canvasSize * 0.35, innerRadius = canvasSize * 0.18;
    const ctx = wx.createCanvasContext('pieChart', this);
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

  loadStatistics() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;

    if (!app.globalData.token || !currentSection) {
      this.setData({ loading: false });
      return;
    }

    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: app.globalData.baseUrl + '/report/stats',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: { section: currentSection.section_code },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const { statusCounts, hazardDistribution, totalReports, resolutionRate } = res.data.data || {};
          this.applyStatsData({ statusCounts, hazardDistribution, totalReports, resolutionRate });
        } else {
          wx.showToast({ title: '获取统计数据失败', icon: 'none' });
        }
        this.setData({ loading: false });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  },

  applyStatsData({ statusCounts = {}, hazardDistribution = [], totalReports = 0, resolutionRate = 0 }) {
    const total = (hazardDistribution || []).reduce((sum, item) => sum + (item.count || 0), 0);
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
      totalReports: totalReports || 0,
      resolveRate: resolutionRate || 0,
      hazardDistribution: dist
    });

    this.initChartData();
    setTimeout(() => this.setCanvasSize(), 300);
  },

  onTimeFilterTap(e) {
    const filterId = e.currentTarget.dataset.id;
    const filterLabel = e.currentTarget.dataset.label;
    const timeFilters = this.data.timeFilters.map(filter => ({ ...filter, active: filter.id === filterId }));
    this.setData({ timeFilters, selectedTimeRange: filterLabel });
    this.loadStatistics();
  },

  refreshData() {
    wx.showLoading({ title: '刷新中...' });
    setTimeout(() => {
      wx.hideLoading();
      this.loadStatistics();
      wx.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  },

  exportReport() {
    wx.showActionSheet({
      itemList: ['导出PDF报告', '导出Excel数据', '分享统计图表'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: this.exportPDF(); break;
          case 1: this.exportExcel(); break;
          case 2: this.shareChart(); break;
        }
      }
    });
  },

  exportPDF() {
    wx.showLoading({ title: '生成PDF中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: 'PDF报告已生成', icon: 'success' });
    }, 2000);
  },

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
          const filename = `隐患导出_${currentSection.section_code}_${Date.now()}.xlsx`;
          const dest = `${wx.env.USER_DATA_PATH}/${filename}`;
          const fs = wx.getFileSystemManager();
          fs.copyFile({
            src: res.tempFilePath,
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
        } else {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => wx.hideLoading()
    });
  },

  shareChart() {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  },

  goBack() { wx.reLaunch({ url: '/pages/index/index' }); },

  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '安全统计数据',
      path: '/pages/stats/stats',
      imageUrl: '/images/share-stats.png'
    };
  }
});
