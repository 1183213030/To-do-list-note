const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { taskId } = event

  try {
    if (!taskId) {
      return {
        success: false,
        errMsg: '任务ID不能为空'
      }
    }

    // 查询任务
    const taskRes = await db.collection('tasks').doc(taskId).get()
    
    if (!taskRes.data || taskRes.data.isDeleted) {
      return {
        success: false,
        errMsg: '任务不存在或已删除'
      }
    }

    const task = taskRes.data

    // 校验当前用户是否是清单成员
    const memberRes = await db.collection('list_members').where({
      listId: task.listId,
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: false,
        errMsg: '你不是该清单的成员'
      }
    }

    // 切换状态
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    }

    if (newStatus === 'done') {
      updateData.doneBy = openid
      updateData.doneAt = new Date()
    } else {
      updateData.doneBy = ''
      updateData.doneAt = null
    }

    // 更新任务
    await db.collection('tasks').doc(taskId).update({
      data: updateData
    })

    return {
      success: true,
      data: {
        newStatus: newStatus
      }
    }
  } catch (err) {
    console.error('toggleTaskDone error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
