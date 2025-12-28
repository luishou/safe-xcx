// pages/section/section.js
const app = getApp()

Page({
    data: {
        section: '',
        sectionInfo: null,
        isAdmin: false
    },

    onLoad: function (options) {
        const sectionCode = options.section || 'TJ01'

        // 从全局标段列表中查找标段信息
        const sections = app.globalData.sections;
        let sectionInfo = null;

        if (sections && sections.length > 0) {
            sectionInfo = sections.find(s => s.section_code === sectionCode);
        }

        console.log('标段页面 - 标段代码:', sectionCode);
        console.log('标段页面 - 找到标段信息:', sectionInfo);

        this.setData({
            section: sectionCode,
            sectionInfo: sectionInfo
        })

        // 设置标段信息到全局数据
        if (sectionInfo) {
            app.globalData.currentSection = sectionInfo;
        }

        // 设置页面标题
        wx.setNavigationBarTitle({
            title: sectionInfo ? sectionInfo.section_name : `第${sectionCode}标段`
        })

        // 初始化角色标识
        this.updateRoleFlags();
    },

    goBack: function() {
        wx.navigateBack()
    },

    // 实时获取用户信息并更新权限
    fetchUserInfoAndUpdateFlags: function() {
        const app = getApp();
        const currentSection = this.data.section || app.globalData.currentSection?.section_code;

        if (!app.globalData.token) {
            console.log('未登录，不显示管理菜单');
            this.setData({
                isAdmin: false,
                hasManagementAccess: false
            });
            return;
        }

        console.log('=== 实时获取用户信息 ===');
        console.log('当前标段:', currentSection);

        // 请求最新的用户信息
        wx.request({
            url: app.globalData.baseUrl + '/auth/verify',
            method: 'POST',
            data: {
                token: app.globalData.token
            },
            success: (res) => {
                console.log('用户信息获取成功:', res.data);

                if (res.data && res.data.success) {
                    const userInfo = res.data.data.user;

                    // 更新全局用户信息
                    app.globalData.currentUser = {
                        ...userInfo,
                        name: userInfo.nickName || userInfo.name,
                        nickName: userInfo.nickName || userInfo.name,
                        department: userInfo.department || '未设置部门',
                        avatar: userInfo.avatarUrl || userInfo.avatar || '👷',
                        avatarUrl: userInfo.avatarUrl || userInfo.avatar || '👷',
                        managed_sections: userInfo.managed_sections
                    };

                    console.log('更新后的全局用户信息:', app.globalData.currentUser);

                    // 检查权限
                    this.checkManagementAccess(currentSection, userInfo.managed_sections);
                } else {
                    console.error('获取用户信息失败:', res.data.message);
                    this.setData({
                        isAdmin: false,
                        hasManagementAccess: false
                    });
                }
            },
            fail: (err) => {
                console.error('获取用户信息请求失败:', err);
                this.setData({
                    isAdmin: false,
                    hasManagementAccess: false
                });
            }
        });
    },

    // 检查管理权限
    checkManagementAccess: function(currentSection, managedSections) {
        console.log('=== 检查管理权限 ===');
        console.log('当前标段:', currentSection);
        console.log('managed_sections字段:', managedSections);
        console.log('字段类型:', typeof managedSections);

        let hasManagementAccess = false;
        let parsedSections = [];
        const currentSectionName = (this.data.sectionInfo?.section_name || '').trim();
        const currentSectionCode = (currentSection || '').trim();

        if (managedSections && currentSection) {
            try {
                parsedSections = Array.isArray(managedSections)
                    ? managedSections
                    : JSON.parse(managedSections || '[]');
                // 统一大小写与空白，确保匹配稳健
                parsedSections = (parsedSections || [])
                    .filter(v => typeof v === 'string')
                    .map(v => v.trim());

                // 仅使用“标段代码”进行匹配判断权限
                hasManagementAccess = currentSectionCode ? parsedSections.includes(currentSectionCode) : false;

                console.log('权限检查详情:', {
                    当前标段代码: currentSectionCode,
                    当前标段名称: currentSectionName,
                    解析后的管理标段: parsedSections,
                    代码包含关系: parsedSections.includes(currentSectionCode),
                    最终权限: hasManagementAccess
                });
            } catch (error) {
                console.error('解析managed_sections失败:', error);
                console.error('原始数据:', managedSections);
                hasManagementAccess = false;
            }
        } else {
            console.log('权限检查失败 - 缺少必要数据:', {
                当前标段存在: !!currentSection,
                managed_sections存在: !!managedSections
            });
        }

        console.log('设置菜单显示状态:', hasManagementAccess);
        this.setData({
            isAdmin: hasManagementAccess,
            hasManagementAccess: hasManagementAccess
        });
    },

    // 根据全局用户信息更新角色标识（保留作为备用）
    updateRoleFlags: function() {
        this.fetchUserInfoAndUpdateFlags();
    },

    directToReport: function() {
        // 设置标段信息到全局数据
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
            console.log('举报页面设置标段信息:', this.data.sectionInfo);
        }

        // 显示举报须知
        wx.showModal({
            title: '举报须知',
            content: '请确保举报内容真实、准确，提供详细的隐患位置和描述，如有现场照片请一并上传。恶意举报将承担相应责任。',
            confirmText: '我已阅读',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({
                        url: '/pages/report/report'
                    })
                }
            }
        })
    },

    showSafetyKnowledge: function() {
        wx.navigateTo({
            url: '/pages/safety-knowledge/safety-knowledge'
        })
    },

    handlePersonalCenter: function() {
        console.log('个人中心按钮被点击')
        console.log('当前标段信息:', this.data.sectionInfo)

        // 检查是否有授权用户信息，如果没有则不设置用户信息
        if (!app.globalData.currentUser) {
            wx.showToast({
                title: '请先授权登录',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 设置标段信息（使用完整的标段对象）
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
            console.log('个人中心设置标段信息:', this.data.sectionInfo);
        } else {
            console.warn('标段信息不存在，使用字符串:', this.data.section);
            // 如果标段信息不存在，至少设置标段代码
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        // 跳转到员工个人中心页面（非tabBar页面），传递标段参数
        wx.navigateTo({
            url: `/pages/employee-center/employee-center?section=${this.data.section}`
        })
    },

    // 仅管理员可见的菜单点击，进入安全环保部
    goToAdmin: function() {
        // 检查是否已授权登录
        if (!app.globalData.currentUser) {
            wx.showToast({
                title: '请先授权登录',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 不做权限检查，前端控制菜单显示

        // 设置标段信息
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        // 传递isAdmin参数到admin页面，用于区分显示"安全环保部"还是"举报公示"
        wx.navigateTo({
            url: `/pages/admin/admin?isAdmin=true`
        });
    },

    // 所有用户可见的菜单点击，进入举报公示页面
    goToReportPublic: function() {
        // 检查是否已授权登录
        if (!app.globalData.currentUser) {
            wx.showToast({
                title: '请先授权登录',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 设置标段信息
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        // 传递isAdmin=false参数到admin页面，显示举报公示页面（只显示举报列表）
        wx.navigateTo({
            url: `/pages/admin/admin?isAdmin=false`
        });
    },

    // loginAs 方法已移除 - 不再使用基于角色的登录逻辑

    onReady: function () {
        // 页面渲染完成
    },

    onShow: function () {
        // 页面显示时同步角色标识
        this.updateRoleFlags();
    },

    onHide: function () {
        // 页面隐藏
    },

    onUnload: function () {
        // 页面卸载
    }
})