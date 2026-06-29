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
    // 校验 roomCode 格式
    if (!roomCode || !/^\d{4,6}$/.test(roomCode)) {
      return {
        success: false,
        errMsg: '房间号必须是4-6位数字'
      }
    }

    // 查询房间是否已存在
    const roomRes = await db.collection('rooms').where({
      roomCode: roomCode,
      isDeleted: false
    }).get()

    if (roomRes.data.length > 0) {
      return {
        success: false,
        errMsg: '该房间号已存在，请直接进入'
      }
    }

    // 创建房间
    const now = new Date()
    const roomResult = await db.collection('rooms').add({
      data: {
        roomCode: roomCode,
        name: '小纸条',
        ownerOpenid: openid,
        locked: false,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    })

    const roomId = roomResult._id

    // 添加创建者为房间成员
    await db.collection('room_members').add({
      data: {
        roomId: roomId,
        roomCode: roomCode,
        openid: openid,
        nickName: '我',
        role: 'owner',
        joinedAt: now
      }
    })

    return {
      success: true,
      data: {
        roomId: roomId,
        roomCode: roomCode
      }
    }
  } catch (err) {
    console.error('createRoom error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
