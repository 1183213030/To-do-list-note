const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { todoId, text } = event

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

    // 校验文本
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        errMsg: '小纸条内容不能为空'
      }
    }

    if (text.length > 200) {
      return {
        success: false,
        errMsg: '小纸条内容最多200字'
      }
    }

    // 更新小纸条
    await db.collection('todos').doc(todoId).update({
      data: {
        text: text.trim(),
        updatedAt: new Date()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('updateTodo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
