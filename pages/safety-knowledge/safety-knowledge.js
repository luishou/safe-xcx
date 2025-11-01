// pages/safety-knowledge/safety-knowledge.js
Page({
    data: {
        selectedCategory: '',
        categoryTitle: '',
        showContent: false,
        knowledgeList: []
    },

    onLoad: function (options) {
        console.log('安全知识页面加载');
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
    },

    // 返回上一页
    goBack: function () {
        wx.navigateBack();
    },

    // 显示分类内容
    showCategory: function (e) {
        const category = e.currentTarget.dataset.category;
        console.log('点击分类:', category);

        const categoryNames = {
            'fire': '消防安全',
            'electric': '用电安全',
            'mechanical': '设备安全',
            'height': '高处作业',
            'edge': '临边防护',
            'environment': '环境保护',
            'ppe': '个人防护装备',
            'other': '其他安全'
        };

        // 根据index.html中的安全知识数据
        const knowledgeData = {
            'fire': [
                {
                    id: 1,
                    title: '消防安全基础知识',
                    content: '1. 火灾预防：定期检查电气线路，不超负荷用电，易燃物品远离火源。\n2. 灭火器使用：拔掉保险销，对准火源根部，按下压把进行灭火。\n3. 疏散逃生：熟悉安全出口位置，低姿势沿墙壁逃生，不乘坐电梯。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-15'
                }
            ],
            'electric': [
                {
                    id: 2,
                    title: '用电安全操作规程',
                    content: '1. 湿手不接触电器，防止触电事故。\n2. 定期检查电缆线路，发现破损立即更换。\n3. 使用合格的电气设备，不使用三无产品。\n4. 电气设备要有良好的接地保护。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-14'
                }
            ],
            'mechanical': [
                {
                    id: 3,
                    title: '机械设备安全操作',
                    content: '1. 操作前检查设备状态，确保防护装置完好。\n2. 按照操作规程使用设备，不违规操作。\n3. 设备运行时禁止进行维修保养。\n4. 定期维护保养，确保设备安全运行。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-13'
                }
            ],
            'height': [
                {
                    id: 4,
                    title: '高处作业安全要点',
                    content: '1. 2米以上作业必须系安全带。\n2. 检查脚手架稳固性，确保承重安全。\n3. 恶劣天气禁止高处作业。\n4. 作业工具要系绳防坠落。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-12'
                }
            ],
            'edge': [
                {
                    id: 5,
                    title: '临边防护安全要求',
                    content: '1. 临边作业必须设置防护栏杆。\n2. 防护栏杆高度不低于1.2米。\n3. 设置安全警示标志，禁止无关人员进入。\n4. 定期检查防护设施完好性。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-11'
                }
            ],
            'environment': [
                {
                    id: 6,
                    title: '环境保护措施',
                    content: '1. 施工废弃物分类处理，不随意丢弃。\n2. 控制施工噪音，避免影响周边环境。\n3. 防止水土流失，做好植被保护。\n4. 合理使用资源，减少环境污染。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-10'
                }
            ],
            'ppe': [
                {
                    id: 7,
                    title: '个人防护装备使用',
                    content: '1. 正确佩戴安全帽，系好下颚带。\n2. 穿戴符合标准的防护服装。\n3. 根据作业需要选择合适的防护用品。\n4. 定期检查防护用品完好性。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-09'
                }
            ],
            'other': [
                {
                    id: 8,
                    title: '其他安全注意事项',
                    content: '1. 进入施工现场必须接受安全教育培训。\n2. 熟悉施工现场应急预案和逃生路线。\n3. 发现安全隐患及时报告处理。\n4. 服从安全管理人员指挥和监督。',
                    uploadedBy: '安全环保部',
                    uploadTime: '2024-01-08'
                }
            ]
        };

        this.setData({
            selectedCategory: category,
            categoryTitle: categoryNames[category] || '安全知识',
            knowledgeList: knowledgeData[category] || [],
            showContent: true
        });
    },

    // 关闭分类内容
    closeCategory: function () {
        this.setData({
            selectedCategory: '',
            categoryTitle: '',
            knowledgeList: [],
            showContent: false
        });
    }
});