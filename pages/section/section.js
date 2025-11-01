// pages/section/section.js
const app = getApp()

Page({
    data: {
        section: '',
        sectionInfo: null
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
    },

    goBack: function() {
        wx.navigateBack()
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

        // 设置用户信息
        app.globalData.currentUser = {
            nickName: '微信用户', // 使用微信用户昵称
            role: 'employee',
            avatar: '👷',
            phone: '138****1234'
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

    loginAs: function(e) {
        console.log('loginAs被调用', e)
        const role = e.currentTarget.dataset.role
        console.log('当前角色:', role)
        const userData = {
            'employee': {
                name: '员工',
                role: 'employee',
                department: '生产车间',
                avatar: '👷',
                phone: '138****1234'
            },
            'admin': {
                name: '安全环保部',
                role: 'admin',
                department: '安全部门',
                avatar: '👩‍💼',
                phone: '137****9012'
            }
        }

        app.globalData.currentUser = userData[role]

        // 设置标段信息
        if (this.data.sectionInfo) {
            app.globalData.currentSection = this.data.sectionInfo;
        } else {
            app.globalData.currentSection = {
                section_code: this.data.section,
                section_name: `第${this.data.section}标段`
            };
        }

        if (role === 'employee') {
            // 个人中心按钮跳转到我的举报页面
            wx.showToast({
                title: '欢迎回来，员工！',
                icon: 'success',
                duration: 1500
            })

            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/my-reports/my-reports'
                })
            }, 1500)
        } else {
            // 安全环保部按钮跳转到管理员界面
            wx.showToast({
                title: `欢迎回来，第${this.data.section}标段${userData[role].name}！`,
                icon: 'success',
                duration: 2000
            })

            // 根据用户角色跳转到不同页面
            const currentUser = app.globalData.currentUser;
            if (currentUser && currentUser.role === 'admin') {
                // admin用户跳转到安全管理部页面
                wx.navigateTo({
                    url: '/pages/admin/admin'
                });
            } else {
                // employee用户跳转到员工页面
                wx.navigateTo({
                    url: '/pages/employee/employee'
                });
            }
        }
    },

    onReady: function () {
        // 页面渲染完成
    },

    onShow: function () {
        // 页面显示
    },

    onHide: function () {
        // 页面隐藏
    },

    onUnload: function () {
        // 页面卸载
    }
})