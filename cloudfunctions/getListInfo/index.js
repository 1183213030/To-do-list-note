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

    // 查询清单信息
    const listRes = await db.collection('lists').doc(listId).get()
    
    if (!listRes.data || listRes.data.isDeleted) {
      return {
        success: false,
        errMsg: '清单不存在或已删除'
      }
    }

    // 查询成员数量
    const memberCountRes = await db.collection('list_members').where({
      listId: listId
    }).count()

    // 查询当前用户是否是成员
    const myMemberRes = await db.collection('list_members').where({
      listId: listId,
      openid: openid
    }).get()

    const isMember = myMemberRes.data.length > 0
    const myRole = isMember ? myMemberRes.data[0].role : null

    return {
      success: true,
      data: {
        list: listRes.data,
        memberCount: memberCountRes.total,
        isMember: isMember,
        myRole: myRole
      }
    }
  } catch (err) {
    console.error('getListInfo error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
