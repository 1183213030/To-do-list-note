const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { todoId } = event

  try {
    // 查询小纸条
    const todoRes = await db.collection('todos').doc(todoId).get()

    if (!todoRes.data) {
      return {
        success: false,
        errMsg: '小纸条不存在'
      }
    }

    const todo = todoRes.data

    // 校验当前用户是否是房间成员
    const memberRes = await db.collection('room_members').where({
      roomId: todo.roomId,
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: false,
        errMsg: '你不是该房间成员'
      }
    }

    // 切换置顶状态
    await db.collection('todos').doc(todoId).update({
      data: {
        pinned: !todo.pinned,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      data: {
        pinned: !todo.pinned
      }
    }
  } catch (err) {
    console.error('pinTodo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
