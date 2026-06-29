const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取当前用户信息
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    // 获取当前用户加入的所有清单
    const memberRes = await db.collection('list_members').where({
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: true,
        data: {
          app: 'together-todo',
          version: 1,
          exportedAt: new Date(),
          data: {
            users: userRes.data,
            lists: [],
            list_members: [],
            tasks: []
          }
        }
      }
    }

    const listIds = memberRes.data.map(m => m.listId)

    // 获取清单信息
    const listsRes = await db.collection('lists').where({
      _id: db.command.in(listIds)
    }).get()

    // 获取所有任务
    const tasksRes = await db.collection('tasks').where({
      listId: db.command.in(listIds)
    }).get()

    // 构建导出数据
    const exportData = {
      app: 'together-todo',
      version: 1,
      exportedAt: new Date(),
      data: {
        users: userRes.data,
        lists: listsRes.data,
        list_members: memberRes.data,
        tasks: tasksRes.data
      }
    }

    return {
      success: true,
      data: exportData
    }
  } catch (err) {
    console.error('exportData error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
