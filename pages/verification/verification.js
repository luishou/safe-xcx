// pages/verification/verification.js
const app = getApp()
const { formatBeijing } = require('../../utils/time.js')

Page({
  data: {
    name: '',
    idCard: '',
    phone: '',
    sectionId: '',
    sectionName: '',
    sections: [],
    verificationStatus: 'none',
    verificationInfo: null,
    isLoading: false,
    isSubmitting: false
  },

  onLoad: function (options) {
    this.loadSections();
    this.loadVerificationStatus();
  },

  onShow: function () {
    this.loadVerificationStatus();
  },

  loadSections: function () {
    wx.request({
      url: app.globalData.baseUrl + '/section/list',
      method: 'GET',
      success: (res) => {
        if (res.data.success && res.data.data) {
          const sections = res.data.data;
          if (sections.length > 0) {
            this.setData({
              sections,
              sectionId: sections[0].id,
              sectionName: sections[0].section_name
            });
          }
        }
      },
      fail: () => wx.showToast({ title: '加载标段失败', icon: 'none' })
    });
  },

  loadVerificationStatus: function () {
    if (!app.globalData.token) return;

    this.setData({ isLoading: true });

    wx.request({
      url: app.globalData.baseUrl + '/verifications/my',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      success: (res) => {
        if (res.data.success) {
          const data = res.data.data;
          const verificationInfo = data.verification ? {
            ...data.verification,
            createdAt: formatBeijing(data.verification.createdAt),
            reviewedAt: formatBeijing(data.verification.reviewedAt)
          } : null;

          this.setData({
            verificationStatus: data.status,
            verificationInfo,
            isVerified: data.isVerified
          });

          if (data.isVerified) app.globalData.isVerified = true;
        }
      },
      complete: () => this.setData({ isLoading: false })
    });
  },

  onNameInput: function (e) { this.setData({ name: e.detail.value }); },
  onIdCardInput: function (e) { this.setData({ idCard: e.detail.value }); },
  onPhoneInput: function (e) { this.setData({ phone: e.detail.value }); },

  onSectionChange: function (e) {
    const index = e.detail.value;
    this.setData({
      sectionId: this.data.sections[index].id,
      sectionName: this.data.sections[index].section_name
    });
  },

  submitVerification: function () {
    const { name, idCard, phone, sectionId } = this.data;

    if (!name || !idCard || !phone || !sectionId) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!idCardRegex.test(idCard)) {
      wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    wx.request({
      url: app.globalData.baseUrl + '/verifications',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: { name, idCard, phone, sectionId },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '提交成功', icon: 'success' });
          this.loadVerificationStatus();
          this.setData({ name: '', idCard: '', phone: '' });
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '提交失败', icon: 'none' }),
      complete: () => this.setData({ isSubmitting: false })
    });
  },

  reapply: function () {
    this.setData({ verificationStatus: 'none', verificationInfo: null });
  }
});