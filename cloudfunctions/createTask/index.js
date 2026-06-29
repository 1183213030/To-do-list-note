const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { listId, title, content, date, flagged, priority } = event

  try {
    // 校验参数
    if (!listId) {
      return {
        success: false,
        errMsg: '清单ID不能为空'
      }
    }

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

    if (content && content.length > 500) {
      return {
        success: false,
        errMsg: '备注不能超过500个字'
      }
    }

    // 校验当前用户是否是清单成员
    const memberRes = await db.collection('list_members').where({
      listId: listId,
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: false,
        errMsg: '你不是该清单的成员'
      }
    }

    const now = new Date()

    // 创建任务
    const taskRes = await db.collection('tasks').add({
      data: {
        listId: listId,
        title: title.trim(),
        content: content || '',
        date: date || '',
        creatorOpenid: openid,
        status: 'pending',
        doneBy: '',
        doneAt: null,
        flagged: flagged || false,
        priority: priority || 'none',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    })

    return {
      success: true,
      data: {
        taskId: taskRes._id
      }
    }
  } catch (err) {
    console.error('createTask error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
