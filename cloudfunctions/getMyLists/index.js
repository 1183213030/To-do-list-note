const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取当前用户加入的所有清单
    const memberRes = await db.collection('list_members').where({
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: true,
        data: {
          lists: []
        }
      }
    }

    const listIds = memberRes.data.map(m => m.listId)
    const memberMap = {}
    memberRes.data.forEach(m => {
      memberMap[m.listId] = m.role
    })

    // 获取清单信息
    const listsRes = await db.collection('lists').where({
      _id: db.command.in(listIds),
      isDeleted: false
    }).get()

    // 统计每个清单的未完成事项数量和成员数量
    const lists = await Promise.all(listsRes.data.map(async (list) => {
      // 统计未完成事项
      const undoneRes = await db.collection('tasks').where({
        listId: list._id,
        status: 'pending',
        isDeleted: false
      }).count()

      // 统计成员数量
      const memberCountRes = await db.collection('list_members').where({
        listId: list._id
      }).count()

      return {
        _id: list._id,
        name: list.name,
        color: list.color,
        icon: list.icon,
        role: memberMap[list._id],
        undoneCount: undoneRes.total,
        memberCount: memberCountRes.total
      }
    }))

    return {
      success: true,
      data: {
        lists: lists
      }
    }
  } catch (err) {
    console.error('getMyLists error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
