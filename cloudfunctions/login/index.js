const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    let userInfo = null

    if (userRes.data.length === 0) {
      // 用户不存在，创建新用户
      const now = new Date()
      const newUser = {
        openid: openid,
        nickName: '用户' + openid.slice(-6),
        avatarUrl: '',
        createdAt: now,
        updatedAt: now
      }

      await db.collection('users').add({
        data: newUser
      })

      userInfo = newUser
    } else {
      userInfo = userRes.data[0]
    }

    return {
      success: true,
      data: {
        openid: openid,
        userInfo: userInfo
      }
    }
  } catch (err) {
    console.error('login error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
