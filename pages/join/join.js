Page({
  data: {
    listId: '',
    listInfo: null,
    loading: true,
    isMember: false
  },

  onLoad(options) {
    if (options.listId) {
      this.setData({ listId: options.listId })
      this.loadData()
    }
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const app = getApp()
      await app.login()

      const res = await wx.cloud.callFunction({
        name: 'getListInfo',
        data: { listId: this.data.listId }
      })

      if (!res.result.success) {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
        return
      }

      const data = res.result.data
      this.setData({
        listInfo: data,
        isMember: data.isMember
      })

      if (data.isMember) {
        wx.setNavigationBarTitle({
          title: '已加入'
        })
      }
    } catch (err) {
      console.error('加载失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onJoinList() {
    wx.showLoading({ title: '加入中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'joinList',
        data: { listId: this.data.listId }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '加入成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/list-detail/list-detail?listId=${this.data.listId}`
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加入失败', err)
      wx.showToast({
        title: '加入失败',
        icon: 'none'
      })
    }
  },

  onGoToList() {
    wx.redirectTo({
      url: `/pages/list-detail/list-detail?listId=${this.data.listId}`
    })
  }
})
