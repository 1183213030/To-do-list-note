const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询当前用户加入的房间
    const memberRes = await db.collection('room_members').where({
      openid: openid
    }).get()

    if (memberRes.data.length === 0) {
      return {
        success: true,
        data: {
          rooms: []
        }
      }
    }

    const roomIds = memberRes.data.map(m => m.roomId)

    // 查询房间信息
    const roomsRes = await db.collection('rooms').where({
      _id: db.command.in(roomIds),
      isDeleted: false
    }).get()

    // 为每个房间统计数据
    const rooms = await Promise.all(roomsRes.data.map(async (room) => {
      // 统计未完成的小纸条数量
      const pendingRes = await db.collection('todos').where({
        roomId: room._id,
        done: false,
        isDeleted: false
      }).count()

      // 查询房间成员
      const membersRes = await db.collection('room_members').where({
        roomId: room._id
      }).get()

      const memberNames = membersRes.data.map(m => m.nickName || '成员').join('、')

      return {
        roomId: room._id,
        roomCode: room.roomCode,
        name: room.name,
        locked: room.locked,
        pendingCount: pendingRes.total,
        memberCount: membersRes.data.length,
        members: memberNames
      }
    }))

    return {
      success: true,
      data: {
        rooms: rooms
      }
    }
  } catch (err) {
    console.error('getMyRooms error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
