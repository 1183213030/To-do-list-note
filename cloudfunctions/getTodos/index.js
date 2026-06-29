const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { roomCode, sortMode = 'newest' } = event

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

    // 查询小纸条
    let query = db.collection('todos').where({
      roomId: room._id,
      isDeleted: false
    })

    // 排序逻辑
    if (sortMode === 'newest') {
      query = query.orderBy('pinned', 'desc').orderBy('createdAt', 'desc')
    } else if (sortMode === 'oldest') {
      query = query.orderBy('pinned', 'desc').orderBy('createdAt', 'asc')
    } else if (sortMode === 'done') {
      query = query.orderBy('pinned', 'desc').orderBy('done', 'desc').orderBy('createdAt', 'desc')
    } else if (sortMode === 'pending') {
      query = query.orderBy('pinned', 'desc').orderBy('done', 'asc').orderBy('createdAt', 'desc')
    }

    const todosRes = await query.get()

    return {
      success: true,
      data: {
        todos: todosRes.data
      }
    }
  } catch (err) {
    console.error('getTodos error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
