// pages/verification/verification.js
const app = getApp()
const { formatBeijing } = require('../../utils/time.js')

Page({
  data: {
    sections: [],
    sectionIndex: 0,
    currentSection: null,
    sectionLocked: false, // 标段是否锁定不可修改
    verifications: [],
    currentVerification: { status: 'none' },
    realName: '',
    isLoading: false,
    isSubmitting: false
  },

  onLoad: function (options) {
    // 如果从其他页面传入了 sectionCode，记录下来并锁定标段
    if (options.sectionCode) {
      this.targetSectionCode = options.sectionCode;
      this.setData({ sectionLocked: true });
    }
    this.loadSections();
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
            // 如果有目标标段，选中它
            let targetIndex = 0;
            if (this.targetSectionCode) {
              const idx = sections.findIndex(s => s.section_code === this.targetSectionCode);
              if (idx >= 0) targetIndex = idx;
            }

            this.setData({
              sections,
              sectionIndex: targetIndex,
              currentSection: sections[targetIndex]
            });

            // 加载认证状态
            this.loadVerificationStatus();
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
          const verifications = (data.verifications || []).map(v => ({
            ...v,
            submittedAt: formatBeijing(v.submittedAt),
            reviewedAt: formatBeijing(v.reviewedAt)
          }));

          this.setData({ verifications });

          // 更新当前标段的认证状态
          this.updateCurrentVerification();
        }
      },
      complete: () => this.setData({ isLoading: false })
    });
  },

  updateCurrentVerification: function () {
    const { currentSection, verifications } = this.data;
    if (!currentSection) return;

    const sectionCode = currentSection.section_code;
    const verification = verifications.find(v => v.sectionCode === sectionCode);

    this.setData({
      currentVerification: verification || { status: 'none' },
      // 如果有之前提交的姓名，预填充
      realName: verification && verification.realName ? verification.realName : ''
    });
  },

  onSectionChange: function (e) {
    const index = parseInt(e.detail.value);
    const section = this.data.sections[index];

    this.setData({
      sectionIndex: index,
      currentSection: section
    });

    this.updateCurrentVerification();
  },

  selectSection: function (e) {
    const sectionCode = e.currentTarget.dataset.sectionCode;
    const index = this.data.sections.findIndex(s => s.section_code === sectionCode);
    if (index >= 0) {
      this.setData({
        sectionIndex: index,
        currentSection: this.data.sections[index]
      });
      this.updateCurrentVerification();
    }
  },

  onRealNameInput: function (e) {
    this.setData({
      realName: e.detail.value
    });
  },

  submitVerification: function () {
    const { currentSection, realName } = this.data;

    if (!currentSection) {
      wx.showToast({ title: '请选择标段', icon: 'none' });
      return;
    }

    if (!realName || !realName.trim()) {
      wx.showToast({ title: '请填写真实姓名', icon: 'none' });
      return;
    }

    // 验证姓名格式（2-10个中文字符）
    if (!/^[\u4e00-\u9fa5]{2,10}$/.test(realName.trim())) {
      wx.showToast({ title: '请输入2-10个中文字符', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    wx.request({
      url: app.globalData.baseUrl + '/verifications/submit',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token,
        'Content-Type': 'application/json'
      },
      data: {
        sectionCode: currentSection.section_code,
        realName: realName.trim()
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '提交成功', icon: 'success' });
          this.loadVerificationStatus();
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '提交失败', icon: 'none' }),
      complete: () => this.setData({ isSubmitting: false })
    });
  }
});