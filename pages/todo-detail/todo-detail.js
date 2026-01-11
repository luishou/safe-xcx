// pages/todo-detail/todo-detail.js
// 待办详情页 - 专用于处理待办事项，始终可操作
const app = getApp();

Page({
    data: {
        reportId: 0,
        currentStatus: '',
        report: null,
        loading: true,
        error: '',

        // 操作相关
        processingOpinion: '',
        rewardAmount: '',
        supervisorComment: '',
        rectifiedImages: [],
        rewardImages: [],
        showConfirmForm: false,

        // 用户信息
        isSupervisor: false,
        isAdmin: false
    },

    onLoad(options) {
        const { id } = options;
        if (!id) {
            this.setData({ error: '缺少举报ID参数', loading: false });
            return;
        }

        this.setData({ reportId: parseInt(id) });

        const currentUser = app.globalData.currentUser;

        // 详细调试信息
        console.log('【待办详情】========== 用户信息调试 ==========');
        console.log('【待办详情】完整currentUser对象:', JSON.stringify(currentUser, null, 2));
        console.log('【待办详情】currentUser.is_supervisor:', currentUser?.is_supervisor);
        console.log('【待办详情】typeof is_supervisor:', typeof currentUser?.is_supervisor);
        console.log('【待办详情】isSupervisor判断结果:', currentUser?.is_supervisor === 1);
        console.log('【待办详情】========================================');

        this.setData({
            isSupervisor: currentUser?.is_supervisor === 1,
            isAdmin: currentUser?.is_admin === 1
        });
        this.loadReportDetail();
    },

    loadReportDetail() {
        if (!app.globalData.token) {
            this.setData({ error: '请先登录', loading: false });
            return;
        }

        this.setData({ loading: true, error: '' });

        wx.request({
            url: app.globalData.baseUrl + '/report/' + this.data.reportId,
            method: 'GET',
            header: { 'Authorization': 'Bearer ' + app.globalData.token },
            success: (res) => {
                this.setData({ loading: false });
                if (res.data.success) {
                    const report = res.data.data;

                    console.log('【待办详情】举报详情加载成功');
                    console.log('【待办详情】当前状态:', report.status);
                    console.log('【待办详情】isSupervisor:', this.data.isSupervisor);
                    console.log('【待办详情】是否满足监理确认条件:', report.status === 'confirmed' && this.data.isSupervisor);

                    this.setData({
                        report: {
                            ...report,
                            hazard_type_cn: this.mapHazardType(report.hazard_type),
                            severity_cn: this.mapSeverity(report.severity),
                            status_cn: this.mapStatus(report.status)
                        },
                        currentStatus: report.status
                    });
                } else {
                    this.setData({ error: res.data.message || '获取举报详情失败' });
                }
            },
            fail: () => {
                this.setData({ loading: false, error: '网络错误，请重试' });
            }
        });
    },

    mapHazardType(type) {
        const mapping = {
            'fire': '消防安全隐患', 'electric': '电气安全隐患', 'chemical': '化学品安全隐患',
            'mechanical': '机械设备安全隐患', 'height': '高空作业安全隐患', 'edge': '临边防护安全隐患',
            'environment': '环境安全隐患', 'ppe': '个人防护装备隐患', 'other': '其他安全隐患'
        };
        return mapping[type] || type;
    },

    mapSeverity(severity) {
        const mapping = { 'low': '一般', 'medium': '紧急', 'high': '非常紧急', 'critical': '极其紧急' };
        return mapping[severity] || severity;
    },

    mapStatus(status) {
        const mapping = {
            'submitted': '待处理',
            'confirmed': '待监理确认',
            'supervisor_confirmed': '待整改',
            'photo_uploaded': '待下发奖金',
            'completed': '已办结'
        };
        return mapping[status] || status;
    },

    goBack() { wx.navigateBack(); },

    viewImage(e) {
        const src = e.currentTarget.dataset.src;
        const list = e.currentTarget.dataset.list;
        const urls = Array.isArray(list) ? list : (typeof list === 'string' ? list.split(',') : [src]);
        wx.previewImage({ current: src, urls });
    },

    // ========== 输入事件 ==========
    onOpinionInput(e) { this.setData({ processingOpinion: e.detail.value }); },
    onRewardInput(e) { this.setData({ rewardAmount: e.detail.value }); },
    onSupervisorCommentInput(e) { this.setData({ supervisorComment: e.detail.value }); },

    showConfirmDialog() { this.setData({ showConfirmForm: true }); },
    cancelConfirm() { this.setData({ showConfirmForm: false }); },

    // ========== 安全部确认处理 ==========
    confirmReport() {
        if (!this.data.processingOpinion?.trim()) {
            wx.showToast({ title: '请填写处理意见', icon: 'none' });
            return;
        }
        const amount = parseFloat(this.data.rewardAmount);
        if (isNaN(amount) || amount < 0) {
            wx.showToast({ title: '请填写有效的奖金金额', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '确认处理',
            content: `处理意见：${this.data.processingOpinion}\n奖金：${amount}元`,
            success: (res) => { if (res.confirm) this.submitConfirm(amount); }
        });
    },

    submitConfirm(amount) {
        wx.showLoading({ title: '提交中...' });
        wx.request({
            url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/confirm',
            method: 'POST',
            header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
            data: { processing_opinion: this.data.processingOpinion, reward_amount: amount },
            success: (res) => {
                wx.hideLoading();
                if (res.data.success) {
                    wx.showToast({ title: '已确认，等待监理', icon: 'success' });
                    setTimeout(() => wx.navigateBack(), 1500);
                } else {
                    wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
                }
            },
            fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
    },

    rejectReport() {
        wx.showModal({
            title: '驳回办结',
            content: '确认要驳回此举报吗？驳回后将直接办结。',
            confirmColor: '#ef4444',
            success: (res) => { if (res.confirm) this.submitReject(); }
        });
    },

    submitReject() {
        wx.showLoading({ title: '处理中...' });
        wx.request({
            url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/confirm',
            method: 'POST',
            header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
            data: { isRejected: true },
            success: (res) => {
                wx.hideLoading();
                if (res.data.success) {
                    wx.showToast({ title: '已驳回', icon: 'success' });
                    setTimeout(() => wx.navigateBack(), 1500);
                } else {
                    wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
                }
            },
            fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
    },

    // ========== 监理确认 ==========
    // 监理确认
    supervisorConfirmReport() {
        if (!this.data.supervisorComment?.trim()) {
            wx.showToast({ title: '请填写监理意见', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '监理确认',
            content: `监理意见：${this.data.supervisorComment}\n\n确认此举报信息准确，同意进行整改？`,
            success: (res) => {
                if (res.confirm) this.submitSupervisorConfirm();
            }
        });
    },

    submitSupervisorConfirm() {
        wx.showLoading({ title: '确认中...' });
        wx.request({
            url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/supervisor-confirm',
            method: 'POST',
            header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
            data: { supervisor_comment: this.data.supervisorComment || '' },
            success: (res) => {
                wx.hideLoading();
                if (res.data.success) {
                    wx.showToast({ title: '监理已确认', icon: 'success' });
                    setTimeout(() => wx.navigateBack(), 1500);
                } else {
                    wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
                }
            },
            fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
    },

    // 监理驳回
    supervisorRejectReport() {
        if (!this.data.supervisorComment?.trim()) {
            wx.showToast({ title: '驳回时必须填写监理意见', icon: 'none' });
            return;
        }

        wx.showModal({
            title: '驳回处理意见',
            content: `监理意见：${this.data.supervisorComment}\n\n确认驳回安全部的处理意见？驳回后将退回安全部重新处理。`,
            confirmColor: '#ef4444',
            success: (res) => {
                if (res.confirm) this.submitSupervisorReject();
            }
        });
    },

    submitSupervisorReject() {
        wx.showLoading({ title: '处理中...' });
        wx.request({
            url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/supervisor-confirm',
            method: 'POST',
            header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
            data: { supervisor_comment: this.data.supervisorComment || '', isRejected: true },
            success: (res) => {
                wx.hideLoading();
                if (res.data.success) {
                    wx.showToast({ title: '已驳回', icon: 'success' });
                    setTimeout(() => wx.navigateBack(), 1500);
                } else {
                    wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
                }
            },
            fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
    },

    // ========== 上传整改照片 ==========
    addRectifiedPhoto() {
        if (this.data.rectifiedImages.length >= 3) {
            wx.showToast({ title: '最多上传3张', icon: 'none' });
            return;
        }
        wx.chooseImage({
            count: 3 - this.data.rectifiedImages.length,
            sizeType: ['compressed'],
            sourceType: ['camera', 'album'],
            success: (res) => {
                this.setData({ rectifiedImages: [...this.data.rectifiedImages, ...res.tempFilePaths].slice(0, 3) });
            }
        });
    },

    removeRectifiedPhoto(e) {
        const index = e.currentTarget.dataset.index;
        const images = [...this.data.rectifiedImages];
        images.splice(index, 1);
        this.setData({ rectifiedImages: images });
    },

    uploadProcessPhotos() {
        if (this.data.rectifiedImages.length === 0) {
            wx.showToast({ title: '请上传整改照片', icon: 'none' });
            return;
        }
        wx.showModal({
            title: '提交整改照片',
            content: '确认提交整改照片？',
            success: (res) => { if (res.confirm) this.submitProcessPhotos(); }
        });
    },

    submitProcessPhotos() {
        wx.showLoading({ title: '上传中...' });

        const uploadPromises = this.data.rectifiedImages.map(imagePath => {
            return new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: app.globalData.baseUrl + '/upload',
                    filePath: imagePath,
                    name: 'file',
                    header: { 'Authorization': 'Bearer ' + app.globalData.token },
                    success: (res) => {
                        try {
                            const data = JSON.parse(res.data);
                            if (data.success) resolve(data.filePath);
                            else reject(new Error(data.message));
                        } catch (err) { reject(err); }
                    },
                    fail: reject
                });
            });
        });

        Promise.all(uploadPromises)
            .then(filePaths => {
                wx.request({
                    url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/upload-photos',
                    method: 'POST',
                    header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
                    data: { rectified_images: filePaths },
                    success: (res) => {
                        wx.hideLoading();
                        if (res.data.success) {
                            wx.showToast({ title: '上传成功', icon: 'success' });
                            setTimeout(() => wx.navigateBack(), 1500);
                        } else {
                            wx.showToast({ title: res.data.message || '上传失败', icon: 'none' });
                        }
                    },
                    fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
                });
            })
            .catch(() => { wx.hideLoading(); wx.showToast({ title: '上传图片失败', icon: 'none' }); });
    },

    // ========== 上传奖金截图 ==========
    addRewardPhoto() {
        if (this.data.rewardImages.length >= 3) {
            wx.showToast({ title: '最多上传3张', icon: 'none' });
            return;
        }
        wx.chooseImage({
            count: 3 - this.data.rewardImages.length,
            sizeType: ['compressed'],
            sourceType: ['camera', 'album'],
            success: (res) => {
                this.setData({ rewardImages: [...this.data.rewardImages, ...res.tempFilePaths].slice(0, 3) });
            }
        });
    },

    removeRewardPhoto(e) {
        const index = e.currentTarget.dataset.index;
        const images = [...this.data.rewardImages];
        images.splice(index, 1);
        this.setData({ rewardImages: images });
    },

    uploadRewardProof() {
        if (this.data.rewardImages.length === 0) {
            wx.showToast({ title: '请上传奖金发放截图', icon: 'none' });
            return;
        }
        wx.showModal({
            title: '完成办结',
            content: '确认已发放奖金并完成办结？',
            success: (res) => { if (res.confirm) this.submitRewardProof(); }
        });
    },

    submitRewardProof() {
        wx.showLoading({ title: '上传中...' });

        const uploadPromises = this.data.rewardImages.map(imagePath => {
            return new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: app.globalData.baseUrl + '/upload',
                    filePath: imagePath,
                    name: 'file',
                    header: { 'Authorization': 'Bearer ' + app.globalData.token },
                    success: (res) => {
                        try {
                            const data = JSON.parse(res.data);
                            if (data.success) resolve(data.filePath);
                            else reject(new Error(data.message));
                        } catch (err) { reject(err); }
                    },
                    fail: reject
                });
            });
        });

        Promise.all(uploadPromises)
            .then(filePaths => {
                wx.request({
                    url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/upload-reward',
                    method: 'POST',
                    header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
                    data: { reward_images: filePaths },
                    success: (res) => {
                        wx.hideLoading();
                        if (res.data.success) {
                            wx.showToast({ title: '办结成功', icon: 'success' });
                            setTimeout(() => wx.navigateBack(), 1500);
                        } else {
                            wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
                        }
                    },
                    fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
                });
            })
            .catch(() => { wx.hideLoading(); wx.showToast({ title: '上传图片失败', icon: 'none' }); });
    }
});
