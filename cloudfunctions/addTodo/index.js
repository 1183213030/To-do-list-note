const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { roomCode, text } = event

  try {
    // 校验 text
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

    // 查询房间
    const roomRes = await db.collection('rooms').where({
      roomCode: roomCode,
      isDeleted: false
    }).get()

    if (roomRes.data.length === 0) {
      return {
        success: false,
        errMsg: '房间不存在'
      }
    }

    const room = roomRes.data[0]

    // 校验当前用户是否是房间成员
    const memberRes = await db.collection('room_members').where({
      roomId: room._id,
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: false,
        errMsg: '你不是该房间成员'
      }
    }

    const member = memberRes.data[0]

    // 创建小纸条
    const now = new Date()
    const result = await db.collection('todos').add({
      data: {
        roomId: room._id,
        roomCode: room.roomCode,
        text: text.trim(),
        done: false,
        pinned: false,
        creatorOpenid: openid,
        creatorName: member.nickName || '我',
        doneBy: '',
        doneByName: '',
        createdAt: now,
        updatedAt: now,
        doneAt: null,
        isDeleted: false
      }
    })

    return {
      success: true,
      data: {
        todoId: result._id
      }
    }
  } catch (err) {
    console.error('addTodo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
