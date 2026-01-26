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
    currentSection: null,  // 当前标段
    // 自定义认证弹窗
    showConfirmModal: false,
    selectedUser: null,
    realNameInput: ''
  },

  onLoad() {
    // 获取当前标段
    const currentSection = app.globalData.currentSection
    this.setData({ currentSection })
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

    // 按当前标段过滤
    const sectionCode = this.data.currentSection?.section_code
    const url = sectionCode
      ? `${app.globalData.baseUrl}/verifications/unverified?section=${sectionCode}`
      : `${app.globalData.baseUrl}/verifications/unverified`

    wx.request({
      url: url,
      method: 'GET',
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const users = res.data.data.users || []
          const formattedUsers = users.map(u => ({
            ...u,
            submittedAt: formatBeijing(u.submittedAt)
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

    // 按当前标段过滤
    const sectionCode = this.data.currentSection?.section_code
    const url = sectionCode
      ? `${app.globalData.baseUrl}/verifications/verified?section=${sectionCode}`
      : `${app.globalData.baseUrl}/verifications/verified`

    wx.request({
      url: url,
      method: 'GET',
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const users = res.data.data.users || []
          const formattedUsers = users.map(u => ({
            ...u,
            reviewedAt: formatBeijing(u.reviewedAt)
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
    const { verificationId, userId, nickName, realName, sectionCode, sectionName } = e.currentTarget.dataset

    // 显示自定义弹窗，预填充用户提交的姓名
    this.setData({
      showConfirmModal: true,
      selectedUser: {
        verificationId,
        userId,
        nickName,
        submittedRealName: realName,  // 用户提交的原始姓名
        sectionCode,
        sectionName
      },
      realNameInput: realName || ''  // 预填充用户提交的姓名，管理员可以修改
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

    const { verificationId, userId, sectionCode } = this.data.selectedUser
    this.closeConfirmModal()
    this.submitConfirmation(verificationId, userId, realName, sectionCode)
  },

  submitConfirmation(verificationId, userId, realName, sectionCode) {
    wx.showLoading({ title: '处理中...' })

    // 使用新的 verificationId 参数，同时保持向后兼容
    const requestData = { realName }
    if (verificationId) {
      requestData.verificationId = verificationId
    } else {
      requestData.userId = userId
      requestData.sectionCode = sectionCode
    }

    wx.request({
      url: `${app.globalData.baseUrl}/verifications/confirm`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
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
