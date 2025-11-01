// pages/profile/profile.js
const app = getApp()

Page({
    data: {
        currentUser: null,
        currentSection: '',
        myReportsCount: 0
    },

    onLoad: function (options) {
        this.setData({
            currentUser: app.globalData.currentUser || {
                name: '员工',
                role: 'employee',
                department: '生产车间',
                avatar: '👷',
                phone: '138****1234'
            },
            currentSection: app.globalData.currentSection || 'TJ01'
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
            title: '个人中心'
        })

        this.loadMyReportsCount()
    },

    onShow: function () {
        this.setData({
            currentUser: app.globalData.currentUser,
            currentSection: app.globalData.currentSection
        })
        this.loadMyReportsCount()
    },

    loadMyReportsCount: function () {
        const app = getApp();
        const currentSection = app.globalData.currentSection;

        if (!app.globalData.token || !currentSection) {
            this.setData({
                myReportsCount: 0
            });
            return;
        }

        wx.request({
            url: app.globalData.baseUrl + '/report/list',
            method: 'GET',
            header: {
                'Authorization': 'Bearer ' + app.globalData.token
            },
            data: {
                section: currentSection.section_code
            },
            success: (res) => {
                if (res.data.success) {
                    const reports = res.data.data.reports;
                    const userReports = reports.filter(report =>
                        report.reporter_openid === app.globalData.currentUser.openid
                    );
                    this.setData({
                        myReportsCount: userReports.length
                    });
                } else {
                    console.error('获取举报记录失败:', res.data.message);
                    this.setData({
                        myReportsCount: 0
                    });
                }
            },
            fail: (err) => {
                console.error('获取举报记录请求失败:', err);
                this.setData({
                    myReportsCount: 0
                });
            }
        });
    },

    goBack: function() {
        wx.navigateBack()
    },

    goToMyReports: function() {
        wx.navigateTo({
            url: '/pages/my-reports/my-reports'
        })
    },

    goToStats: function() {
        wx.navigateTo({
            url: '/pages/stats/stats'
        })
    },

    showSafetyKnowledge: function() {
        wx.showModal({
            title: '安全知识',
            content: '消防安全：发现火情立即拨打119，使用灭火器时拔掉保险销，对准火焰根部喷射。\n\n用电安全：禁止私拉乱接电线，发现漏电立即断电。\n\n机械安全：操作设备前检查防护装置，严禁违章操作。',
            showCancel: false,
            confirmText: '我知道了'
        })
    },

    logout: function() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清除用户数据
                    app.globalData.currentUser = null
                    app.globalData.currentSection = null

                    wx.showToast({
                        title: '已退出登录',
                        icon: 'success',
                        duration: 2000
                    })

                    // 返回首页
                    setTimeout(() => {
                        wx.reLaunch({
                            url: '/pages/index/index'
                        })
                    }, 2000)
                }
            }
        })
    }
})