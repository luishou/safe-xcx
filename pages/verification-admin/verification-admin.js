// pages/verification-admin/verification-admin.js
const app = getApp()
const { formatBeijing } = require('../../utils/time.js')

Page({
  data: {
    verifications: [],
    isLoading: false,
    selectedTab: 'pending', // pending, approved, rejected
    tabs: [
      { key: 'pending', label: '待审核' },
      { key: 'approved', label: '已通过' },
      { key: 'rejected', label: '已拒绝' }
    ],
    currentTabLabel: '待审核' // 当前选中标签的文本
  },

  onLoad() {
    this.loadVerifications()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadVerifications()
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    const tabs = this.data.tabs
    const currentTab = tabs.find(t => t.key === tab)

    this.setData({
      selectedTab: tab,
      currentTabLabel: currentTab ? currentTab.label : '待审核'
    })
    this.loadVerifications()
  },

  // 加载认证申请列表
  loadVerifications() {
    this.setData({ isLoading: true })

    const app = getApp()
    const currentSection = app.globalData.currentSection

    console.log('当前标段:', currentSection)

    // 构建请求参数
    const params = {
      status: this.data.selectedTab  // 添加状态参数
    }
    if (currentSection && currentSection.id) {
      params.sectionId = currentSection.id
    }

    console.log('请求参数:', params)

    wx.request({
      url: `${app.globalData.baseUrl}/verifications`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const allVerifications = res.data.data.verifications || []
          // 格式化时间字段
          const formattedVerifications = allVerifications.map(v => ({
            ...v,
            createdAt: formatBeijing(v.createdAt),
            reviewedAt: formatBeijing(v.reviewedAt)
          }))
          // 根据当前标签页过滤数据
          const filteredVerifications = formattedVerifications.filter(v => {
            if (this.data.selectedTab === 'pending') {
              return v.status === 'pending'
            } else if (this.data.selectedTab === 'approved') {
              return v.status === 'approved'
            } else if (this.data.selectedTab === 'rejected') {
              return v.status === 'rejected'
            }
            return true
          })

          this.setData({
            verifications: filteredVerifications
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('加载认证列表失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ isLoading: false })
      }
    })
  },

  // 通过认证 - 显示确认对话框
  approveVerification(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认通过',
      content: '确认通过该认证申请吗？',
      success: (res) => {
        if (res.confirm) {
          this.submitReview(id, 'approve', '')
        }
      }
    })
  },

  // 拒绝认证
  rejectVerification(e) {
    const id = e.currentTarget.dataset.id
    this.showReviewDialog(id, 'reject')
  },

  // 显示审核对话框
  showReviewDialog(id, action) {
    const actionText = action === 'approve' ? '通过' : '拒绝'
    wx.showModal({
      title: `${actionText}认证`,
      content: `确认${actionText}该认证申请吗？`,
      success: (res) => {
        if (res.confirm) {
          if (action === 'reject') {
            // 拒绝时需要输入拒绝原因
            wx.showModal({
              title: '拒绝原因',
              editable: true,
              placeholderText: '请输入拒绝原因（选填）',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.submitReview(id, action, modalRes.content || '')
                }
              }
            })
          } else {
            // 通过直接提交
            this.submitReview(id, action, '')
          }
        }
      }
    })
  },

  // 提交审核结果
  submitReview(id, action, comment) {
    wx.showLoading({ title: '处理中...' })

    const url = action === 'approve'
      ? `${app.globalData.baseUrl}/verifications/${id}/approve`
      : `${app.globalData.baseUrl}/verifications/${id}/reject`

    wx.request({
      url: url,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: { comment },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: action === 'approve' ? '已通过' : '已拒绝',
            icon: 'success'
          })
          // 刷新列表
          this.loadVerifications()
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('审核失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 查看详情
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

    wx.showModal({
      title: '认证详情',
      content: detailText,
      showCancel: false,
      confirmText: '关闭'
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝'
    }
    return statusMap[status] || status
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadVerifications()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})







