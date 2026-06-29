Page({
  data: {
    listId: '',
    listInfo: null,
    tasks: [],
    pendingTasks: [],
    doneTasks: [],
    loading: true
  },

  onLoad(options) {
    if (options.listId) {
      this.setData({ listId: options.listId })
      this.loadData()
    }
  },

  onShow() {
    if (this.data.listId && !this.data.loading) {
      this.loadTasks()
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const app = getApp()
      await app.login()

      // 获取清单信息
      const infoRes = await wx.cloud.callFunction({
        name: 'getListInfo',
        data: { listId: this.data.listId }
      })

      if (!infoRes.result.success) {
        wx.showToast({
          title: infoRes.result.errMsg,
          icon: 'none'
        })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const listData = infoRes.result.data

      if (!listData.isMember) {
        wx.redirectTo({
          url: `/pages/join/join?listId=${this.data.listId}`
        })
        return
      }

      this.setData({
        listInfo: listData
      })

      wx.setNavigationBarTitle({
        title: listData.list.name
      })

      await this.loadTasks()
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

  async loadTasks() {
    try {
      const tasksRes = await wx.cloud.callFunction({
        name: 'getTasks',
        data: {
          listId: this.data.listId,
          filter: 'all'
        }
      })

      if (tasksRes.result.success) {
        const tasks = tasksRes.result.data.tasks
        const pendingTasks = tasks.filter(t => t.status === 'pending')
        const doneTasks = tasks.filter(t => t.status === 'done')

        this.setData({
          tasks: tasks,
          pendingTasks: pendingTasks,
          doneTasks: doneTasks
        })
      }
    } catch (err) {
      console.error('加载任务失败', err)
    }
  },

  onAddTask() {
    wx.navigateTo({
      url: `/pages/task-edit/task-edit?listId=${this.data.listId}`
    })
  },

  async onToggleDone(e) {
    const taskId = e.currentTarget.dataset.id
    const task = this.data.tasks.find(t => t._id === taskId)
    
    if (!task) return

    // 乐观更新UI
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    const updatedTasks = this.data.tasks.map(t => {
      if (t._id === taskId) {
        return { ...t, status: newStatus }
      }
      return t
    })

    const pendingTasks = updatedTasks.filter(t => t.status === 'pending')
    const doneTasks = updatedTasks.filter(t => t.status === 'done')

    this.setData({
      tasks: updatedTasks,
      pendingTasks: pendingTasks,
      doneTasks: doneTasks
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'toggleTaskDone',
        data: { taskId: taskId }
      })

      if (!res.result.success) {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
        // 恢复原状态
        this.loadTasks()
      }
    } catch (err) {
      console.error('切换状态失败', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
      this.loadTasks()
    }
  },

  onTaskTap(e) {
    const taskId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-edit/task-edit?listId=${this.data.listId}&taskId=${taskId}`
    })
  },

  onTaskLongPress(e) {
    const taskId = e.currentTarget.dataset.id
    
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({
            url: `/pages/task-edit/task-edit?listId=${this.data.listId}&taskId=${taskId}`
          })
        } else if (res.tapIndex === 1) {
          this.deleteTask(taskId)
        }
      }
    })
  },

  deleteTask(taskId) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' })

          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteTask',
              data: { taskId: taskId }
            })

            wx.hideLoading()

            if (result.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadTasks()
            } else {
              wx.showToast({
                title: result.result.errMsg,
                icon: 'none'
              })
            }
          } catch (err) {
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: `邀请你加入「${this.data.listInfo.list.name}」`,
      path: `/pages/join/join?listId=${this.data.listId}`
    }
  }
})
