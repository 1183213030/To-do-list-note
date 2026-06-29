Page({
  data: {
    userInfo: null,
    openid: '',
    roomCode: '',
    rooms: [],
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (this.data.openid) {
      this.loadRooms()
    }
  },

  async loadData() {
    try {
      const app = getApp()
      const data = await app.login()

      if (data) {
        this.setData({
          userInfo: data.userInfo,
          openid: data.openid
        })

        await this.loadRooms()
      }
    } catch (err) {
      console.error('加载失败', err)
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  async loadRooms() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyRooms'
      })

      if (res.result.success) {
        this.setData({
          rooms: res.result.data.rooms
        })
      }
    } catch (err) {
      console.error('加载房间失败', err)
    }
  },

  onRoomCodeInput(e) {
    this.setData({
      roomCode: e.detail.value
    })
  },

  async onEnterRoom() {
    const { roomCode } = this.data

    if (!roomCode || roomCode.trim().length === 0) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/room-detail/room-detail?roomCode=${roomCode.trim()}`
    })
  },

  async onCreateRoom() {
    const { roomCode } = this.data

    if (!roomCode || roomCode.trim().length === 0) {
      // 生成随机6位房间号
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
      this.setData({
        roomCode: randomCode
      })
      
      wx.showModal({
        title: '创建房间',
        content: `将创建房间号：${randomCode}`,
        success: (res) => {
          if (res.confirm) {
            this.createRoomWithCode(randomCode)
          }
        }
      })
      return
    }

    if (!/^\d{4,6}$/.test(roomCode.trim())) {
      wx.showToast({
        title: '房间号必须是4-6位数字',
        icon: 'none'
      })
      return
    }

    this.createRoomWithCode(roomCode.trim())
  },

  async createRoomWithCode(code) {
    wx.showLoading({ title: '创建中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'createRoom',
        data: { roomCode: code }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/room-detail/room-detail?roomCode=${code}`
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
      console.error('创建房间失败', err)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
    }
  },

  onRoomTap(e) {
    const { roomcode } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/room-detail/room-detail?roomCode=${roomcode}`
    })
  },

  onPullDownRefresh() {
    this.loadRooms().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
