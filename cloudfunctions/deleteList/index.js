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

    // 查询清单
    const listRes = await db.collection('lists').doc(listId).get()
    
    if (!listRes.data) {
      return {
        success: false,
        errMsg: '清单不存在'
      }
    }

    const list = listRes.data

    // 只有 owner 可以删除
    if (list.ownerOpenid !== openid) {
      return {
        success: false,
        errMsg: '只有创建者可以删除清单'
      }
    }

    const now = new Date()

    // 软删除清单
    await db.collection('lists').doc(listId).update({
      data: {
        isDeleted: true,
        updatedAt: now
      }
    })

    // 软删除该清单下的所有任务
    await db.collection('tasks').where({
      listId: listId
    }).update({
      data: {
        isDeleted: true,
        updatedAt: now
      }
    })

    return {
      success: true,
      data: {
        message: '删除成功'
      }
    }
  } catch (err) {
    console.error('deleteList error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
