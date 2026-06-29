Page({
  data: {
    listId: '',
    taskId: '',
    isEdit: false,
    title: '',
    content: '',
    date: '',
    flagged: false,
    priority: 'none'
  },

  onLoad(options) {
    if (options.listId) {
      this.setData({ listId: options.listId })
    }

    if (options.taskId) {
      this.setData({
        taskId: options.taskId,
        isEdit: true
      })
      this.loadTask()
    }
  },

  async loadTask() {
    wx.showLoading({ title: '加载中' })

    try {
      const tasksRes = await wx.cloud.callFunction({
        name: 'getTasks',
        data: {
          listId: this.data.listId,
          filter: 'all'
        }
      })

      wx.hideLoading()

      if (tasksRes.result.success) {
        const task = tasksRes.result.data.tasks.find(t => t._id === this.data.taskId)
        if (task) {
          this.setData({
            title: task.title,
            content: task.content || '',
            date: task.date || '',
            flagged: task.flagged || false,
            priority: task.priority || 'none'
          })
        }
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加载任务失败', err)
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onCancel() {
    wx.navigateBack()
  },

  async onSave() {
    const { title, content, date, flagged, priority, listId, taskId, isEdit } = this.data

    if (!title || title.trim().length === 0) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    if (title.length > 100) {
      wx.showToast({
        title: '标题不能超过100个字',
        icon: 'none'
      })
      return
    }

    if (content.length > 500) {
      wx.showToast({
        title: '备注不能超过500个字',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: isEdit ? '保存中' : '创建中' })

    try {
      const functionName = isEdit ? 'updateTask' : 'createTask'
      const data = {
        listId: listId,
        title: title.trim(),
        content: content,
        date: date,
        flagged: flagged,
        priority: priority
      }

      if (isEdit) {
        data.taskId = taskId
      }

      const res = await wx.cloud.callFunction({
        name: functionName,
        data: data
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: isEdit ? '保存成功' : '创建成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' })

          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteTask',
              data: { taskId: this.data.taskId }
            })

            wx.hideLoading()

            if (result.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
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
  }
})
