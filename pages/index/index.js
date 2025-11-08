// pages/index/index.js
Page({
    data: {
        currentSection: null,
        isAuthorized: false,
        userInfo: {},
        sections: [], // 标段列表
        showNicknameModal: false,
        tempNickname: '',
        tempAvatarUrl: '/images/user.png'
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
            // 转换数据格式以匹配模板期望的结构
            const formattedSections = sections.map(section => ({
                code: section.section_code,
                name: section.section_name,
                info: section
            }));
            
            this.setData({
                sections: formattedSections
            });
            console.log('页面加载标段配置成功:', formattedSections);
        } else {
            console.log('标段配置尚未加载完成，尝试延迟加载');
            // 延迟500ms再次尝试
            setTimeout(() => {
                const retrySections = app.globalData.sections;
                console.log('延迟重试 - 标段数据:', retrySections);
                if (retrySections && retrySections.length > 0) {
                    // 转换数据格式以匹配模板期望的结构
                    const formattedRetrySections = retrySections.map(section => ({
                        code: section.section_code,
                        name: section.section_name,
                        info: section
                    }));
                    
                    this.setData({
                        sections: formattedRetrySections
                    });
                    console.log('延迟加载标段配置成功:', formattedRetrySections);
                } else {
                    console.log('标段配置加载失败，使用默认配置');
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

    // 注意：已移除旧的 onGetUserInfo 方法，现在统一使用新的 getUserProfile 接口

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

        // 点击标段时，实时请求用户信息以确保managed_sections最新
        wx.showLoading({ title: '正在检查权限...' });
        wx.request({
            url: app.globalData.baseUrl + '/auth/verify',
            method: 'POST',
            data: { token: app.globalData.token },
            success: (res) => {
                wx.hideLoading();
                if (res.data && res.data.success) {
                    const user = res.data.data.user || {};
                    // 更新全局用户信息，确保managed_sections及时生效
                    app.globalData.currentUser = {
                        ...user,
                        name: user.nickName || user.name,
                        nickName: user.nickName || user.name,
                        department: user.department || '未设置部门',
                        avatar: user.avatarUrl || user.avatar,
                        avatarUrl: user.avatarUrl || user.avatar,
                        managed_sections: user.managed_sections
                    };

                    // 解析managed_sections并检查是否包含当前标段（名称或代码）
                    let parsed = [];
                    try {
                        parsed = Array.isArray(user.managed_sections)
                            ? user.managed_sections
                            : JSON.parse(user.managed_sections || '[]');
                    } catch (err) {
                        console.error('解析managed_sections失败:', err);
                    }
                    // 统一处理为去空白的字符串数组
                    parsed = (parsed || [])
                        .filter(v => typeof v === 'string')
                        .map(v => v.trim());

                    const currentCode = sectionInfo?.section_code || section;
                    // 按需求仅检查“标段代码”是否包含在managed_sections中
                    const hasAccess = currentCode ? parsed.includes(currentCode) : false;
                    console.log('权限检查（点击时，仅代码）:', { parsed, currentCode, hasAccess });
                    if (!hasAccess) {
                        wx.showToast({
                            title: '非该标段管理员，管理功能隐藏',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                } else {
                    console.warn('实时获取用户信息失败，继续进入标段页');
                }

                // 无论结果如何都进入标段页，页面内仍会再次实时校验
                wx.navigateTo({ url: `/pages/section/section?section=${section}` });
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('实时获取用户信息请求失败:', err);
                // 请求失败也继续进入标段页，页面内再次校验
                wx.navigateTo({ url: `/pages/section/section?section=${section}` });
            }
        });
    },

    // 手动重新授权
    reAuthorize: function() {
        console.log('=== 调用wx.openSetting ===');
        wx.openSetting({
            success: (res) => {
                // 打印完整的wx.openSetting成功返回信息
                console.log('=== 微信wx.openSetting成功返回完整信息 ===');
                console.log('完整返回对象:', JSON.stringify(res, null, 2));
                console.log('返回对象类型:', typeof res);
                console.log('返回对象键名:', Object.keys(res));
                console.log('authSetting:', JSON.stringify(res.authSetting, null, 2));
                console.log('authSetting类型:', typeof res.authSetting);
                console.log('authSetting键名:', Object.keys(res.authSetting));
                console.log('scope.userInfo授权状态:', res.authSetting['scope.userInfo']);
                console.log('=== wx.openSetting成功信息打印结束 ===');

                if (res.authSetting['scope.userInfo']) {
                    console.log('用户重新授权了scope.userInfo，尝试获取用户信息');
                    // 用户重新授权了，尝试获取用户信息
                    this.getUserProfile();
                } else {
                    console.log('用户未授权scope.userInfo');
                    wx.showToast({
                        title: '需要授权才能使用',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                // 打印完整的wx.openSetting失败信息
                console.log('=== 微信wx.openSetting失败返回完整信息 ===');
                console.log('完整错误对象:', JSON.stringify(err, null, 2));
                console.log('错误对象类型:', typeof err);
                console.log('错误对象键名:', Object.keys(err));
                console.log('errMsg:', err.errMsg);
                console.log('errCode:', err.errCode);
                console.log('=== wx.openSetting失败信息打印结束 ===');

                wx.showToast({
                    title: '打开设置失败',
                    icon: 'none'
                });
            }
        });
    },

    // 获取用户信息（主要授权方法）
    getUserProfile: function() {
        console.log('开始获取用户信息');
        const app = getApp();

        // 使用微信官方推荐的头像昵称填写能力
        this.showNicknameAvatarModal();
    },

    // 显示头像昵称填写弹窗
    showNicknameAvatarModal: function() {
        console.log('显示头像昵称填写弹窗');
        this.setData({
            showNicknameModal: true,
            tempNickname: '',
            tempAvatarUrl: '/images/user.png' // 默认头像
        });
    },

    // 选择头像
    chooseAvatar: function(e) {
        console.log('选择头像:', e.detail.avatarUrl);
        this.setData({
            tempAvatarUrl: e.detail.avatarUrl
        });
    },

    // 输入昵称
    onNicknameInput: function(e) {
        console.log('输入昵称:', e.detail.value);
        this.setData({
            tempNickname: e.detail.value
        });
    },

    // 确认提交用户信息
    confirmUserInfo: function() {
        const { tempNickname, tempAvatarUrl } = this.data;
        
        if (!tempNickname || tempNickname.trim() === '') {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none'
            });
            return;
        }

        // 构造用户信息
        const userInfo = {
            nickName: tempNickname.trim(),
            avatarUrl: tempAvatarUrl,
            gender: 0,
            city: '',
            province: '',
            country: '',
            language: 'zh_CN'
        };

        console.log('用户填写的信息:', userInfo);

        // 关闭弹窗
        this.setData({
            showNicknameModal: false
        });

        // 继续登录流程
        this.proceedWithLogin(userInfo);
    },

    // 取消填写
    cancelUserInfo: function() {
        this.setData({
            showNicknameModal: false
        });
    },

    // 继续登录流程
    proceedWithLogin: function(userInfo) {
        // 获取微信登录code
        wx.login({
            success: (loginRes) => {
                console.log('=== 微信wx.login成功返回完整信息 ===');
                console.log('完整返回对象:', JSON.stringify(loginRes, null, 2));
                console.log('code:', loginRes.code);

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
                console.log('=== 微信wx.login失败返回完整信息 ===');
                console.log('完整错误对象:', JSON.stringify(err, null, 2));
                wx.showToast({
                    title: '登录失败，请重试',
                    icon: 'none'
                });
            }
        });
    },

    // 旧的getUserProfile方法（保留作为备用）
    getUserProfileOld: function() {
        console.log('开始获取用户信息');
        const app = getApp();

        // 直接获取用户信息授权（必须由用户直接点击触发）
        wx.getUserProfile({
            desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
            success: (profileRes) => {
                // 打印完整的微信授权返回信息
                console.log('=== 微信getUserProfile成功返回完整信息 ===');
                console.log('完整返回对象:', JSON.stringify(profileRes, null, 2));
                console.log('返回对象类型:', typeof profileRes);
                console.log('返回对象键名:', Object.keys(profileRes));

                // 打印用户信息详情
                if (profileRes.userInfo) {
                    console.log('--- 用户信息详情 ---');
                    console.log('userInfo完整对象:', JSON.stringify(profileRes.userInfo, null, 2));
                    console.log('userInfo键名:', Object.keys(profileRes.userInfo));
                    console.log('nickName:', profileRes.userInfo.nickName);
                    console.log('gender:', profileRes.userInfo.gender);
                    console.log('city:', profileRes.userInfo.city);
                    console.log('province:', profileRes.userInfo.province);
                    console.log('country:', profileRes.userInfo.country);
                    console.log('avatarUrl:', profileRes.userInfo.avatarUrl);
                    console.log('language:', profileRes.userInfo.language);
                }

                // 打印其他可能的信息
                console.log('--- 其他返回信息 ---');
                console.log('rawData:', profileRes.rawData);
                console.log('signature:', profileRes.signature);
                console.log('encryptedData:', profileRes.encryptedData);
                console.log('iv:', profileRes.iv);
                console.log('cloudID:', profileRes.cloudID);

                console.log('=== 微信授权信息打印结束 ===');

                // 准备发送到后端的完整用户授权信息
                const userInfo = profileRes.userInfo;
                const authData = {
                    userInfo: userInfo,
                    rawData: profileRes.rawData,
                    signature: profileRes.signature,
                    encryptedData: profileRes.encryptedData,
                    iv: profileRes.iv,
                    cloudID: profileRes.cloudID
                };

                console.log('=== 准备发送到后端的完整授权信息 ===');
                console.log('用户基本信息:', JSON.stringify(userInfo, null, 2));
                console.log('加密数据长度:', authData.encryptedData ? authData.encryptedData.length : 0);
                console.log('签名:', authData.signature);
                console.log('CloudID:', authData.cloudID);
                console.log('=== 授权信息准备完成 ===');

                // 继续登录流程，传递完整的授权信息
                this.proceedWithAuthData(authData);

                // 用户授权成功后，获取微信登录code
                wx.login({
                    success: (loginRes) => {
                        // 打印完整的wx.login返回信息
                        console.log('=== 微信wx.login成功返回完整信息 ===');
                        console.log('完整返回对象:', JSON.stringify(loginRes, null, 2));
                        console.log('返回对象类型:', typeof loginRes);
                        console.log('返回对象键名:', Object.keys(loginRes));
                        console.log('code:', loginRes.code);
                        console.log('errMsg:', loginRes.errMsg);
                        console.log('=== wx.login信息打印结束 ===');

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
                        // 打印完整的wx.login失败信息
                        console.log('=== 微信wx.login失败返回完整信息 ===');
                        console.log('完整错误对象:', JSON.stringify(err, null, 2));
                        console.log('错误对象类型:', typeof err);
                        console.log('错误对象键名:', Object.keys(err));
                        console.log('errMsg:', err.errMsg);
                        console.log('errCode:', err.errCode);
                        console.log('=== wx.login失败信息打印结束 ===');

                        wx.showToast({
                            title: '登录失败，请重试',
                            icon: 'none'
                        });
                    }
                });
            },
            fail: (err) => {
                // 打印完整的授权失败信息
                console.log('=== 微信getUserProfile失败返回完整信息 ===');
                console.log('完整错误对象:', JSON.stringify(err, null, 2));
                console.log('错误对象类型:', typeof err);
                console.log('错误对象键名:', Object.keys(err));
                console.log('errMsg:', err.errMsg);
                console.log('errCode:', err.errCode);
                console.log('=== getUserProfile失败信息打印结束 ===');

                // 只显示授权失败提示，不执行其他逻辑
                wx.showToast({
                    title: '授权失败',
                    icon: 'none',
                    duration: 2000
                });

                // 授权失败时直接返回，不执行任何其他逻辑
                return;
            }
        });
    },

    // 显示昵称输入弹窗
    showNicknameInputModal: function(userInfo) {
        console.log('=== 显示昵称输入弹窗 ===');
        console.log('当前用户信息:', JSON.stringify(userInfo, null, 2));

        wx.showModal({
            title: '完善个人信息',
            content: '微信隐私保护政策下，需要您手动输入真实昵称',
            confirmText: '输入昵称',
            cancelText: '跳过',
            success: (res) => {
                if (res.confirm) {
                    console.log('用户选择输入昵称');
                    // 这里可以跳转到昵称输入页面或使用输入框
                    this.navigateNicknameInput(userInfo);
                } else {
                    console.log('用户选择跳过，使用默认昵称');
                    // 用户选择跳过，继续使用默认昵称进行登录
                    this.proceedWithLogin(userInfo);
                }
            }
        });
    },

    // 跳转到昵称输入页面
    navigateNicknameInput: function(userInfo) {
        console.log('跳转到昵称输入页面');
        // 使用简单的输入框方式
        wx.showInputBox({
            title: '请输入您的昵称',
            placeholder: '请输入真实昵称',
            success: (res) => {
                if (res.content && res.content.trim()) {
                    console.log('用户输入的昵称:', res.content);
                    // 更新用户信息中的昵称
                    userInfo.nickName = res.content.trim();
                    console.log('更新后的用户信息:', JSON.stringify(userInfo, null, 2));

                    // 继续登录流程
                    this.proceedWithLogin(userInfo);
                } else {
                    wx.showToast({
                        title: '昵称不能为空',
                        icon: 'none'
                    });
                    // 重新尝试输入
                    this.navigateNicknameInput(userInfo);
                }
            },
            fail: () => {
                console.log('用户取消输入昵称');
                // 用户取消，使用默认昵称
                this.proceedWithLogin(userInfo);
            }
        });
    },

    // 使用完整授权数据进行登录
    proceedWithAuthData: function(authData) {
        console.log('=== 使用完整授权数据登录流程 ===');
        console.log('授权数据:', JSON.stringify(authData, null, 2));

        // 用户授权成功后，获取微信登录code
        wx.login({
            success: (loginRes) => {
                // 打印完整的wx.login返回信息
                console.log('=== 微信wx.login成功返回完整信息 ===');
                console.log('完整返回对象:', JSON.stringify(loginRes, null, 2));
                console.log('返回对象类型:', typeof loginRes);
                console.log('返回对象键名:', Object.keys(loginRes));
                console.log('code:', loginRes.code);
                console.log('errMsg:', loginRes.errMsg);
                console.log('=== wx.login信息打印结束 ===');

                if (loginRes.code) {
                    console.log('获取微信登录code成功:', loginRes.code);
                    // 调用后端登录接口，传递完整的授权数据
                    this.wechatLoginWithFullData(loginRes.code, authData);
                } else {
                    console.error('获取微信登录code失败:', loginRes);
                    wx.showToast({
                        title: '登录失败，请重试',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                // 打印完整的wx.login失败信息
                console.log('=== 微信wx.login失败返回完整信息 ===');
                console.log('完整错误对象:', JSON.stringify(err, null, 2));
                console.log('错误对象类型:', typeof err);
                console.log('错误对象键名:', Object.keys(err));
                console.log('errMsg:', err.errMsg);
                console.log('errCode:', err.errCode);
                console.log('=== wx.login失败信息打印结束 ===');

                wx.showToast({
                    title: '登录失败，请重试',
                    icon: 'none'
                });
            }
        });
    },

    // 使用完整授权数据的后端登录接口
    wechatLoginWithFullData: function(code, authData) {
        const app = getApp();

        console.log('=== 准备发送完整授权数据到后端 ===');
        console.log('code:', code);
        console.log('authData包含的字段:', Object.keys(authData));
        console.log('用户基本信息:', JSON.stringify(authData.userInfo, null, 2));
        console.log('encryptedData长度:', authData.encryptedData ? authData.encryptedData.length : 0);
        console.log('iv:', authData.iv);
        console.log('signature:', authData.signature);
        console.log('=== 发送数据准备完成 ===');

        wx.showLoading({
            title: '登录中...'
        });

        wx.request({
            url: app.globalData.baseUrl + '/auth/login',
            method: 'POST',
            data: {
                code: code,
                userInfo: authData.userInfo,
                rawData: authData.rawData,
                signature: authData.signature,
                encryptedData: authData.encryptedData,
                iv: authData.iv,
                cloudID: authData.cloudID
            },
            success: (res) => {
                console.log('=== 后端登录接口返回完整信息 ===');
                console.log('完整返回对象:', JSON.stringify(res, null, 2));
                console.log('statusCode:', res.statusCode);
                console.log('data:', JSON.stringify(res.data, null, 2));
                console.log('=== 后端返回信息打印结束 ===');

                if (res.data && res.data.success) {
                    console.log('后端登录成功');
                    console.log('后端返回的用户信息:', JSON.stringify(res.data.data.user, null, 2));
                    console.log('后端返回的token:', res.data.data.token);

                    // 存储token和用户信息
                    wx.setStorageSync('token', res.data.data.token);
                    wx.setStorageSync('userInfo', authData.userInfo);
                    app.globalData.token = res.data.data.token;
                    // 映射后端返回的用户信息，统一字段名
                    const backendUser = res.data.data.user;
                    app.globalData.currentUser = {
                        ...backendUser,
                        name: backendUser.nickName || backendUser.name,
                        avatar: backendUser.avatarUrl || backendUser.avatar,
                        department: backendUser.department || '未设置部门',
                        managed_sections: backendUser.managed_sections // 确保保留管理标段字段
                    };

                    wx.hideLoading();
                    wx.showToast({
                        title: '登录成功',
                        icon: 'success'
                    });

                    // 记录授权日志
                    this.logAuthorization('success', authData.userInfo);

                    // 跳转到标段选择页面
                    wx.navigateTo({
                        url: '/pages/section/section'
                    });
                } else {
                    console.error('后端登录失败:', res.data);
                    wx.hideLoading();
                    wx.showToast({
                        title: res.data?.message || '登录失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.log('=== 后端登录请求失败信息 ===');
                console.log('完整错误对象:', JSON.stringify(err, null, 2));
                console.log('错误对象类型:', typeof err);
                console.log('错误对象键名:', Object.keys(err));
                console.log('errMsg:', err.errMsg);
                console.log('statusCode:', err.statusCode);
                console.log('=== 后端登录失败信息打印结束 ===');

                wx.hideLoading();
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
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
                    // 映射后端返回的用户信息，统一字段名
                    const backendUser = res.data.data.user;
                    app.globalData.currentUser = {
                        ...backendUser,
                        name: backendUser.nickName || backendUser.name,
                        avatar: backendUser.avatarUrl || backendUser.avatar,
                        department: backendUser.department || '未设置部门',
                        managed_sections: backendUser.managed_sections // 确保保留管理标段字段
                    };
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
                        userInfo: userInfo,
                        currentUser: app.globalData.currentUser
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