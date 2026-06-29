const util = require('../../utils/util.js')

Page({
  data: {
    roomCode: '',
    roomInfo: null,
    isMember: false,
    isOwner: false,
    memberNames: '',
    pendingCount: 0,
    completedCount: 0,
    pendingTodos: [],
    completedTodos: [],
    inputText: '',
    loading: true
  },

  onLoad(options) {
    if (options.roomCode) {
      this.setData({
        roomCode: options.roomCode
      })
      this.loadRoomData()
    }
  },

  onShow() {
    if (this.data.roomCode && !this.data.loading) {
      this.loadTodos()
    }
  },

  async loadRoomData() {
    wx.showLoading({ title: '加载中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getRoomInfo',
        data: { roomCode: this.data.roomCode }
      })

      wx.hideLoading()

      if (res.result.success) {
        const data = res.result.data
        
        this.setData({
          roomInfo: data.room,
          isMember: data.isMember,
          isOwner: data.isOwner,
          memberNames: data.members,
          pendingCount: data.pendingCount,
          completedCount: data.completedCount,
          loading: false
        })

        wx.setNavigationBarTitle({
          title: `房间 ${this.data.roomCode}`
        })

        if (data.isMember) {
          this.loadTodos()
        }
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加载房间信息失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  async loadTodos() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getTodos',
        data: { roomId: this.data.roomInfo.roomId }
      })

      if (res.result.success) {
        const todos = res.result.data.todos

        const pending = todos
          .filter(t => !t.done)
          .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            return new Date(b.createdAt) - new Date(a.createdAt)
          })
          .map(t => ({
            ...t,
            createdAt: util.formatTime(new Date(t.createdAt))
          }))

        const completed = todos
          .filter(t => t.done)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .map(t => ({
            ...t,
            createdAt: util.formatTime(new Date(t.createdAt))
          }))

        this.setData({
          pendingTodos: pending,
          completedTodos: completed,
          pendingCount: pending.length,
          completedCount: completed.length
        })
      }
    } catch (err) {
      console.error('加载小纸条失败', err)
    }
  },

  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  async onAddTodo() {
    const { inputText, roomInfo } = this.data

    if (!inputText || inputText.trim().length === 0) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '添加中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'addTodo',
        data: {
          roomId: roomInfo.roomId,
          text: inputText.trim()
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        this.setData({
          inputText: ''
        })
        
        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1000
        })

        this.loadTodos()
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('添加小纸条失败', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    }
  },

  async onToggleTodo(e) {
    const { id } = e.currentTarget.dataset

    try {
      const res = await wx.cloud.callFunction({
        name: 'toggleTodo',
        data: { todoId: id }
      })

      if (res.result.success) {
        this.loadTodos()
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('切换状态失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  async onPinTodo(e) {
    const { id } = e.currentTarget.dataset

    try {
      const res = await wx.cloud.callFunction({
        name: 'pinTodo',
        data: { todoId: id }
      })

      if (res.result.success) {
        this.loadTodos()
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('置顶失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  async onDeleteTodo(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteTodo',
              data: { todoId: id }
            })

            if (result.result.success) {
              wx.showToast({
                title: '已删除',
                icon: 'success',
                duration: 1000
              })
              this.loadTodos()
            } else {
              wx.showToast({
                title: result.result.errMsg,
                icon: 'none'
              })
            }
          } catch (err) {
            console.error('删除失败', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  async onJoinRoom() {
    wx.showLoading({ title: '加入中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'joinRoom',
        data: { roomCode: this.data.roomCode }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: '加入成功',
          icon: 'success'
        })

        setTimeout(() => {
          this.loadRoomData()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加入房间失败', err)
      wx.showToast({
        title: '加入失败',
        icon: 'none'
      })
    }
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadRoomData(),
      this.loadTodos()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
