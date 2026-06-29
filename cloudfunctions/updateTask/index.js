const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { taskId, title, content, date, flagged, priority } = event

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

    // 校验参数
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          success: false,
          errMsg: '标题不能为空'
        }
      }
      if (title.length > 100) {
        return {
          success: false,
          errMsg: '标题不能超过100个字'
        }
      }
    }

    if (content !== undefined && content.length > 500) {
      return {
        success: false,
        errMsg: '备注不能超过500个字'
      }
    }

    // 构建更新数据
    const updateData = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content
    if (date !== undefined) updateData.date = date
    if (flagged !== undefined) updateData.flagged = flagged
    if (priority !== undefined) updateData.priority = priority

    // 更新任务
    await db.collection('tasks').doc(taskId).update({
      data: updateData
    })

    return {
      success: true,
      data: {
        message: '更新成功'
      }
    }
  } catch (err) {
    console.error('updateTask error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
