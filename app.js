// app.js
App({
  globalData: {
    userInfo: null,
    currentUser: null,
    currentSection: null,
    sections: [],
    notifications: [],
    baseUrl: 'http://localhost:3300/api',
    //baseUrl: 'https://safe.sulei.xyz/api', 
    token: null,  
    isVerified: false,
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
    try {
      const logs = wx.getStorageSync('logs') || []
      logs.unshift(Date.now())
      if (logs.length > 50) {
        logs.splice(50)
      }
      wx.setStorageSync('logs', logs)
    } catch (error) {
      console.warn('日志存储失败:', error)
    }

    this.initUserInfo()
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    this.loadSections()
  },

  initUserInfo() {
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');

      if (token) {
        this.globalData.token = token;
        this.verifyToken(token);
      }

      if (userInfo && userInfo.nickName) {
        this.globalData.userInfo = userInfo;
      }
    } catch (error) {
      // 初始化失败静默处理
    }
  },

  verifyToken(token) {
    wx.request({
      url: this.globalData.baseUrl + '/auth/verify',
      method: 'POST',
      data: { token },
      success: (res) => {
        if (res.data?.success) {
          const user = res.data.data.user;
          this.globalData.currentUser = {
            ...user,
            name: user.nickName || user.name,
            nickName: user.nickName || user.name,
            department: user.department || '未设置部门',
            avatar: user.avatarUrl || user.avatar || '👷',
            avatarUrl: user.avatarUrl || user.avatar || '👷',
            managed_sections: user.managed_sections,
            is_verified: user.is_verified
          };
          this.globalData.isVerified = user.is_verified === 1 || user.is_verified === true;
        } else {
          wx.removeStorageSync('token');
          this.globalData.token = null;
        }
      },
      fail: () => {
        wx.removeStorageSync('token');
        this.globalData.token = null;
      }
    });
  },

  loadSections() {
    wx.request({
      url: this.globalData.baseUrl + '/section/list',
      method: 'GET',
      success: (res) => {
        if (res.data?.success) {
          this.globalData.sections = res.data.data;
        } else {
          this.globalData.sections = [
            { id: 1, section_code: 'TJ01', section_name: '第TJ01标段', sort_order: 1 },
            { id: 2, section_code: 'TJ02', section_name: '第TJ02标段', sort_order: 2 }
          ];
        }
      },
      fail: () => {
        this.globalData.sections = [
          { id: 1, section_code: 'TJ01', section_name: '第TJ01标段', sort_order: 1 },
          { id: 2, section_code: 'TJ02', section_name: '第TJ02标段', sort_order: 2 }
        ];
      }
    });
  },

  onShow() { },
  onHide() { },
  onError(msg) { }
})