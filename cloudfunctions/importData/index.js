const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { data } = event

  try {
    // 校验数据格式
    if (!data || !data.app || data.app !== 'together-todo') {
      return {
        success: false,
        errMsg: '数据格式不正确，请确认是从「一起待办」导出的数据'
      }
    }

    if (!data.version || data.version !== 1) {
      return {
        success: false,
        errMsg: '数据版本不兼容'
      }
    }

    if (!data.data) {
      return {
        success: false,
        errMsg: '数据内容为空'
      }
    }

    const importData = data.data
    let importedCounts = {
      lists: 0,
      members: 0,
      tasks: 0
    }

    // 导入清单
    if (importData.lists && Array.isArray(importData.lists)) {
      for (const list of importData.lists) {
        // 只导入当前用户是 owner 的清单
        if (list.ownerOpenid === openid) {
          try {
            // 检查清单是否已存在
            const existingList = await db.collection('lists').doc(list._id).get()
            
            if (existingList.data) {
              // 如果已存在，根据 updatedAt 判断是否需要更新
              if (new Date(list.updatedAt) > new Date(existingList.data.updatedAt)) {
                await db.collection('lists').doc(list._id).update({
                  data: {
                    name: list.name,
                    color: list.color,
                    icon: list.icon,
                    updatedAt: list.updatedAt,
                    isDeleted: list.isDeleted
                  }
                })
                importedCounts.lists++
              }
            } else {
              // 不存在则创建
              await db.collection('lists').add({
                data: {
                  _id: list._id,
                  name: list.name,
                  ownerOpenid: list.ownerOpenid,
                  color: list.color,
                  icon: list.icon,
                  createdAt: list.createdAt,
                  updatedAt: list.updatedAt,
                  isDeleted: list.isDeleted
                }
              })
              importedCounts.lists++
            }
          } catch (err) {
            console.error('导入清单失败:', err)
          }
        }
      }
    }

    // 导入清单成员
    if (importData.list_members && Array.isArray(importData.list_members)) {
      for (const member of importData.list_members) {
        // 只导入当前用户相关的成员记录
        if (member.openid === openid) {
          try {
            // 检查成员关系是否已存在
            const existingMember = await db.collection('list_members').where({
              listId: member.listId,
              openid: member.openid
            }).get()

            if (existingMember.data.length === 0) {
              await db.collection('list_members').add({
                data: {
                  listId: member.listId,
                  openid: member.openid,
                  role: member.role,
                  joinedAt: member.joinedAt
                }
              })
              importedCounts.members++
            }
          } catch (err) {
            console.error('导入成员关系失败:', err)
          }
        }
      }
    }

    // 导入任务
    if (importData.tasks && Array.isArray(importData.tasks)) {
      for (const task of importData.tasks) {
        // 检查当前用户是否有权限导入该任务（是否是清单成员）
        const memberCheck = await db.collection('list_members').where({
          listId: task.listId,
          openid: openid
        }).get()

        if (memberCheck.data.length > 0) {
          try {
            // 检查任务是否已存在
            const existingTask = await db.collection('tasks').doc(task._id).get()

            if (existingTask.data) {
              // 如果已存在，根据 updatedAt 判断是否需要更新
              if (new Date(task.updatedAt) > new Date(existingTask.data.updatedAt)) {
                await db.collection('tasks').doc(task._id).update({
                  data: {
                    title: task.title,
                    content: task.content,
                    date: task.date,
                    status: task.status,
                    doneBy: task.doneBy,
                    doneAt: task.doneAt,
                    flagged: task.flagged,
                    priority: task.priority,
                    sortOrder: task.sortOrder,
                    updatedAt: task.updatedAt,
                    isDeleted: task.isDeleted
                  }
                })
                importedCounts.tasks++
              }
            } else {
              // 不存在则创建
              await db.collection('tasks').add({
                data: {
                  _id: task._id,
                  listId: task.listId,
                  title: task.title,
                  content: task.content,
                  date: task.date,
                  creatorOpenid: task.creatorOpenid,
                  status: task.status,
                  doneBy: task.doneBy,
                  doneAt: task.doneAt,
                  flagged: task.flagged,
                  priority: task.priority,
                  sortOrder: task.sortOrder,
                  createdAt: task.createdAt,
                  updatedAt: task.updatedAt,
                  isDeleted: task.isDeleted
                }
              })
              importedCounts.tasks++
            }
          } catch (err) {
            console.error('导入任务失败:', err)
          }
        }
      }
    }

    return {
      success: true,
      data: {
        imported: importedCounts
      }
    }
  } catch (err) {
    console.error('importData error:', err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}
