// pages/section/section.js
const app = getApp()

Page({
    data: {
        section: '',
        sectionInfo: null,
        isAdmin: false,
        isSupervisor: false
    },

    onLoad: function (options) {
        const sectionCode = options.section || 'TJ01'
        const sections = app.globalData.sections;
        let sectionInfo = null;

        if (sections?.length > 0) {
            sectionInfo = sections.find(s => s.section_code === sectionCode);
        }

        this.setData({
            section: sectionCode,
            sectionInfo: sectionInfo
        })

        if (sectionInfo) {
            app.globalData.currentSection = sectionInfo;
        }

        wx.setNavigationBarTitle({
            title: sectionInfo ? sectionInfo.section_name : `第${sectionCode}标段`
        })

        this.updateRoleFlags();
    },

    goBack: function () {
        wx.navigateBack()
    },

    fetchUserInfoAndUpdateFlags: function () {
        const currentSection = this.data.section || app.globalData.currentSection?.section_code;

        if (!app.globalData.token) {
            this.setData({ isAdmin: false, hasManagementAccess: false });
            return;
        }

        wx.request({
            url: app.globalData.baseUrl + '/auth/verify',
            method: 'POST',
            data: { token: app.globalData.token },
            success: (res) => {
                if (res.data?.success) {
                    const userInfo = res.data.data.user;
                    app.globalData.currentUser = {
                        ...userInfo,
                        name: userInfo.nickName || userInfo.name,
                        nickName: userInfo.nickName || userInfo.name,
                        department: userInfo.department || '未设置部门',
                        avatar: userInfo.avatarUrl || userInfo.avatar || '👷',
                        avatarUrl: userInfo.avatarUrl || userInfo.avatar || '👷',
                        managed_sections: userInfo.managed_sections,
                        is_supervisor: userInfo.is_supervisor
                    };
                    this.checkManagementAccess(currentSection, userInfo.managed_sections, userInfo.is_supervisor);
                } else {
                    this.setData({ isAdmin: false, hasManagementAccess: false });
                }
            },
            fail: () => {
                this.setData({ isAdmin: false, hasManagementAccess: false });
            }
        });
    },

    checkManagementAccess: function (currentSection, managedSections, isSupervisor) {
        let hasManagementAccess = false;
        const currentSectionCode = (currentSection || '').trim();

        if (managedSections && currentSection) {
            try {
                let parsedSections = Array.isArray(managedSections)
                    ? managedSections
                    : JSON.parse(managedSections || '[]');
                parsedSections = (parsedSections || [])
                    .filter(v => typeof v === 'string')
                    .map(v => v.trim());
                hasManagementAccess = currentSectionCode ? parsedSections.includes(currentSectionCode) : false;
            } catch {
                hasManagementAccess = false;
            }
        }

        this.setData({
            isAdmin: hasManagementAccess,
            isSupervisor: isSupervisor === 1,
            hasManagementAccess: hasManagementAccess
        });
    },

    updateRoleFlags: function () {
        this.fetchUserInfoAndUpdateFlags();
    },

    directToReport: function () {
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        }

        wx.showModal({
            title: '举报须知',
            content: '请确保举报内容真实、准确，提供详细的隐患位置和描述，如有现场照片请一并上传。恶意举报将承担相应责任。',
            confirmText: '我已阅读',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({ url: '/pages/report/report' })
                }
            }
        })
    },

    showSafetyKnowledge: function () {
        wx.navigateTo({ url: '/pages/safety-knowledge/safety-knowledge' })
    },

    handlePersonalCenter: function () {
        if (!app.globalData.currentUser) {
            wx.showToast({ title: '请先授权登录', icon: 'none', duration: 2000 });
            return;
        }

        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        wx.navigateTo({
            url: `/pages/profile/profile?section=${this.data.section}`
        })
    },

    goToAdmin: function () {
        if (!app.globalData.currentUser) {
            wx.showToast({ title: '请先授权登录', icon: 'none', duration: 2000 });
            return;
        }

        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        wx.navigateTo({ url: `/pages/admin/admin?isAdmin=true` });
    },

    goToReportPublic: function () {
        if (!app.globalData.currentUser) {
            wx.showToast({ title: '请先授权登录', icon: 'none', duration: 2000 });
            return;
        }

        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        wx.navigateTo({ url: `/pages/admin/admin?isAdmin=false` });
    },

    onShow: function () {
        this.updateRoleFlags();
    }
})