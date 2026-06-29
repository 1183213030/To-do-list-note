Page({
  data: {
    userInfo: null,
    openid: '',
    stats: {
      listCount: 0,
      taskCount: 0
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (this.data.openid) {
      this.loadStats()
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

        await this.loadStats()
      }
    } catch (err) {
      console.error('加载失败', err)
    }
  },

  async loadStats() {
    try {
      const listsRes = await wx.cloud.callFunction({
        name: 'getMyLists'
      })

      const statsRes = await wx.cloud.callFunction({
        name: 'getHomeStats'
      })

      if (listsRes.result.success) {
        const listCount = listsRes.result.data.lists.length
        this.setData({
          'stats.listCount': listCount
        })
      }

      if (statsRes.result.success) {
        const taskCount = statsRes.result.data.allCount
        this.setData({
          'stats.taskCount': taskCount
        })
      }
    } catch (err) {
      console.error('加载统计失败', err)
    }
  },

  async onExportData() {
    wx.showLoading({ title: '导出中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'exportData'
      })

      wx.hideLoading()

      if (res.result.success) {
        const jsonStr = JSON.stringify(res.result.data, null, 2)
        
        // 复制到剪贴板
        wx.setClipboardData({
          data: jsonStr,
          success: () => {
            wx.showModal({
              title: '导出成功',
              content: '数据已复制到剪贴板，请妥善保存。\n\n导出内容包括：\n- 你加入的所有清单\n- 清单中的所有任务\n- 成员关系\n\n注意：此功能用于未来数据迁移，请勿随意分享导出数据。',
              showCancel: false,
              confirmText: '知道了'
            })
          }
        })
      } else {
        wx.showToast({
          title: res.result.errMsg || '导出失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('导出失败', err)
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    }
  },

  onImportData() {
    wx.showModal({
      title: '导入数据',
      content: '请确保导入的数据是从「一起待办」导出的合法 JSON 数据。\n\n导入过程会：\n1. 校验数据格式\n2. 只导入你有权限的数据\n3. 已存在的数据会根据时间戳判断是否更新\n\n继续导入？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/import-data/import-data'
          })
        }
      }
    })
  },

  onClearCache() {
    wx.showModal({
      title: '确认清除',
      content: '将清除本地缓存数据（不会删除云端数据）',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于一起待办',
      content: '一起待办是一个简洁的共享清单工具，用于记录日常待办、生活事项和共同计划。\n\n版本：1.0.0\n模式：体验版私用\n\n特点：\n- 无广告、无付费\n- 数据云端同步\n- 支持数据导出/导入\n- 仅供私人使用\n\n免费云环境活动截止 2026 年 12 月 31 日',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
