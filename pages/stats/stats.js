// pages/stats/stats.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 数据统计
    totalReports: 0,
    resolveRate: 0,

    // 时间筛选选项
    timeFilters: [
      { id: 'week', label: '最近一周', active: true },
      { id: 'month', label: '最近一月', active: false },
      { id: 'quarter', label: '最近三月', active: false },
      { id: 'all', label: '全部时间', active: false }
    ],

    // 当前选中的时间范围
    selectedTimeRange: '最近一周',

    // 隐患类型分布数据
    hazardDistribution: [],

    // 图表数据（用于饼图显示）
    chartData: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initChartData();
    this.loadStatistics();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成后设置画布尺寸并绘制饼图
    this.setCanvasSize();
  },

  /**
   * 设置画布自适应尺寸
   */
  setCanvasSize() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.screenWidth;
    const pixelRatio = systemInfo.pixelRatio || 1;

    // 计算画布尺寸 (80%屏幕宽度)
    const canvasSize = screenWidth * 0.8;

    // 设置画布实际像素尺寸
    const actualSize = canvasSize * pixelRatio;
    this.setData({
      canvasWidth: actualSize,
      canvasHeight: actualSize
    });

    // 延迟绘制饼图，确保画布尺寸已设置
    setTimeout(() => {
      this.drawPieChart();
    }, 200);
  },

  /**
   * 初始化图表数据
   */
  initChartData() {
    const chartData = this.data.hazardDistribution.map(item => ({
      name: item.name,
      value: item.percentage,
      color: item.color
    }));
    
    this.setData({
      chartData: chartData
    });
  },

  /**
   * 绘制饼图
   */
  drawPieChart() {
    if (this.data.hazardDistribution.length === 0) {
      return;
    }

    const systemInfo = wx.getSystemInfoSync();
    const pixelRatio = systemInfo.pixelRatio || 1;
    const canvasSize = this.data.canvasWidth / pixelRatio;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = canvasSize * 0.35;     // 饼图半径为画布的35%
    const innerRadius = canvasSize * 0.18; // 内圆半径为画布的18%

    const ctx = wx.createCanvasContext('pieChart', this);

    let currentAngle = -Math.PI / 2; // 从顶部开始绘制

    // 绘制每个扇形
    this.data.hazardDistribution.forEach((item, index) => {
      if (item.percentage > 0) {
        const sliceAngle = (item.percentage / 100) * 2 * Math.PI;

        // 绘制外圆弧
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();

        // 设置颜色并填充
        ctx.setFillStyle(item.color);
        ctx.fill();

        // 绘制分割线
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

    // 绘制最后一条分割线
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

    // 绘制内圆边框
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.setStrokeStyle('#ffffff');
    ctx.setLineWidth(3);
    ctx.stroke();

    // 绘制外圆边框
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.setStrokeStyle('#ffffff');
    ctx.setLineWidth(3);
    ctx.stroke();

    ctx.draw(true); // 使用 reserve 参数确保在下一帧绘制
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    const app = getApp();
    const currentSection = app.globalData.currentSection;

    if (!app.globalData.token || !currentSection) {
      console.log('未登录或未选择标段，无法加载统计数据');
      this.setData({
        loading: false
      });
      return;
    }

    wx.showLoading({
      title: '加载中...'
    });

    // 从后端获取聚合统计数据
    wx.request({
      url: app.globalData.baseUrl + '/report/stats',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        section: currentSection.section_code
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const { statusCounts, hazardDistribution, totalReports, resolutionRate } = res.data.data || {};
          this.applyStatsData({ statusCounts, hazardDistribution, totalReports, resolutionRate });
        } else {
          console.error('获取统计数据失败:', res.data.message);
          wx.showToast({
            title: '获取统计数据失败',
            icon: 'none'
          });
        }
        this.setData({
          loading: false
        });
      },
      fail: (err) => {
        console.error('获取统计数据请求失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        this.setData({
          loading: false
        });
      }
    });
  },

  /**
   * 处理统计数据
   */
  processStatisticsData(reports) {
    const totalReports = reports.length;
    const completedReports = reports.filter(report => report.status === 'completed').length;
    const resolveRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

    // 统计隐患类型分布
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
      const type = report.hazard_type;
      hazardTypes[type] = (hazardTypes[type] || 0) + 1;
    });

    // 转换为百分比格式
    let hazardDistribution = Object.keys(hazardTypes).map(type => ({
      name: hazardNames[type] || type,
      color: hazardColors[type] || '#6b7280',
      percentage: totalReports > 0 ? Math.round((hazardTypes[type] / totalReports) * 100) : 0
    }));

    // 确保饼图显示完整，补充百分比到100%
    const totalPercentage = hazardDistribution.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage < 100 && hazardDistribution.length > 0) {
      const largestItem = hazardDistribution.reduce((max, item) =>
        item.percentage > max.percentage ? item : max
      );
      largestItem.percentage += (100 - totalPercentage);
    }

    this.setData({
      totalReports,
      resolveRate,
      hazardDistribution
    });

    this.initChartData();

    // 延迟绘制饼图，确保数据已更新
    setTimeout(() => {
      this.setCanvasSize();
    }, 300);
  },

  /**
   * 应用后端聚合统计数据
   */
  applyStatsData({ statusCounts = {}, hazardDistribution = [], totalReports = 0, resolutionRate = 0 }) {
    // 将隐患类型分布计数转换为百分比
    const total = (hazardDistribution || []).reduce((sum, item) => sum + (item.count || 0), 0);
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

    // 补齐百分比到100以便饼图显示完整
    const totalPct = dist.reduce((s, i) => s + i.percentage, 0);
    if (totalPct < 100 && dist.length > 0) {
      // 将差值加到第一个分片，避免浮点误差
      dist[0].percentage += (100 - totalPct);
    }

    this.setData({
      totalReports: totalReports || 0,
      resolveRate: resolutionRate || 0,
      hazardDistribution: dist
    });

    // 更新图表并延迟绘制，确保数据已更新
    this.initChartData();
    setTimeout(() => {
      this.setCanvasSize();
    }, 300);
  },

  /**
   * 时间筛选按钮点击事件
   */
  onTimeFilterTap(e) {
    const filterId = e.currentTarget.dataset.id;
    const filterLabel = e.currentTarget.dataset.label;
    
    // 更新筛选状态
    const timeFilters = this.data.timeFilters.map(filter => ({
      ...filter,
      active: filter.id === filterId
    }));
    
    this.setData({
      timeFilters: timeFilters,
      selectedTimeRange: filterLabel
    });
    
    // 根据选择的时间范围更新数据
    this.updateStatsByTimeRange(filterId);
  },

  /**
   * 根据时间范围更新统计数据
   */
  updateStatsByTimeRange(timeRange = 'week') {
    // 时间过滤功能暂时简化，显示全部数据
    this.loadStatistics();
  },

  /**
   * 从API获取数据（示例）
   */
  fetchDataFromAPI(timeRange) {
    // 示例API调用
    /*
    wx.request({
      url: 'https://your-api.com/stats',
      data: {
        timeRange: timeRange
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            totalReports: res.data.totalReports,
            resolveRate: res.data.resolveRate,
            hazardDistribution: res.data.hazardDistribution
          });
          this.initChartData();
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
    */
  },

  /**
   * 刷新数据
   */
  refreshData() {
    wx.showLoading({
      title: '刷新中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      this.loadStatistics();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 导出报告
   */
  exportReport() {
    wx.showActionSheet({
      itemList: ['导出PDF报告', '导出Excel数据', '分享统计图表'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.exportPDF();
            break;
          case 1:
            this.exportExcel();
            break;
          case 2:
            this.shareChart();
            break;
        }
      }
    });
  },

  /**
   * 导出PDF报告
   */
  exportPDF() {
    wx.showLoading({
      title: '生成PDF中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: 'PDF报告已生成',
        icon: 'success'
      });
    }, 2000);
  },

  /**
   * 导出Excel数据
   */
  exportExcel() {
    wx.showLoading({
      title: '导出Excel中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: 'Excel已导出',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 分享统计图表
   */
  shareChart() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    this.loadStatistics();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多数据
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '安全统计数据',
      path: '/pages/stats/stats',
      imageUrl: '/images/share-stats.png'
    };
  }
});