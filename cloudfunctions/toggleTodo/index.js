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

    const member = memberRes.data[0]
    const now = new Date()

    // 切换完成状态
    if (todo.done) {
      // 取消完成
      await db.collection('todos').doc(todoId).update({
        data: {
          done: false,
          doneBy: '',
          doneByName: '',
          doneAt: null,
          updatedAt: now
        }
      })
    } else {
      // 标记完成
      await db.collection('todos').doc(todoId).update({
        data: {
          done: true,
          doneBy: openid,
          doneByName: member.nickName || '我',
          doneAt: now,
          updatedAt: now
        }
      })
    }

    return {
      success: true,
      data: {
        done: !todo.done
      }
    }
  } catch (err) {
    console.error('toggleTodo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
