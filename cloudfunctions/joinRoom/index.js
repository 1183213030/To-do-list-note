const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { roomCode } = event

  try {
    // 校验 roomCode
    if (!roomCode || !/^\d{4,6}$/.test(roomCode)) {
      return {
        success: false,
        errMsg: '房间号格式不正确'
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
        errMsg: '房间不存在或已删除'
      }
    }

    const room = roomRes.data[0]

    // 查询当前用户是否已经是成员
    const memberRes = await db.collection('room_members').where({
      roomId: room._id,
      openid: openid
    }).get()

    if (memberRes.data.length > 0) {
      return {
        success: true,
        data: {
          roomId: room._id,
          roomCode: room.roomCode,
          message: '你已经是房间成员了'
        }
      }
    }

    // 检查房间是否锁定
    if (room.locked) {
      return {
        success: false,
        errMsg: '房间已锁定，无法加入'
      }
    }

    // 加入房间
    await db.collection('room_members').add({
      data: {
        roomId: room._id,
        roomCode: room.roomCode,
        openid: openid,
        nickName: '对象',
        role: 'member',
        joinedAt: new Date()
      }
    })

    return {
      success: true,
      data: {
        roomId: room._id,
        roomCode: room.roomCode
      }
    }
  } catch (err) {
    console.error('joinRoom error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
