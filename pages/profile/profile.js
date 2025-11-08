// pages/profile/profile.js
const app = getApp()

Page({
    data: {
        currentUser: null,
        currentSection: '',
        myReportsCount: 0,
        isLoadingMyReports: false
    },

    onLoad: function (options) {
        console.log('个人中心页面加载，当前用户信息:', app.globalData.currentUser);
        console.log('微信用户信息:', app.globalData.userInfo);

        // 合并用户信息，优先使用currentUser，fallback到userInfo
        const currentUser = app.globalData.currentUser;
        const wechatUserInfo = app.globalData.userInfo;

        const mergedUser = {
            name: currentUser?.name || currentUser?.nickName || wechatUserInfo?.nickName || '微信用户',
            role: currentUser?.role || 'employee',
            department: currentUser?.department || '未设置部门',
            avatar: currentUser?.avatar || currentUser?.avatarUrl || wechatUserInfo?.avatarUrl || '👷',
            phone: currentUser?.phone || '138****1234'
        };

        console.log('合并后的用户信息:', mergedUser);

        this.setData({
            currentUser: mergedUser,
            currentSection: app.globalData.currentSection || 'TJ01'
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
            title: '个人中心'
        })

        this.loadMyReportsCount()
    },

    onShow: function () {
        console.log('个人中心页面显示，当前用户信息:', app.globalData.currentUser);
        console.log('微信用户信息:', app.globalData.userInfo);

        // 合并用户信息，优先使用currentUser，fallback到userInfo
        const currentUser = app.globalData.currentUser;
        const wechatUserInfo = app.globalData.userInfo;

        const mergedUser = {
            // 使用登录后的用户信息，如果不存在则使用微信用户信息
            name: currentUser?.name || currentUser?.nickName || wechatUserInfo?.nickName || '微信用户',
            role: currentUser?.role || 'employee',
            department: currentUser?.department || '未设置部门',
            avatar: currentUser?.avatar || currentUser?.avatarUrl || wechatUserInfo?.avatarUrl || '👷',
            phone: currentUser?.phone || '138****1234'
        };

        console.log('合并后的用户信息:', mergedUser);

        this.setData({
            currentUser: mergedUser,
            currentSection: app.globalData.currentSection || 'TJ01'
        })

        // 如果还没有登录用户信息，延迟检查一下（等待token验证完成）
        if (!currentUser) {
            console.log('登录用户信息还未加载，延迟检查...');
            setTimeout(() => {
                console.log('延迟检查后的登录用户信息:', app.globalData.currentUser);
                console.log('延迟检查后的微信用户信息:', app.globalData.userInfo);

                const updatedCurrentUser = app.globalData.currentUser;
                const updatedWechatUser = app.globalData.userInfo;

                // 重新构建用户信息
                const updatedUser = {
                    name: updatedCurrentUser?.name || updatedCurrentUser?.nickName || updatedWechatUser?.nickName || '微信用户',
                    role: updatedCurrentUser?.role || 'employee',
                    department: updatedCurrentUser?.department || '未设置部门',
                    avatar: updatedCurrentUser?.avatar || updatedCurrentUser?.avatarUrl || updatedWechatUser?.avatarUrl || '👷',
                    phone: updatedCurrentUser?.phone || '138****1234'
                };

                console.log('延迟重新构建的用户信息:', updatedUser);

                this.setData({
                    currentUser: updatedUser
                });
            }, 1000);
        }

        this.loadMyReportsCount()
    },

    loadMyReportsCount: function () {
        const app = getApp();
        const currentSection = app.globalData.currentSection;
        const currentUser = app.globalData.currentUser;

        console.log('=== 个人中心加载举报数量 ===');
        console.log('当前用户信息:', currentUser);
        console.log('当前用户ID:', currentUser?.id);
        console.log('当前用户角色:', currentUser?.role);
        console.log('当前标段:', currentSection);
        console.log('Token存在:', !!app.globalData.token);

        if (!app.globalData.token || !currentSection) {
            this.setData({
                myReportsCount: 0,
                isLoadingMyReports: false
            });
            return;
        }

        this.setData({ isLoadingMyReports: true });
        wx.showNavigationBarLoading();

        const requestData = {
            section: currentSection.section_code
        };

        console.log('请求参数:', requestData);

        wx.request({
            url: app.globalData.baseUrl + '/report/personal-reports',
            method: 'GET',
            header: {
                'Authorization': 'Bearer ' + app.globalData.token
            },
            data: requestData,
            success: (res) => {
                console.log('=== 举报数量查询响应 ===');
                console.log('响应状态:', res.statusCode);
                console.log('响应数据:', res.data);

                if (res.data.success) {
                    const total = res.data.data.pagination?.total || (res.data.data.reports?.length || 0);
                    const reports = res.data.data.reports || [];

                    console.log('举报总数:', total);
                    console.log('举报列表:', reports);

                    this.setData({
                        myReportsCount: total
                    });
                } else {
                    console.error('获取举报记录失败:', res.data.message);
                    console.error('错误详情:', res.data);
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
            },
            complete: () => {
                this.setData({ isLoadingMyReports: false });
                wx.hideNavigationBarLoading();
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