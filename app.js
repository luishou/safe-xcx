// app.js
App({
  globalData: {
    userInfo: null,  // 微信用户信息
    currentUser: null,
    currentSection: null,
    sections: [], // 标段列表
    notifications: [],
    baseUrl: 'http://localhost:3000/api', // 后端接口地址
    token: null, // JWT token
    db: {
      users: {
        'employee': {
          name: '员工',
          role: 'employee',
          department: '生产车间',
          avatar: '👷',
          phone: '138****1234'
        },
        'manager': {
          name: '安全环保部',
          role: 'manager',
          department: '安全部门',
          avatar: '👩‍💼',
          phone: '137****9012'
        }
      },
      safetyKnowledge: [
        {
          id: 1,
          category: 'fire',
          title: '消防安全基础知识',
          content: '1. 火灾预防：定期检查电气线路，不超负荷用电，易燃物品远离火源。\n2. 灭火器使用：拔掉保险销，对准火源根部，按下压把进行灭火。\n3. 疏散逃生：熟悉安全出口位置，低姿势沿墙壁逃生，不乘坐电梯。',
          uploadedBy: 'admin',
          uploadTime: new Date().toISOString(),
          fileType: 'text'
        },
        {
          id: 2,
          category: 'electric',
          title: '用电安全操作规程',
          content: '1. 湿手不接触电器，防止触电事故。\n2. 定期检查电缆线路，发现破损立即更换。\n3. 使用合格的电气设备，不使用三无产品。\n4. 电气设备要有良好的接地保护。',
          uploadedBy: 'admin',
          uploadTime: new Date().toISOString(),
          fileType: 'text'
        }
      ],
      nextKnowledgeId: 3,
      safetyDocuments: [
        {
          id: 1,
          title: '安全生产管理制度',
          fileName: 'safety_management_2024.pdf',
          fileSize: 2048576,
          fileType: 'application/pdf',
          uploadTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          uploadedBy: '安全环保部'
        }
      ],
      nextDocumentId: 2,
      reports: [
        {
          id: 1,
          reporter: '员工',
          reporterId: 'employee',
          description: '生产车间B区消防通道被纸箱堵塞，存在严重安全隐患。',
          hazardType: 'fire',
          severity: 'high',
          location: '生产车间B区东侧消防通道',
          initialImages: ['https://placehold.co/600x400/fecaca/ef4444?text=消防通道堵塞'],
          status: 'submitted',
          assignedTo: null,
          assignedToId: null,
          plan: null,
          rectifiedImages: [],
          history: [
            { user: '员工', action: '提交了重大隐患举报', timestamp: new Date(Date.now() - 1800000).toLocaleString() }
          ],
          createdAt: new Date(Date.now() - 1800000),
          feedback: null,
          section: 'TJ01'
        },
        {
          id: 2,
          reporter: '员工',
          reporterId: 'employee',
          description: '仓库区域照明设备损坏，多处灯管不亮，存在作业安全隐患。',
          hazardType: 'other',
          severity: 'medium',
          location: '仓库A区',
          initialImages: ['https://placehold.co/600x400/fde68a/f59e0b?text=照明损坏'],
          status: 'submitted',
          assignedTo: null,
          assignedToId: null,
          plan: null,
          rectifiedImages: [],
          history: [
            { user: '员工', action: '提交了其他隐患举报', timestamp: new Date(Date.now() - 900000).toLocaleString() }
          ],
          createdAt: new Date(Date.now() - 900000),
          feedback: null,
          section: 'TJ01'
        }
      ],
      nextReportId: 3
    }
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化用户信息
    this.initUserInfo()

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    // 加载标段配置
    this.loadSections()
  },

  // 初始化用户信息
  initUserInfo() {
    try {
      // 尝试从本地存储获取token和用户信息
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');

      if (token) {
        this.globalData.token = token;
        console.log('从本地存储恢复token');

        // 验证token是否有效
        this.verifyToken(token);
      }

      if (userInfo && userInfo.nickName) {
        this.globalData.userInfo = userInfo;
        console.log('从本地存储恢复用户信息:', userInfo.nickName);
      }
    } catch (error) {
      console.error('初始化用户信息失败:', error);
    }
  },

  // 验证token
  verifyToken(token) {
    wx.request({
      url: this.globalData.baseUrl + '/auth/verify',
      method: 'POST',
      data: { token },
      success: (res) => {
        if (res.data.success) {
          console.log('Token验证成功');
          this.globalData.currentUser = res.data.data.user;
        } else {
          console.log('Token验证失败，清除本地存储');
          wx.removeStorageSync('token');
          this.globalData.token = null;
        }
      },
      fail: (err) => {
        console.error('Token验证请求失败:', err);
        wx.removeStorageSync('token');
        this.globalData.token = null;
      }
    });
  },

  // 获取标段配置
  loadSections() {
    const url = this.globalData.baseUrl + '/section/list';
    console.log('开始获取标段配置，URL:', url);

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('标段接口返回原始数据:', res);

        if (res.data && res.data.success) {
          console.log('获取标段配置成功:', res.data.data);
          this.globalData.sections = res.data.data;
        } else {
          console.error('获取标段配置失败:', res.data?.message || '未知错误');
          // 使用默认标段配置
          this.globalData.sections = [
            { id: 1, section_code: 'TJ01', section_name: '第TJ01标段', sort_order: 1 },
            { id: 2, section_code: 'TJ02', section_name: '第TJ02标段', sort_order: 2 }
          ];
          console.log('使用默认标段配置');
        }
      },
      fail: (err) => {
        console.error('获取标段配置请求失败:', err);
        // 使用默认标段配置
        this.globalData.sections = [
          { id: 1, section_code: 'TJ01', section_name: '第TJ01标段', sort_order: 1 },
          { id: 2, section_code: 'TJ02', section_name: '第TJ02标段', sort_order: 2 }
        ];
        console.log('网络失败，使用默认标段配置');
      }
    });
  },

  onShow() {
    // 小程序启动，或从后台进入前台显示
  },

  onHide() {
    // 小程序从前台进入后台
  },

  onError(msg) {
    console.log(msg)
  }
})