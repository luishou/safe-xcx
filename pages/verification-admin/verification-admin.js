// pages/verification-admin/verification-admin.js
const app = getApp()
const { formatBeijing } = require('../../utils/time.js')

Page({
  data: {
    selectedTab: 'unverified',
    tabs: [
      { key: 'unverified', label: '待认证' },
      { key: 'verified', label: '已认证' }
    ],
    unverifiedUsers: [],
    verifiedUsers: [],
    isLoading: false,
    currentTabLabel: '待认证',
    // 自定义认证弹窗
    showConfirmModal: false,
    selectedUser: null,
    realNameInput: ''
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    const currentTab = this.data.tabs.find(t => t.key === tab)
    this.setData({
      selectedTab: tab,
      currentTabLabel: currentTab ? currentTab.label : '待认证'
    })
    this.loadData()
  },

  loadData() {
    if (this.data.selectedTab === 'unverified') {
      this.loadUnverifiedUsers()
    } else {
      this.loadVerifiedUsers()
    }
  },

  loadUnverifiedUsers() {
    this.setData({ isLoading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/verifications/unverified`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const users = res.data.data.users || []
          const formattedUsers = users.map(u => ({
            ...u,
            createdAt: formatBeijing(u.createdAt)
          }))
          this.setData({ unverifiedUsers: formattedUsers })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => this.setData({ isLoading: false })
    })
  },

  loadVerifiedUsers() {
    this.setData({ isLoading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/verifications/verified`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const users = res.data.data.users || []
          const formattedUsers = users.map(u => ({
            ...u,
            createdAt: formatBeijing(u.createdAt)
          }))
          this.setData({ verifiedUsers: formattedUsers })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => this.setData({ isLoading: false })
    })
  },

  confirmVerification(e) {
    const userId = e.currentTarget.dataset.id
    const user = this.data.unverifiedUsers.find(u => u.id === userId)

    if (!user) {
      wx.showToast({ title: '用户不存在', icon: 'none' })
      return
    }

    // 显示自定义弹窗
    this.setData({
      showConfirmModal: true,
      selectedUser: user,
      realNameInput: ''
    })
  },

  // 关闭认证弹窗
  closeConfirmModal() {
    this.setData({
      showConfirmModal: false,
      selectedUser: null,
      realNameInput: ''
    })
  },

  // 输入真实姓名
  onRealNameInput(e) {
    this.setData({
      realNameInput: e.detail.value
    })
  },

  // 提交认证
  submitConfirmModal() {
    const realName = this.data.realNameInput.trim()

    if (!realName) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }

    // 验证姓名格式（2-10个中文字符）
    if (!/^[\u4e00-\u9fa5]{2,10}$/.test(realName)) {
      wx.showToast({ title: '请输入2-10个中文字符', icon: 'none' })
      return
    }

    const userId = this.data.selectedUser.id
    this.closeConfirmModal()
    this.submitConfirmation(userId, realName)
  },

  submitConfirmation(userId, realName) {
    wx.showLoading({ title: '处理中...' })

    wx.request({
      url: `${app.globalData.baseUrl}/verifications/confirm`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: { userId, realName },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({ title: '认证成功', icon: 'success' })
          // 刷新列表
          this.loadData()
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => wx.hideLoading()
    })
  },

  onPullDownRefresh() {
    this.loadData()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },

  goBack() {
    wx.navigateBack()
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
})
