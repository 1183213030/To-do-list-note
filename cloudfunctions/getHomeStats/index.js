const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取当前用户加入的所有清单ID
    const memberRes = await db.collection('list_members').where({
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: true,
        data: {
          todayCount: 0,
          scheduledCount: 0,
          allCount: 0,
          completedCount: 0,
          flaggedCount: 0
        }
      }
    }

    const listIds = memberRes.data.map(m => m.listId)

    // 获取今天的日期字符串 YYYY-MM-DD
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // 统计今天的事项
    const todayRes = await db.collection('tasks').where({
      listId: _.in(listIds),
      date: todayStr,
      isDeleted: false
    }).count()

    // 统计已计划的事项（有日期）
    const scheduledRes = await db.collection('tasks').where({
      listId: _.in(listIds),
      date: _.neq('').and(_.exists(true)),
      isDeleted: false
    }).count()

    // 统计全部事项
    const allRes = await db.collection('tasks').where({
      listId: _.in(listIds),
      isDeleted: false
    }).count()

    // 统计已完成事项
    const completedRes = await db.collection('tasks').where({
      listId: _.in(listIds),
      status: 'done',
      isDeleted: false
    }).count()

    // 统计重要事项
    const flaggedRes = await db.collection('tasks').where({
      listId: _.in(listIds),
      flagged: true,
      isDeleted: false
    }).count()

    return {
      success: true,
      data: {
        todayCount: todayRes.total,
        scheduledCount: scheduledRes.total,
        allCount: allRes.total,
        completedCount: completedRes.total,
        flaggedCount: flaggedRes.total
      }
    }
  } catch (err) {
    console.error('getHomeStats error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
