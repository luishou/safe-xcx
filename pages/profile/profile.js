// pages/profile/profile.js
const app = getApp()

Page({
    data: {
        currentUser: null,
        currentSection: '',
        activeTab: 'todo', // 'todo' or 'reports'

        // 待办数据
        todoCount: 0,
        todoReports: [],
        isLoadingTodo: false,

        // 我的举报数据
        myReportsCount: 0,
        myReports: [],
        isLoadingMyReports: false,

        // 权限
        isSupervisor: false,
        isManager: false
    },

    onLoad: function (options) {
        this.updateUserInfo();
        wx.setNavigationBarTitle({ title: '个人中心' });
        this.loadData();
    },

    onShow: function () {
        this.updateUserInfo();
        this.loadData();
    },

    loadData() {
        this.loadTodoReports();
        this.loadMyReports();
    },

    // 切换Tab
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab !== this.data.activeTab) {
            this.setData({ activeTab: tab });
        }
    },

    updateUserInfo: function () {
        const currentUser = app.globalData.currentUser;
        const wechatUserInfo = app.globalData.userInfo;
        const currentSection = app.globalData.currentSection;

        const mergedUser = {
            name: currentUser?.name || currentUser?.nickName || wechatUserInfo?.nickName || '微信用户',
            role: currentUser?.role || 'employee',
            department: currentUser?.department || '未设置部门',
            phone: currentUser?.phone || '138****1234'
        };

        const isSupervisor = currentUser?.is_supervisor === 1;
        const isManager = (currentUser?.managed_sections?.length > 0) || currentUser?.role === 'admin' || currentUser?.role === 'manager';

        this.setData({
            currentUser: mergedUser,
            currentSection: currentSection || { section_code: 'TJ01' },
            isSupervisor,
            isManager
        });

        if (!currentUser) {
            setTimeout(() => {
                const updatedCurrentUser = app.globalData.currentUser;
                const updatedWechatUser = app.globalData.userInfo;
                const updatedSection = app.globalData.currentSection;
                this.setData({
                    currentUser: {
                        name: updatedCurrentUser?.name || updatedCurrentUser?.nickName || updatedWechatUser?.nickName || '微信用户',
                        role: updatedCurrentUser?.role || 'employee',
                        department: updatedCurrentUser?.department || '未设置部门',
                        phone: updatedCurrentUser?.phone || '138****1234'
                    },
                    currentSection: updatedSection || { section_code: 'TJ01' },
                    isSupervisor: updatedCurrentUser?.is_supervisor === 1,
                    isManager: (updatedCurrentUser?.managed_sections?.length > 0) || updatedCurrentUser?.role === 'admin' || updatedCurrentUser?.role === 'manager'
                });
            }, 1000);
        }
    },

    // 加载待办列表
    loadTodoReports: function () {
        if (!app.globalData.token) {
            this.setData({ todoCount: 0, todoReports: [], isLoadingTodo: false });
            return;
        }

        this.setData({ isLoadingTodo: true });
        const currentSection = app.globalData.currentSection;

        wx.request({
            url: app.globalData.baseUrl + '/report/todo',
            method: 'GET',
            header: { 'Authorization': 'Bearer ' + app.globalData.token },
            data: currentSection?.section_code ? { section: currentSection.section_code } : {},
            success: (res) => {
                if (res.data.success) {
                    const reports = res.data.data.reports || [];
                    const total = res.data.data.pagination?.total || reports.length;

                    const mapStatus = (status) => {
                        const mapping = {
                            'submitted': '待处理',
                            'confirmed': '待监理确认',
                            'supervisor_confirmed': '待整改',
                            'photo_uploaded': '待下发奖金',
                            'completed': '已办结'
                        };
                        return mapping[status] || status;
                    };

                    const mapHazardType = (type) => {
                        const mapping = {
                            'fire': '消防安全隐患',
                            'electric': '电气安全隐患',
                            'chemical': '化学品安全隐患',
                            'mechanical': '机械设备安全隐患',
                            'height': '高空作业安全隐患',
                            'edge': '临边防护安全隐患',
                            'environment': '环境安全隐患',
                            'ppe': '个人防护装备隐患',
                            'other': '其他安全隐患'
                        };
                        return mapping[type] || type;
                    };

                    const processedReports = reports.map(r => ({
                        ...r,
                        status_cn: mapStatus(r.status),
                        hazard_type_cn: mapHazardType(r.hazard_type)
                    }));

                    this.setData({ todoCount: total, todoReports: processedReports });
                } else {
                    this.setData({ todoCount: 0, todoReports: [] });
                }
            },
            fail: () => this.setData({ todoCount: 0, todoReports: [] }),
            complete: () => this.setData({ isLoadingTodo: false })
        });
    },

    // 加载我的举报列表
    loadMyReports: function () {
        const currentSection = app.globalData.currentSection;
        if (!app.globalData.token || !currentSection) {
            this.setData({ myReportsCount: 0, myReports: [], isLoadingMyReports: false });
            return;
        }

        this.setData({ isLoadingMyReports: true });

        wx.request({
            url: app.globalData.baseUrl + '/report/personal-reports',
            method: 'GET',
            header: { 'Authorization': 'Bearer ' + app.globalData.token },
            data: { section: currentSection.section_code },
            success: (res) => {
                if (res.data.success) {
                    const reports = res.data.data.reports || [];
                    const total = res.data.data.pagination?.total || reports.length;

                    const mapStatus = (status) => {
                        const mapping = {
                            'submitted': '待处理',
                            'confirmed': '待监理确认',
                            'supervisor_confirmed': '待整改',
                            'photo_uploaded': '待下发奖金',
                            'completed': '已办结'
                        };
                        return mapping[status] || status;
                    };

                    const mapHazardType = (type) => {
                        const mapping = {
                            'fire': '消防安全隐患',
                            'electric': '电气安全隐患',
                            'chemical': '化学品安全隐患',
                            'mechanical': '机械设备安全隐患',
                            'height': '高空作业安全隐患',
                            'edge': '临边防护安全隐患',
                            'environment': '环境安全隐患',
                            'ppe': '个人防护装备隐患',
                            'other': '其他安全隐患'
                        };
                        return mapping[type] || type;
                    };

                    const processedReports = reports.map(r => ({
                        ...r,
                        status_cn: mapStatus(r.status),
                        hazard_type_cn: mapHazardType(r.hazard_type),
                        created_at_short: r.created_at ? r.created_at.substring(0, 10) : ''
                    }));

                    this.setData({ myReportsCount: total, myReports: processedReports });
                } else {
                    this.setData({ myReportsCount: 0, myReports: [] });
                }
            },
            fail: () => this.setData({ myReportsCount: 0, myReports: [] }),
            complete: () => this.setData({ isLoadingMyReports: false })
        });
    },

    goToDetail: function (e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/todo-detail/todo-detail?id=' + id });
    },

    goToReadonlyDetail: function (e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/report-detail/report-detail?id=' + id + '&readonly=1' });
    },

    goToStats: function () { wx.navigateTo({ url: '/pages/stats/stats' }); },

    showSafetyKnowledge: function () {
        wx.showModal({
            title: '安全知识',
            content: '消防安全：发现火情立即拨打119，使用灭火器时拔掉保险销，对准火焰根部喷射。\n\n用电安全：禁止私拉乱接电线，发现漏电立即断电。\n\n机械安全：操作设备前检查防护装置，严禁违章操作。',
            showCancel: false,
            confirmText: '我知道了'
        });
    },

    logout: function () {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    app.globalData.currentUser = null;
                    app.globalData.currentSection = null;
                    wx.showToast({ title: '已退出登录', icon: 'success', duration: 2000 });
                    setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 2000);
                }
            }
        });
    }
})