// pages/index/index.js
Page({
    data: {
        currentSection: null,
        isAuthorized: false,
        isVerified: false,
        userInfo: {},
        sections: [],
        showNicknameModal: false,
        tempNickname: '',
        tempAvatarUrl: '/images/user.png',
        authRetryCount: 0,
        showAuthPrompt: true  // 控制是否显示授权提示卡片
    },

    onLoad: function (options) {
        // 检查授权状态，但不强制显示授权提示
        this.checkAuthorization();
        // 检查用户是否之前选择过跳过授权
        const skipAuth = wx.getStorageSync('skipAuth');
        if (skipAuth) {
            this.setData({ showAuthPrompt: false });
        }
    },

    onShow: function () {
        const app = getApp();

        // 如果有token，实时获取最新的用户信息以确保认证状态最新
        if (app.globalData.token) {
            wx.request({
                url: app.globalData.baseUrl + '/auth/verify',
                method: 'POST',
                data: { token: app.globalData.token },
                success: (res) => {
                    if (res.data?.success) {
                        const user = res.data.data.user;
                        app.globalData.currentUser = this._formatUserInfo(user);
                        app.globalData.isVerified = user.is_verified === 1 || user.is_verified === true;
                    }
                }
            });
        }

        this.checkAuthorization();
        this.loadSections();
    },

    // 格式化用户信息的通用方法
    _formatUserInfo: function (user) {
        return {
            ...user,
            name: user.nickName || user.name,
            nickName: user.nickName || user.name,
            department: user.department || '未设置部门',
            avatar: user.avatarUrl || user.avatar || '👷',
            avatarUrl: user.avatarUrl || user.avatar || '👷',
            sectionRoles: user.sectionRoles || [],
            managedSections: user.managedSections || [],
            verifications: user.verifications || [],
            role: user.role
        };
    },

    // 格式化标段数据
    _formatSections: function (sections) {
        return sections.map(section => ({
            code: section.section_code,
            name: section.section_name,
            info: section
        }));
    },

    // 加载标段配置
    loadSections: function () {
        const app = getApp();
        const sections = app.globalData.sections;

        if (sections?.length > 0) {
            this.setData({ sections: this._formatSections(sections) });
        } else {
            // 延迟500ms再次尝试
            setTimeout(() => {
                const retrySections = app.globalData.sections;
                if (retrySections?.length > 0) {
                    this.setData({ sections: this._formatSections(retrySections) });
                } else {
                    // 使用默认标段配置
                    this.setData({
                        sections: [
                            { code: 'TJ01', name: '第TJ01标段', info: { section_code: 'TJ01', section_name: '第TJ01标段' } },
                            { code: 'TJ02', name: '第TJ02标段', info: { section_code: 'TJ02', section_name: '第TJ02标段' } }
                        ]
                    });
                }
            }, 500);
        }
    },

    // 检查授权状态
    checkAuthorization: function () {
        const app = getApp();
        const { userInfo, token, currentUser } = {
            userInfo: app.globalData.userInfo,
            token: app.globalData.token,
            currentUser: app.globalData.currentUser
        };

        if (userInfo && token && (userInfo.nickName || userInfo.userInfo)) {
            // 如果 is_verified 未就绪，延迟重试
            if (currentUser?.is_verified === undefined) {
                const retryCount = this.data.authRetryCount || 0;
                if (retryCount < 3) {
                    this.setData({ authRetryCount: retryCount + 1 });
                    setTimeout(() => this.checkAuthorization(), 500);
                    return;
                }
            }

            const isVerified = currentUser && (currentUser.is_verified === 1 || currentUser.is_verified === true);
            this.setData({
                isAuthorized: true,
                isVerified: isVerified,
                userInfo: userInfo,
                authRetryCount: 0
            });
        } else {
            this.setData({
                isAuthorized: false,
                isVerified: false,
                userInfo: {}
            });
        }
    },

    // 记录授权日志
    logAuthorization: function (type, userInfo) {
        // 可在此处上传到服务器记录授权日志
    },

    // 获取用户管理的标段列表（使用新的权限系统）
    _getManagedSections: function (user) {
        if (!user) return [];
        // 优先使用新的 managedSections
        if (user.managedSections && Array.isArray(user.managedSections)) {
            return user.managedSections;
        }
        // 从 sectionRoles 中提取 section_admin 角色的标段
        if (user.sectionRoles && Array.isArray(user.sectionRoles)) {
            return user.sectionRoles
                .filter(r => r.roleType === 'section_admin')
                .map(r => r.sectionCode);
        }
        return [];
    },

    // 选择标段（允许未授权用户浏览）
    selectSection: function (e) {
        const section = e.currentTarget.dataset.section;
        const sectionInfo = e.currentTarget.dataset.sectionInfo;
        const app = getApp();

        // 如果未授权，提示但不强制，允许继续浏览
        if (!this.data.isAuthorized || !app.globalData.token) {
            wx.showModal({
                title: '提示',
                content: '登录后可享受更多功能服务，是否现在登录？',
                confirmText: '去登录',
                cancelText: '继续浏览',
                success: (res) => {
                    if (res.confirm) {
                        // 用户选择登录
                        this.getUserProfile();
                    } else {
                        // 用户选择继续浏览，允许进入标段页面
                        app.globalData.currentSection = sectionInfo;
                        this.setData({ currentSection: section });
                        wx.navigateTo({ url: `/pages/section/section?section=${section}` });
                    }
                }
            });
            return;
        }

        // 已授权用户正常流程
        app.globalData.currentSection = sectionInfo;
        this.setData({ currentSection: section });

        wx.showLoading({ title: '正在检查权限...' });
        wx.request({
            url: app.globalData.baseUrl + '/auth/verify',
            method: 'POST',
            data: { token: app.globalData.token },
            success: (res) => {
                wx.hideLoading();
                if (res.data?.success) {
                    const user = res.data.data.user || {};
                    app.globalData.currentUser = this._formatUserInfo(user);

                    const managedSections = this._getManagedSections(user);
                    const currentCode = sectionInfo?.section_code || section;
                    const hasAccess = currentCode ? managedSections.includes(currentCode) : false;

                    if (!hasAccess) {
                        wx.showToast({ title: '非该标段管理员，管理功能隐藏', icon: 'none', duration: 2000 });
                    }
                }
                wx.navigateTo({ url: `/pages/section/section?section=${section}` });
            },
            fail: () => {
                wx.hideLoading();
                wx.navigateTo({ url: `/pages/section/section?section=${section}` });
            }
        });
    },

    // 跳过授权
    skipAuth: function () {
        this.setData({ showAuthPrompt: false });
        // 保存跳过授权的选择，下次进入不再显示
        wx.setStorageSync('skipAuth', true);
    },

    // 显示登录提示
    showLoginPrompt: function () {
        this.setData({ showAuthPrompt: true });
        // 清除跳过授权的标记
        wx.removeStorageSync('skipAuth');
    },

    // 手动重新授权
    reAuthorize: function () {
        wx.openSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    this.getUserProfile();
                } else {
                    wx.showToast({ title: '需要授权才能使用', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '打开设置失败', icon: 'none' });
            }
        });
    },

    // 获取用户信息（主要授权方法）
    getUserProfile: function () {
        this.showNicknameAvatarModal();
    },

    // 显示头像昵称填写弹窗
    showNicknameAvatarModal: function () {
        this.setData({
            showNicknameModal: true,
            tempNickname: '',
            tempAvatarUrl: '/images/user.png'
        });
    },

    // 选择头像
    chooseAvatar: function (e) {
        this.setData({ tempAvatarUrl: e.detail.avatarUrl });
    },

    // 输入昵称
    onNicknameInput: function (e) {
        this.setData({ tempNickname: e.detail.value });
    },

    // 确认提交用户信息
    confirmUserInfo: function () {
        const { tempNickname, tempAvatarUrl } = this.data;

        if (!tempNickname?.trim()) {
            wx.showToast({ title: '请输入昵称', icon: 'none' });
            return;
        }

        const userInfo = {
            nickName: tempNickname.trim(),
            avatarUrl: tempAvatarUrl,
            gender: 0,
            city: '',
            province: '',
            country: '',
            language: 'zh_CN'
        };

        this.setData({ showNicknameModal: false });
        this.proceedWithLogin(userInfo);
    },

    // 取消填写
    cancelUserInfo: function () {
        this.setData({ showNicknameModal: false });
    },

    // 继续登录流程
    proceedWithLogin: function (userInfo) {
        wx.login({
            success: (loginRes) => {
                if (loginRes.code) {
                    this.wechatLogin(loginRes.code, userInfo);
                } else {
                    wx.showToast({ title: '登录失败，请重试', icon: 'none' });
                }
            },
            fail: () => {
                wx.showToast({ title: '登录失败，请重试', icon: 'none' });
            }
        });
    },

    // 调用后端登录接口
    wechatLogin: function (code, userInfo) {
        const app = getApp();

        wx.showLoading({ title: '登录中...' });

        wx.request({
            url: app.globalData.baseUrl + '/auth/login',
            method: 'POST',
            data: { code, userInfo },
            success: (res) => {
                wx.hideLoading();

                if (res.data.success) {
                    const backendUser = res.data.data.user;
                    const isVerified = backendUser.is_verified === 1 || backendUser.is_verified === true;

                    // 保存到全局数据
                    app.globalData.userInfo = userInfo;
                    app.globalData.currentUser = this._formatUserInfo(backendUser);
                    app.globalData.token = res.data.data.token;
                    app.globalData.isVerified = isVerified;

                    // 保存到本地存储
                    wx.setStorageSync('userInfo', userInfo);
                    wx.setStorageSync('token', res.data.data.token);

                    // 更新页面状态
                    this.setData({
                        isAuthorized: true,
                        isVerified: isVerified,
                        userInfo: userInfo,
                        showAuthPrompt: false
                    });

                    // 清除跳过授权的标记
                    wx.removeStorageSync('skipAuth');

                    wx.showToast({ title: '授权成功', icon: 'success', duration: 2000 });
                    this.logAuthorization('success', userInfo);
                } else {
                    let errorMessage = res.data.message || '登录失败';
                    if (res.data.details) {
                        if (res.data.details.errcode === 40013) {
                            errorMessage = 'AppID配置错误，请检查小程序配置';
                        } else if (res.data.details.errcode === 40125) {
                            errorMessage = 'AppSecret配置错误，请检查后端配置';
                        }
                    }
                    wx.showToast({ title: errorMessage, icon: 'none', duration: 3000 });
                }
            },
            fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '网络错误，请重试', icon: 'none', duration: 2000 });
            }
        });
    },

    // 点击认证状态 - 跳转到认证页面
    goToVerification: function () {
        const app = getApp();
        const currentUser = app.globalData.currentUser;
        const isVerified = currentUser && (currentUser.is_verified === 1 || currentUser.is_verified === true);

        if (isVerified) {
            // 已认证，显示认证信息
            wx.showModal({
                title: '认证状态',
                content: '您已完成认证',
                showCancel: false,
                confirmText: '确定'
            });
        } else {
            // 未认证，跳转到认证页面
            wx.navigateTo({
                url: '/pages/verification/verification'
            });
        }
    },

    onReady: function () { },
    onHide: function () { },
    onUnload: function () { }
})