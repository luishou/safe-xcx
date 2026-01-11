// pages/verification-admin/verification-admin.js
const app = getApp()
const { formatBeijing } = require('../../utils/time.js')

Page({
  data: {
    verifications: [],
    isLoading: false,
    selectedTab: 'pending',
    tabs: [
      { key: 'pending', label: '待审核' },
      { key: 'approved', label: '已通过' },
      { key: 'rejected', label: '已拒绝' }
    ],
    currentTabLabel: '待审核'
  },

  onLoad() { this.loadVerifications() },
  onShow() { this.loadVerifications() },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    const currentTab = this.data.tabs.find(t => t.key === tab)
    this.setData({
      selectedTab: tab,
      currentTabLabel: currentTab ? currentTab.label : '待审核'
    })
    this.loadVerifications()
  },

  loadVerifications() {
    this.setData({ isLoading: true })
    const currentSection = app.globalData.currentSection

    const params = { status: this.data.selectedTab }
    if (currentSection?.id) params.sectionId = currentSection.id

    wx.request({
      url: `${app.globalData.baseUrl}/verifications`,
      method: 'GET',
      data: params,
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.statusCode === 200) {
          const allVerifications = res.data.data.verifications || []
          const formattedVerifications = allVerifications.map(v => ({
            ...v,
            createdAt: formatBeijing(v.createdAt),
            reviewedAt: formatBeijing(v.reviewedAt)
          }))
          const filteredVerifications = formattedVerifications.filter(v => v.status === this.data.selectedTab)
          this.setData({ verifications: filteredVerifications })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => this.setData({ isLoading: false })
    })
  },

  approveVerification(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '确认通过该认证申请吗？',
      success: (res) => { if (res.confirm) this.submitReview(id, 'approve', '') }
    })
  },

  rejectVerification(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '拒绝认证',
      content: '确认拒绝该认证申请吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '拒绝原因',
            editable: true,
            placeholderText: '请输入拒绝原因（选填）',
            success: (modalRes) => {
              if (modalRes.confirm) this.submitReview(id, 'reject', modalRes.content || '')
            }
          })
        }
      }
    })
  },

  submitReview(id, action, comment) {
    wx.showLoading({ title: '处理中...' })
    const url = action === 'approve'
      ? `${app.globalData.baseUrl}/verifications/${id}/approve`
      : `${app.globalData.baseUrl}/verifications/${id}/reject`

    wx.request({
      url,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}`, 'Content-Type': 'application/json' },
      data: { comment },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: action === 'approve' ? '已通过' : '已拒绝', icon: 'success' })
          this.loadVerifications()
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
      complete: () => wx.hideLoading()
    })
  },

  viewDetail(e) {
    const verification = e.currentTarget.dataset.item
    const detailText = `
姓名：${verification.name}
身份证号：${verification.idCard}
手机号：${verification.phone}
所属标段：${verification.sectionName || '未选择'}
申请时间：${verification.createdAt}
状态：${this.getStatusText(verification.status)}
${verification.reviewComment ? '审核意见：' + verification.reviewComment : ''}
    `.trim()

    wx.showModal({ title: '认证详情', content: detailText, showCancel: false, confirmText: '关闭' })
  },

  getStatusText(status) {
    const statusMap = { 'pending': '待审核', 'approved': '已通过', 'rejected': '已拒绝' }
    return statusMap[status] || status
  },

  onPullDownRefresh() {
    this.loadVerifications()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  }
})
