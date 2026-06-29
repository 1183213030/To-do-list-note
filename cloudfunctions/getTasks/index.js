const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { listId, filter } = event

  try {
    if (!listId) {
      return {
        success: false,
        errMsg: '清单ID不能为空'
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

    // 构建查询条件
    let queryCondition = {
      listId: listId,
      isDeleted: false
    }

    // 根据 filter 添加过滤条件
    if (filter === 'pending') {
      queryCondition.status = 'pending'
    } else if (filter === 'done') {
      queryCondition.status = 'done'
    } else if (filter === 'today') {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      queryCondition.date = todayStr
    } else if (filter === 'scheduled') {
      queryCondition.date = _.neq('').and(_.exists(true))
    } else if (filter === 'flagged') {
      queryCondition.flagged = true
    }

    // 查询任务
    const tasksRes = await db.collection('tasks')
      .where(queryCondition)
      .orderBy('status', 'asc')
      .orderBy('createdAt', 'desc')
      .get()

    // 简单排序：未完成在前，flagged 靠前
    const tasks = tasksRes.data.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1
      }
      if (a.flagged !== b.flagged) {
        return a.flagged ? -1 : 1
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return {
      success: true,
      data: {
        tasks: tasks
      }
    }
  } catch (err) {
    console.error('getTasks error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
