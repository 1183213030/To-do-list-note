Page({
  data: {
    importJson: ''
  },

  onJsonInput(e) {
    this.setData({
      importJson: e.detail.value
    })
  },

  async onConfirmImport() {
    const { importJson } = this.data

    if (!importJson || importJson.trim().length === 0) {
      wx.showToast({
        title: '请输入导入数据',
        icon: 'none'
      })
      return
    }

    let importData
    try {
      importData = JSON.parse(importJson)
    } catch (err) {
      wx.showToast({
        title: 'JSON 格式不正确',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '导入中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'importData',
        data: {
          data: importData
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        const imported = res.result.data.imported
        wx.showModal({
          title: '导入成功',
          content: `已导入：\n清单：${imported.lists} 个\n成员关系：${imported.members} 条\n任务：${imported.tasks} 个`,
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      } else {
        wx.showToast({
          title: res.result.errMsg || '导入失败',
          icon: 'none',
          duration: 3000
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('导入失败', err)
      wx.showToast({
        title: '导入失败',
        icon: 'none'
      })
    }
  },

  onPasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({
          importJson: res.data
        })
        wx.showToast({
          title: '已粘贴',
          icon: 'success'
        })
      }
    })
  }
})
