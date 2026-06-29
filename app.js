App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // 此处填入你的云开发环境 ID，参见 README.md
        env: 'your-env-id',
        traceUser: true
      })
    }

    // 全局数据
    this.globalData = {
      userInfo: null,
      openid: null
    }
  },

  // 全局登录方法
  async login() {
    if (this.globalData.openid) {
      return this.globalData
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'login'
      })
      
      if (res.result.success) {
        this.globalData.openid = res.result.data.openid
        this.globalData.userInfo = res.result.data.userInfo
        return this.globalData
      }
    } catch (err) {
      console.error('登录失败', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
    return null
  }
})
