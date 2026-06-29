const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name } = event

  try {
    // 校验参数
    if (!name || typeof name !== 'string') {
      return {
        success: false,
        errMsg: '清单名称不能为空'
      }
    }

    if (name.length > 30) {
      return {
        success: false,
        errMsg: '清单名称不能超过30个字'
      }
    }

    const now = new Date()

    // 创建清单
    const listRes = await db.collection('lists').add({
      data: {
        name: name.trim(),
        ownerOpenid: openid,
        color: '#007aff',
        icon: 'list',
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }
    })

    const listId = listRes._id

    // 创建清单成员关系
    await db.collection('list_members').add({
      data: {
        listId: listId,
        openid: openid,
        role: 'owner',
        joinedAt: now
      }
    })

    return {
      success: true,
      data: {
        listId: listId
      }
    }
  } catch (err) {
    console.error('createList error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
