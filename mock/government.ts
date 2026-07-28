import { MockMethod } from 'vite-plugin-mock'
import {
  timeLimitList, processAuditList, riskControlList, dispatchList,
  getCurrentNodeName, generateFlow, steps, generateDashboardData
} from './affair-data'

// 给每条时效数据附加 currentNode，确保列表与弹窗一致
function withCurrentNode(list: any[]) {
  return list.map(item => ({
    ...item,
    currentNode: item.flow ? getCurrentNodeName(item.flow) : item.currentStep || ''
  }))
}

export default [
  // 1. 时效监管 - 列表
  {
    url: '/api/government/time-limit',
    method: 'get',
    response: ({ query }: any) => {
      const { name, department, status, timeStatus, showAll, exportMode, page = 1, limit = 10 } = query || {}
      let filtered = withCurrentNode(timeLimitList)
      if (name) filtered = filtered.filter(item => item.name.includes(name))
      if (department) filtered = filtered.filter(item => item.department === department)
      if (status) {
        const statusArr = status.split(',')
        filtered = filtered.filter(item => statusArr.includes(item.status))
      }
      if (timeStatus) {
        const timeStatusArr = timeStatus.split(',')
        filtered = filtered.filter(item => timeStatusArr.includes(item.timeStatus))
      }
      if (showAll === 'true' || showAll === true || exportMode === 'true' || exportMode === true) {
        return { code: 200, message: '获取成功', data: { total: filtered.length, items: filtered } }
      }
      const total = filtered.length
      const start = (Number(page) - 1) * Number(limit)
      const items = filtered.slice(start, start + Number(limit))
      return { code: 200, message: '获取成功', data: { total, items } }
    }
  },
  // 2. 时效监管 - 统计
  {
    url: '/api/government/time-limit/stats',
    method: 'get',
    response: ({ query }: any) => {
      const { showAll } = query || {}
      let list = timeLimitList
      if (showAll === 'true' || showAll === true) {
        list = timeLimitList
      }
      const total = list.length
      const warning = list.filter(item => item.timeStatus === 'WARNING').length
      const overdue = list.filter(item => item.timeStatus === 'OVERDUE').length
      const avgDuration = `${Math.round(Math.random() * 9 + 3)}天`
      return { code: 200, message: '获取成功', data: { total, warning, overdue, avgDuration } }
    }
  },
  // 3. 流程审计追溯
  {
    url: '/api/government/process-audit',
    method: 'get',
    response: ({ query }: any) => {
      const { name, applicant, department, startTime, endTime, exportMode, page = 1, limit = 10 } = query || {}
      let filtered = [...processAuditList]
      if (name) filtered = filtered.filter(item => item.name.includes(name))
      if (applicant) filtered = filtered.filter(item => item.applicant?.includes(applicant))
      if (department) filtered = filtered.filter(item => item.department === department)
      if (startTime) {
        filtered = filtered.filter(item => item.operateTime >= startTime)
      }
      if (endTime) {
        filtered = filtered.filter(item => item.operateTime <= endTime)
      }
      if (exportMode === 'true' || exportMode === true) {
        return { code: 200, message: '获取成功', data: { total: filtered.length, items: filtered } }
      }
      const total = filtered.length
      const start = (Number(page) - 1) * Number(limit)
      const items = filtered.slice(start, start + Number(limit))
      return { code: 200, message: '获取成功', data: { total, items } }
    }
  },
  // 4. 廉政风险管控
  {
    url: '/api/government/risk-control',
    method: 'get',
    response: ({ query }: any) => {
      const { type, department, riskLevel, tag, auditStatus, exportMode, page = 1, limit = 10 } = query || {}
      let filtered = [...riskControlList]
      if (type) filtered = filtered.filter(item => item.type === type)
      if (department) filtered = filtered.filter(item => item.department === department)
      if (riskLevel) filtered = filtered.filter(item => item.riskLevel === riskLevel)
      if (tag) {
        filtered = filtered.filter(item => item.tags.includes(tag))
      }
      if (auditStatus) filtered = filtered.filter(item => item.auditStatus === auditStatus)
      if (exportMode === 'true' || exportMode === true) {
        return { code: 200, message: '获取成功', data: { total: filtered.length, items: filtered } }
      }
      const total = filtered.length
      const start = (Number(page) - 1) * Number(limit)
      const items = filtered.slice(start, start + Number(limit))
      return { code: 200, message: '获取成功', data: { total, items } }
    }
  },
  // 5. 督办调度中心
  {
    url: '/api/government/supervise-dispatch',
    method: 'get',
    response: ({ query }: any) => {
      const { source, level, status, exportMode, page = 1, limit = 10 } = query || {}
      let filtered = [...dispatchList]
      if (source) filtered = filtered.filter(item => item.source === source)
      if (level) filtered = filtered.filter(item => item.level === level)
      if (status) filtered = filtered.filter(item => item.status === status)
      if (exportMode === 'true' || exportMode === true) {
        return { code: 200, message: '获取成功', data: { total: filtered.length, items: filtered } }
      }
      const total = filtered.length
      const start = (Number(page) - 1) * Number(limit)
      const items = filtered.slice(start, start + Number(limit))
      return { code: 200, message: '获取成功', data: { total, items } }
    }
  },
  // 6. 督办调度中心 - 新增督办单
  {
    url: '/api/government/supervise-dispatch/add',
    method: 'post',
    response: ({ body }: any) => {
      const { id, source, affairName } = body || {}
      // 根据来源设置对应列表的 superviseStatus
      if (source === 'TIME_WARNING' || source === 'RISK_CLUE') {
        const item = timeLimitList.find(i => i.id === Number(id) || i.name === affairName)
        if (item) item.superviseStatus = true
      }
      // 风险管控单独走
      if (source === 'RISK_AUDIT') {
        const item = riskControlList.find(i => i.id === Number(id) || i.name === affairName)
        if (item) item.superviseStatus = true
      }
      return { code: 200, message: '新增督办单成功', data: { id: dispatchList.length + 1, ...body } }
    }
  },
  // 7. 时效监管 - 时间轴（使用公共数据源 + 同一工具函数生成 currentNode）
  {
    url: '/api/government/time-limit/timeline',
    method: 'get',
    response: ({ query }: any) => {
      const { id } = query || {}
      const affair = timeLimitList.find(item => item.id === Number(id))
      if (!affair) {
        return { code: 404, message: '未找到该事项', data: null }
      }
      // 使用事项自身的 flow 数据，确保与列表一致
      const flow = affair.flow || generateFlow(affair.status)
      const currentNode = getCurrentNodeName(flow)
      const pauseRecords = [
        { id: 1, reason: '申请人补充材料', startTime: '2026-03-10', endTime: '2026-03-13', duration: '3天' },
        { id: 2, reason: '现场勘查因天气原因暂停', startTime: '2026-04-05', endTime: '2026-04-07', duration: '2天' }
      ]
      const correctionNodes = [
        { id: 1, step: '审核', content: '材料不齐全，退回补正', operator: '审核科员', time: '2026-03-15', status: 'completed' },
        { id: 2, step: '审批', content: '审批意见需补充说明', operator: '审批负责人', time: '2026-04-20', status: 'pending' }
      ]
      // 督办日志：事项被督办过则自动生成记录
      const superviseLogs = affair.superviseStatus
        ? [{ id: 1, content: `督办任务已发起，派发至${affair.department}处置`, operator: '系统管理员', time: '2026-06-20 10:30:00', status: 'PENDING', statusLabel: '待反馈' }]
        : []
      return {
        code: 200,
        message: '获取成功',
        data: {
          affair: {
            ...affair,
            currentNode,
            flow // 前端可用 flow 渲染时间轴
          },
          steps: flow,
          pauseRecords,
          correctionNodes,
          superviseLogs
        }
      }
    }
  },
  // 8. 监察统计大屏
  {
    url: '/api/government/monitor-dashboard',
    method: 'get',
    response: ({ query }: any) => {
      const { timeRange = 'month', startDate, endDate } = query || {}
      const data = generateDashboardData(timeRange, startDate, endDate)
      return { code: 200, message: '获取成功', data }
    }
  }
] as MockMethod[]