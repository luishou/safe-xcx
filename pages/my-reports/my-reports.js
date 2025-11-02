// pages/my-reports/my-reports.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    currentSection: 'TJ01',

    // 举报数据 - 参考图片中的三种状态
    reports: [
      {
        id: 1,
        hazardType: '消防安全隐患',
        location: 'A区仓库',
        description: '发现灭火器过期，需要及时更换',
        reportTime: '2024-01-10 09:30',
        status: 'processing',
        statusText: '处理中',
        statusClass: 'status-processing'
      },
      {
        id: 2,
        hazardType: '高空作业安全隐患',
        location: 'B区施工现场',
        description: '脚手架防护网破损，存在坠物风险',
        reportTime: '2024-01-08 14:20',
        status: 'completed',
        statusText: '已办结',
        statusClass: 'status-completed'
      },
      {
        id: 3,
        hazardType: '电气安全隐患',
        location: 'C区配电房',
        description: '临时用电线路私拉乱接，存在安全隐患',
        reportTime: '2024-01-05 16:45',
        status: 'evaluated',
        statusText: '已评价',
        statusClass: 'status-evaluated'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;

    // 如果用户未授权，显示默认用户ID信息但不设置用户角色
    if (!currentUser) {
      this.setData({
        displayUserId: 'default_user',
        userRole: 'guest',
        canOperate: false
      });
      return;
    }

    const currentSection = app.globalData.currentSection || 'TJ01';

    this.setData({
      currentUser: currentUser,
      currentSection: currentSection
    });
  },

  goBack: function() {
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
      url: `/pages/detail/detail?id=${id}`
    });
  }
})