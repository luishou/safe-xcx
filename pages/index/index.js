// pages/index/index.js
Page({
    data: {
        currentSection: null,
        isAuthorized: false,
        userInfo: {},
        sections: [] // 标段列表
    },

    onLoad: function (options) {
        // 页面加载时检查授权状态
        this.checkAuthorization();
    },

    onShow: function () {
        // 页面显示时再次检查授权状态
        this.checkAuthorization();
        // 加载标段配置
        this.loadSections();
    },

    // 加载标段配置
    loadSections: function() {
        const app = getApp();
        const sections = app.globalData.sections;

        console.log('页面loadSections - 全局标段数据:', sections);
        console.log('页面loadSections - 标段数量:', sections ? sections.length : 0);

        if (sections && sections.length > 0) {
            this.setData({
                sections: sections
            });
            console.log('页面加载标段配置成功:', sections);
        } else {
            console.log('标段配置尚未加载完成，尝试延迟加载');
            // 延迟500ms再次尝试
            setTimeout(() => {
                const retrySections = app.globalData.sections;
                console.log('延迟重试 - 标段数据:', retrySections);
                if (retrySections && retrySections.length > 0) {
                    this.setData({
                        sections: retrySections
                    });
                    console.log('延迟加载标段配置成功:', retrySections);
                }
            }, 500);
        }
    },

    // 检查授权状态
    checkAuthorization: function() {
        const app = getApp();
        const userInfo = app.globalData.userInfo;
        const token = app.globalData.token;

        if (userInfo && token && (userInfo.nickName || userInfo.userInfo)) {
            // 已授权且有token，显示用户信息
            console.log('检查授权状态 - 用户信息:', userInfo);
            console.log('检查授权状态 - token存在:', !!token);
            this.setData({
                isAuthorized: true,
                userInfo: userInfo
            });
        } else {
            // 未授权，显示授权按钮
            console.log('检查授权状态 - 未授权');
            console.log('检查授权状态 - 用户信息存在:', !!userInfo);
            console.log('检查授权状态 - token存在:', !!token);
            this.setData({
                isAuthorized: false,
                userInfo: {}
            });
        }
    },

    // 获取用户信息授权
    onGetUserInfo: function(e) {
        // 兼容旧的调用方式，但现在改为调用 getUserProfile
        this.getUserProfile();
    },

    // 记录授权日志
    logAuthorization: function(type, userInfo) {
        const logData = {
            type: type,
            timestamp: new Date().toISOString(),
            userInfo: type === 'success' ? {
                nickName: userInfo.nickName,
                gender: userInfo.gender,
                avatarUrl: userInfo.avatarUrl
            } : null
        };

        // 这里可以上传到服务器记录授权日志
        console.log('授权日志:', logData);
    },

    // 检查授权后选择标段
    selectSection: function(e) {
        const section = e.currentTarget.dataset.section;
        const sectionInfo = e.currentTarget.dataset.sectionInfo;
        const app = getApp();

        // 检查是否已授权且有token
        if (!this.data.isAuthorized || !app.globalData.token) {
            wx.showToast({
                title: '请先授权个人信息',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 保存当前选择的标段信息到全局数据
        app.globalData.currentSection = sectionInfo;

        this.setData({
            currentSection: section
        });

        console.log('选择标段:', section, '标段信息:', sectionInfo, '当前用户:', app.globalData.currentUser);

        // 跳转到标段选择页面
        wx.navigateTo({
            url: `/pages/section/section?section=${section}`
        });
    },

    // 手动重新授权
    reAuthorize: function() {
        wx.openSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    // 用户重新授权了，尝试获取用户信息
                    this.getUserProfile();
                } else {
                    wx.showToast({
                        title: '需要授权才能使用',
                        icon: 'none'
                    });
                }
            }
        });
    },

    // 获取用户信息（主要授权方法）
    getUserProfile: function() {
        console.log('开始获取用户信息');
        const app = getApp();

        // 直接获取用户信息授权（必须由用户直接点击触发）
        wx.getUserProfile({
            desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
            success: (profileRes) => {
                console.log('用户授权成功:', profileRes);
                const userInfo = profileRes.userInfo;

                // 用户授权成功后，获取微信登录code
                wx.login({
                    success: (loginRes) => {
                        if (loginRes.code) {
                            console.log('获取微信登录code成功:', loginRes.code);
                            // 调用后端登录接口
                            this.wechatLogin(loginRes.code, userInfo);
                        } else {
                            console.error('获取微信登录code失败:', loginRes);
                            wx.showToast({
                                title: '登录失败，请重试',
                                icon: 'none'
                            });
                        }
                    },
                    fail: (err) => {
                        console.error('wx.login失败:', err);
                        wx.showToast({
                            title: '登录失败，请重试',
                            icon: 'none'
                        });
                    }
                });
            },
            fail: (err) => {
                console.error('用户拒绝授权或授权失败:', err);
                wx.showToast({
                    title: '需要授权才能使用完整功能',
                    icon: 'none',
                    duration: 2000
                });

                // 记录授权日志
                this.logAuthorization('reject', {});
            }
        });
    },

    // 调用后端登录接口
    wechatLogin: function(code, userInfo) {
        const app = getApp();

        console.log('准备发送到后端的数据:', {
            code: code,
            userInfo: userInfo
        });

        wx.showLoading({
            title: '登录中...'
        });

        wx.request({
            url: app.globalData.baseUrl + '/auth/login',
            method: 'POST',
            data: {
                code: code,
                userInfo: userInfo
            },
            success: (res) => {
                wx.hideLoading();
                console.log('后端登录响应:', res);

                if (res.data.success) {
                    // 保存到全局数据
                    app.globalData.userInfo = userInfo;
                    app.globalData.currentUser = res.data.data.user;
                    app.globalData.token = res.data.data.token;

                    // 保存到本地存储
                    wx.setStorageSync('userInfo', userInfo);
                    wx.setStorageSync('token', res.data.data.token);

                    // 更新页面状态
                    this.setData({
                        isAuthorized: true,
                        userInfo: userInfo
                    });

                    console.log('页面数据更新完成:', {
                        isAuthorized: true,
                        userInfo: userInfo
                    });

                    wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 2000
                    });

                    // 记录授权日志
                    this.logAuthorization('success', userInfo);
                } else {
                    console.error('后端登录失败:', res.data);

                    let errorMessage = res.data.message || '登录失败';
                    if (res.data.details) {
                        console.log('详细错误信息:', res.data.details);
                        // 如果是配置问题，显示更友好的提示
                        if (res.data.details.errcode === 40013) {
                            errorMessage = 'AppID配置错误，请检查小程序配置';
                        } else if (res.data.details.errcode === 40125) {
                            errorMessage = 'AppSecret配置错误，请检查后端配置';
                        }
                    }

                    wx.showToast({
                        title: errorMessage,
                        icon: 'none',
                        duration: 3000
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('登录请求失败:', err);
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    onReady: function () {
        // 页面渲染完成
    },

    onHide: function () {
        // 页面隐藏
    },

    onUnload: function () {
        // 页面卸载
    }
})