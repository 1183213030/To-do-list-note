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

    // 查询成员
    const membersRes = await db.collection('room_members').where({
      roomId: room._id
    }).get()

    // 判断当前用户是否是成员
    const currentMember = membersRes.data.find(m => m.openid === openid)
    const isMember = !!currentMember

    // 统计待完成和已完成数量
    const pendingRes = await db.collection('todos').where({
      roomId: room._id,
      done: false,
      isDeleted: false
    }).count()

    const completedRes = await db.collection('todos').where({
      roomId: room._id,
      done: true,
      isDeleted: false
    }).count()

    const memberNames = membersRes.data.map(m => m.nickName || '成员').join('、')

    return {
      success: true,
      data: {
        room: {
          roomId: room._id,
          roomCode: room.roomCode,
          name: room.name,
          locked: room.locked,
          ownerOpenid: room.ownerOpenid
        },
        isMember: isMember,
        isOwner: room.ownerOpenid === openid,
        memberCount: membersRes.data.length,
        members: memberNames,
        pendingCount: pendingRes.total,
        completedCount: completedRes.total
      }
    }
  } catch (err) {
    console.error('getRoomInfo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
