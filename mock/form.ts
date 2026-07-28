import { MockMethod } from 'vite-plugin-mock'

// 事项列表假数据
function generateAffairNo(index: number) {
  return `SW-2026-${String(index).padStart(4, '0')}`
}

const affairsList = [
  {
    id: 1,
    affairNo: generateAffairNo(1),
    name: '城市道路改扩建项目审批',
    department: '交通运输局',
    applicant: '张建国',
    applyTime: '2026-07-20 10:30:00',
    contact: '张建国',
    phone: '13800138001',
    description: '对城区主干道中华路进行拓宽改造，全长3.2公里',
    status: 'PENDING'
  },
  {
    id: 2,
    affairNo: generateAffairNo(2),
    name: '老旧小区电梯加装备案',
    department: '住房和城乡建设局',
    applicant: '李明华',
    applyTime: '2026-07-19 14:20:00',
    contact: '李明华',
    phone: '13800138002',
    description: '翡翠城小区12栋加装外挂电梯2部',
    status: 'IN_PROGRESS'
  },
  {
    id: 3,
    affairNo: generateAffairNo(3),
    name: '商业用地规划许可证申请',
    department: '自然资源局',
    applicant: '王芳',
    applyTime: '2026-07-18 09:15:00',
    contact: '王芳',
    phone: '13800138003',
    description: '申请位于高新区科技路以南地块的商业综合体规划许可',
    status: 'COMPLETED'
  },
  {
    id: 4,
    affairNo: generateAffairNo(4),
    name: '城市绿化带改造项目备案',
    department: '城市管理局',
    applicant: '赵伟',
    applyTime: '2026-07-17 16:45:00',
    contact: '赵伟',
    phone: '13800138004',
    description: '环城路沿线绿化带景观提升工程',
    status: 'PENDING'
  },
  {
    id: 5,
    affairNo: generateAffairNo(5),
    name: '智慧交通信号灯升级项目',
    department: '公安局交警支队',
    applicant: '陈志强',
    applyTime: '2026-07-16 11:00:00',
    contact: '陈志强',
    phone: '13800138005',
    description: '全市主要路口智能交通信号灯系统升级改造',
    status: 'IN_PROGRESS'
  },
  {
    id: 6,
    affairNo: generateAffairNo(6),
    name: '公共停车场建设审批',
    department: '发展和改革局',
    applicant: '刘洋',
    applyTime: '2026-07-15 08:30:00',
    contact: '刘洋',
    phone: '13800138006',
    description: '在市中心商业区建设地下三层公共停车场',
    status: 'OVERDUE'
  },
  {
    id: 7,
    affairNo: generateAffairNo(7),
    name: '社区文化活动中心备案',
    department: '文化和旅游局',
    applicant: '孙丽',
    applyTime: '2026-07-14 13:20:00',
    contact: '孙丽',
    phone: '13800138007',
    description: '阳光花园社区新建综合性文化活动中心',
    status: 'COMPLETED'
  },
  {
    id: 8,
    affairNo: generateAffairNo(8),
    name: '河道治理工程环评审批',
    department: '生态环境局',
    applicant: '周浩',
    applyTime: '2026-07-13 10:10:00',
    contact: '周浩',
    phone: '13800138008',
    description: '市内主要河道清淤及生态护岸建设工程',
    status: 'PENDING'
  },
  {
    id: 9,
    affairNo: generateAffairNo(9),
    name: '公共厕所新建改造项目',
    department: '城市管理局',
    applicant: '吴敏',
    applyTime: '2026-07-12 15:40:00',
    contact: '吴敏',
    phone: '13800138009',
    description: '在全市新增20座公共卫生间并进行智能化改造',
    status: 'IN_PROGRESS'
  },
  {
    id: 10,
    affairNo: generateAffairNo(10),
    name: '教育园区规划方案审批',
    department: '教育局',
    applicant: '郑文',
    applyTime: '2026-07-11 09:50:00',
    contact: '郑文',
    phone: '13800138010',
    description: '城南新区新建K12一贯制教育园区规划方案',
    status: 'COMPLETED'
  },
  {
    id: 11,
    affairNo: generateAffairNo(11),
    name: '城市地下管网改造项目',
    department: '住房和城乡建设局',
    applicant: '黄强',
    applyTime: '2026-07-10 14:00:00',
    contact: '黄强',
    phone: '13800138011',
    description: '老城区供水、供气、供热管网全面更新改造',
    status: 'PENDING'
  },
  {
    id: 12,
    affairNo: generateAffairNo(12),
    name: '垃圾分类处理中心建设',
    department: '城市管理局',
    applicant: '许健',
    applyTime: '2026-07-09 11:30:00',
    contact: '许健',
    phone: '13800138012',
    description: '建设日处理500吨的综合性垃圾分类处理中心',
    status: 'IN_PROGRESS'
  }
]

// 状态映射
const statusMap: Record<string, string> = {
  'PENDING': '待办',
  'IN_PROGRESS': '进行中',
  'COMPLETED': '已办结',
  'OVERDUE': '逾期'
}

export default [
  // 获取事项列表（带分页和搜索）
  {
    url: '/api/affairs/list',
    method: 'get',
    response: (xhr: any) => {
      const { name, status, page = 1, limit = 10, exportMode } = xhr.query || {}
      let filtered = [...affairsList]

      // 按事项名称搜索
      if (name) {
        filtered = filtered.filter(item => item.name.includes(name))
      }

      // 按办理状态筛选
      if (status) {
        filtered = filtered.filter(item => item.status === status)
      }

      const total = filtered.length
      const items = (exportMode === 'true' || exportMode === true)
        ? filtered.map(item => ({ ...item, statusLabel: statusMap[item.status] || item.status }))
        : filtered.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)).map(item => ({
            ...item,
            statusLabel: statusMap[item.status] || item.status
          }))

      return {
        code: 200,
        message: '获取成功',
        data: {
          total,
          items
        }
      }
    }
  },
  // 新增事项
  {
    url: '/api/affairs/add',
    method: 'post',
    response: (xhr: any) => {
      const body = xhr.body
      const newId = Math.max(...affairsList.map(item => item.id)) + 1
      const newItem = {
        id: newId,
        ...body,
        applyTime: new Date().toLocaleString('zh-CN'),
        statusLabel: statusMap[body.status] || body.status
      }
      affairsList.unshift(newItem)
      return {
        code: 200,
        message: '新增成功',
        data: newItem
      }
    }
  },
  // 编辑事项
  {
    url: '/api/affairs/update',
    method: 'put',
    response: (xhr: any) => {
      const body = xhr.body
      const index = affairsList.findIndex(item => item.id === body.id)
      if (index !== -1) {
        affairsList[index] = {
          ...affairsList[index],
          ...body,
          statusLabel: statusMap[body.status] || body.status
        }
      }
      return {
        code: 200,
        message: '更新成功',
        data: affairsList[index]
      }
    }
  },
  // 删除事项
  {
    url: '/api/affairs/delete',
    method: 'delete',
    response: (xhr: any) => {
      const { id } = xhr.query || {}
      const index = affairsList.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        affairsList.splice(index, 1)
      }
      return {
        code: 200,
        message: '删除成功'
      }
    }
  }
] as MockMethod[]
