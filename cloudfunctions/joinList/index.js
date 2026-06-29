const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { listId } = event

  try {
    if (!listId) {
      return {
        success: false,
        errMsg: '清单ID不能为空'
      }
    }

    // 校验清单存在且未删除
    const listRes = await db.collection('lists').doc(listId).get()
    
    if (!listRes.data || listRes.data.isDeleted) {
      return {
        success: false,
        errMsg: '清单不存在或已删除'
      }
    }

    // 查询当前用户是否已经是成员
    const memberRes = await db.collection('list_members').where({
      listId: listId,
      openid: openid
    }).get()

    if (memberRes.data.length > 0) {
      return {
        success: true,
        data: {
          message: '你已经是成员了'
        }
      }
    }

    // 加入清单
    await db.collection('list_members').add({
      data: {
        listId: listId,
        openid: openid,
        role: 'member',
        joinedAt: new Date()
      }
    })

    return {
      success: true,
      data: {
        message: '加入成功'
      }
    }
  } catch (err) {
    console.error('joinList error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
