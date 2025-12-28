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
    verificationStatus: 'none', // none, pending, approved, rejected
    verificationInfo: null,
    isLoading: false,
    isSubmitting: false
  },

  onLoad: function (options) {
    console.log('认证页面加载');
    this.loadSections();
    this.loadVerificationStatus();
  },

  onShow: function () {
    // 每次显示页面时重新加载认证状态
    this.loadVerificationStatus();
  },

  // 加载标段列表
  loadSections: function () {
    wx.request({
      url: app.globalData.baseUrl + '/section/list',
      method: 'GET',
      success: (res) => {
        if (res.data.success && res.data.data) {
          const sections = res.data.data;
          // 默认选择第一个标段
          if (sections.length > 0) {
            this.setData({
              sections: sections,
              sectionId: sections[0].id,
              sectionName: sections[0].section_name
            });
          }
        }
      },
      fail: (err) => {
        console.error('加载标段列表失败:', err);
        wx.showToast({
          title: '加载标段失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载认证状态
  loadVerificationStatus: function () {
    if (!app.globalData.token) {
      return;
    }

    this.setData({ isLoading: true });

    wx.request({
      url: app.globalData.baseUrl + '/verifications/my',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        if (res.data.success) {
          const data = res.data.data;
          console.log('认证状态:', data);

          // 格式化时间字段
          const verificationInfo = data.verification ? {
            ...data.verification,
            createdAt: formatBeijing(data.verification.createdAt),
            reviewedAt: formatBeijing(data.verification.reviewedAt)
          } : null;

          this.setData({
            verificationStatus: data.status,
            verificationInfo: verificationInfo,
            isVerified: data.isVerified
          });

          // 如果已认证，更新全局状态
          if (data.isVerified) {
            app.globalData.isVerified = true;
          }
        }
      },
      fail: (err) => {
        console.error('加载认证状态失败:', err);
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 输入姓名
  onNameInput: function (e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 输入身份证号
  onIdCardInput: function (e) {
    this.setData({
      idCard: e.detail.value
    });
  },

  // 输入手机号
  onPhoneInput: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 选择标段
  onSectionChange: function (e) {
    const index = e.detail.value;
    this.setData({
      sectionId: this.data.sections[index].id,
      sectionName: this.data.sections[index].section_name
    });
  },

  // 提交认证申请
  submitVerification: function () {
    const { name, idCard, phone, sectionId } = this.data;

    // 验证必填字段
    if (!name || !idCard || !phone || !sectionId) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 验证身份证号格式
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!idCardRegex.test(idCard)) {
      wx.showToast({
        title: '身份证号格式不正确',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSubmitting: true });

    wx.request({
      url: app.globalData.baseUrl + '/verifications',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        name: name,
        idCard: idCard,
        phone: phone,
        sectionId: sectionId
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          });
          // 重新加载认证状态
          this.loadVerificationStatus();
          // 清空表单
          this.setData({
            name: '',
            idCard: '',
            phone: ''
          });
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交认证申请失败:', err);
        wx.showToast({
          title: '提交失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isSubmitting: false });
      }
    });
  },

  // 重新申请
  reapply: function () {
    this.setData({
      verificationStatus: 'none',
      verificationInfo: null
    });
  }
});