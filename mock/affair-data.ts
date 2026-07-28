// ============================================================
// 公共数据源 - 所有台账事项数据统一管理
// ============================================================

// 部门列表
export const departments = ['交通运输局', '住房和城乡建设局', '自然资源局', '城市管理局', '公安局交警支队', '发展和改革局', '文化和旅游局', '生态环境局', '教育局', '卫生健康局']

// 事项名称池
export const affairNames = [
  '公共停车场建设审批', '城市道路改扩建项目审批', '建筑垃圾运输许可', '户外广告设置审批',
  '市政管线入地工程审批', '城市绿地占用审批', '建设工程规划许可', '房屋建筑工程施工许可',
  '排水许可证核发', '夜间施工许可', '城市桥梁隧道安全评估', '市容环境卫生责任区备案',
  '城市轨道交通保护区作业审批', '古树名木迁移审批', '城市照明设施设置审批'
]

// 环节列表（标准审批流程，按顺序不可调换）
export const steps = ['受理', '审核', '现场勘查', '专家评审', '审批', '办结']

// 办理状态
export const processStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']
export const processStatusLabels: Record<string, string> = { 'PENDING': '待办', 'IN_PROGRESS': '进行中', 'COMPLETED': '已办结', 'OVERDUE': '逾期' }

// 操作行为
export const actions = ['提交申请', '受理审核', '现场勘查', '补充材料', '专家评审', '审批通过', '审批驳回', '办结归档']

// 操作IP池
export const ipPool = ['192.168.1.101', '192.168.1.102', '10.0.0.88', '10.0.0.99', '172.16.0.55', '172.16.0.66']

// 月份
export const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 环节操作人映射
const stepOperators = ['窗口受理员', '审核科员', '勘查人员', '评审专家组', '审批负责人', '办结归档员']
const stepRemarks = ['材料齐全，予以受理', '初审通过', '现场情况与申报一致', '专家评审中', '审批意见已签署', '事项已办结']

// 模拟数据辅助函数
function randomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startMonth: number = 1, endMonth: number = 6) {
  const month = randomInt(startMonth, endMonth)
  const day = randomInt(1, 28)
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`
}

// 申请人和操作人姓名池
const applicantFamilyNames = ['张', '王', '李', '赵', '刘', '陈']
const applicantGivenNames = ['三', '四', '五', '六', '七', '八', '强', '磊', '芳', '静', '超', '洋']
const operatorFamilyNames = ['李', '赵', '王', '刘', '陈', '杨']
const operatorGivenNames = ['明', '华', '强', '伟', '芳', '敏', '刚', '军', '辉', '丽', '娟', '涛']

// ============================================================
// 核心工具函数：根据 flow 数组自动计算当前环节
// 规则：返回第一个 in_progress 步骤，若没有则返回最后一个 completed 步骤
// 保证与时间轴蓝色激活节点完全一致
// ============================================================
export function getCurrentNodeName(flow: FlowStep[]): string {
  // 1. 优先找进行中（in_progress）的步骤
  const inProgress = flow.find(s => s.status === 'in_progress')
  if (inProgress) return inProgress.name

  // 2. 没有进行中，找最后一个已完成步骤
  const completed = flow.filter(s => s.status === 'completed')
  if (completed.length > 0) return completed[completed.length - 1].name

  // 3. 兜底返回第一个步骤
  return flow[0]?.name || '受理'
}

export interface FlowStep {
  name: string
  operator: string
  time: string
  status: 'completed' | 'in_progress' | 'pending'
  remark: string
}

/**
 * 根据办理状态生成流程节点数组
 * PENDING → 早期 1-2 步已完成，1 步进行中，其余待进行
 * IN_PROGRESS → 前半部分已完成，1 步进行中，后半部分待进行
 * COMPLETED → 全部已完成
 * OVERDUE → 部分已完成，1 步卡住（进行中），其余待进行
 */
export function generateFlow(affairStatus: string, allSteps: string[] = steps): FlowStep[] {
  const totalSteps = allSteps.length
  const completedCount = (() => {
    switch (affairStatus) {
      case 'PENDING': return randomInt(0, 1)
      case 'IN_PROGRESS': return randomInt(2, Math.max(2, totalSteps - 3))
      case 'COMPLETED': return totalSteps
      case 'OVERDUE': return randomInt(1, Math.max(1, totalSteps - 2))
      default: return 0
    }
  })()

  const inProgressIndex = affairStatus === 'COMPLETED' ? -1
    : Math.min(completedCount, totalSteps - 1)

  return allSteps.map((name, i) => {
    const isCompleted = i < completedCount
    const isInProgress = i === inProgressIndex && !isCompleted
    const status = isCompleted ? 'completed' as const
      : isInProgress ? 'in_progress' as const
      : 'pending' as const
    return {
      name,
      operator: (isCompleted || isInProgress) ? stepOperators[i] || '' : '',
      time: (isCompleted || isInProgress) ? randomDate() : '',
      status,
      remark: isCompleted ? (stepRemarks[i] || '') : isInProgress ? (stepRemarks[i] || '处理中') : ''
    }
  })
}

// ============================================================
// 1. 时效监管数据
// ============================================================
export interface TimeLimitItem {
  id: number
  affairNo: string
  name: string
  department: string
  applicant: string
  applyTime: string
  flow: FlowStep[]
  currentNode: string
  totalTime: string
  usedTime: string
  remainingTime: string
  stepDuration: string
  timeStatus: string
  timeStatusLabel: string
  status: string
  statusLabel: string
  superviseStatus: boolean
}

export const timeLimitList: TimeLimitItem[] = []
for (let i = 1; i <= 45; i++) {
  const totalTime = randomInt(5, 30)
  const status = randomItem(processStatuses)
  const flow = generateFlow(status)
  // 实际用时基于 flow 中已完成的步骤数估算
  const completedCount = flow.filter(s => s.status === 'completed').length
  const usedDays = status === 'COMPLETED' ? totalTime
    : status === 'OVERDUE' ? totalTime + randomInt(1, 5)
    : Math.max(1, Math.round(totalTime * (completedCount / steps.length) * randomInt(8, 12) / 10))
  const remainingTime = totalTime - usedDays

  let timeStatus: string, timeStatusLabel: string
  if (remainingTime <= 0) {
    timeStatus = 'OVERDUE'; timeStatusLabel = '超期'
  } else if (remainingTime <= Math.ceil(totalTime * 0.2)) {
    timeStatus = 'WARNING'; timeStatusLabel = '临期预警'
  } else {
    timeStatus = 'NORMAL'; timeStatusLabel = '正常'
  }

  timeLimitList.push({
    id: i,
    affairNo: `SW-2026-${String(i).padStart(4, '0')}`,
    name: randomItem(affairNames),
    department: randomItem(departments),
    applicant: `${randomItem(applicantFamilyNames)}${randomItem(applicantGivenNames)}`,
    applyTime: randomDate(),
    flow,
    currentNode: getCurrentNodeName(flow),
    totalTime: `${totalTime}天`,
    usedTime: `${Math.max(usedDays, 0)}天`,
    remainingTime: `${Math.max(remainingTime, 0)}天`,
    stepDuration: `${randomInt(1, 7)}天`,
    timeStatus,
    timeStatusLabel,
    status,
    statusLabel: processStatusLabels[status],
    superviseStatus: false
  })
}

// ============================================================
// 2. 流程审计追溯数据
// ============================================================
export interface ProcessAuditItem {
  id: number
  affairNo: string
  name: string
  department: string
  applyTime: string
  status: string
  statusLabel: string
  operator: string
  operateTime: string
  action: string
  ip: string
  step: string
  summary: string
}

const auditStatusLabels: Record<string, string> = { 'PENDING': '待办', 'IN_PROGRESS': '进行中', 'COMPLETED': '已办结' }
const summaryPool = [
  '材料已补充提交', '现场勘查已完成', '专家评审意见已通过', '审批流程已发起',
  '申请材料已审核', '补正通知已发出', '现场核查记录已上传', '部门会签已完成',
  '领导批示已下发', '公示期已结束', '听证会已召开', '设计变更已确认',
  '预算审核已通过', '合同已签订', '竣工验收已申请'
]
const stepActionMap: Record<string, string[]> = {
  '受理': ['提交申请', '受理审核'],
  '审核': ['申请材料已审核', '补正通知已发出', '材料已补充提交'],
  '现场勘查': ['现场勘查', '现场核查记录已上传'],
  '专家评审': ['专家评审', '专家评审意见已通过'],
  '审批': ['审批通过', '审批驳回', '审批流程已发起', '领导批示已下发'],
  '办结': ['办结归档', '公示期已结束', '竣工验收已申请']
}

export const processAuditList: ProcessAuditItem[] = []
for (let i = 1; i <= 40; i++) {
  const status = randomItem(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  let step: string
  if (status === 'PENDING') {
    step = randomItem(steps.slice(0, 2))
  } else if (status === 'IN_PROGRESS') {
    step = randomItem(steps.slice(2, 5))
  } else {
    step = '办结'
  }
  processAuditList.push({
    id: i,
    affairNo: `SW-2026-${String(i).padStart(4, '0')}`,
    name: randomItem(affairNames),
    department: randomItem(departments),
    applyTime: randomDate(),
    status,
    statusLabel: auditStatusLabels[status],
    operator: `${randomItem(operatorFamilyNames)}${randomItem(operatorGivenNames)}`,
    operateTime: randomDate(),
    action: randomItem(stepActionMap[step] || actions),
    ip: randomItem(ipPool),
    step,
    summary: randomItem(summaryPool)
  })
}

// ============================================================
// 3. 廉政风险管控数据
// ============================================================
export interface RiskControlItem {
  id: number
  affairNo: string
  name: string
  department: string
  applicant: string
  type: string
  typeLabel: string
  tags: string[]
  riskLevel: string
  riskLevelLabel: string
  auditStatus: string
  auditStatusLabel: string
  superviseStatus: boolean
}

const riskLevels = ['LOW', 'MEDIUM', 'HIGH']
const riskLevelLabels: Record<string, string> = { 'LOW': '低风险', 'MEDIUM': '中风险', 'HIGH': '高风险' }
const riskTagsPool = [['材料疑点'], ['裁量异常'], ['流程可疑'], ['材料疑点', '裁量异常'], ['材料疑点', '流程可疑'], ['裁量异常', '流程可疑']]
const riskTypeLabels: Record<string, string> = { 'APPROVAL': '审批事项', 'PENALTY': '处罚事项', 'SERVICE': '服务事项' }
const auditStatusMap: Record<string, string> = { 'PENDING': '待核查', 'DONE': '已核查' }

export const riskControlList: RiskControlItem[] = []
for (let i = 1; i <= 35; i++) {
  const riskLevel = randomItem(riskLevels)
  const auditStatus = randomItem(['PENDING', 'DONE'])
  riskControlList.push({
    id: i,
    affairNo: `SW-2026-${String(i).padStart(4, '0')}`,
    name: randomItem(affairNames),
    department: randomItem(departments),
    applicant: `${randomItem(applicantFamilyNames)}${randomItem(applicantGivenNames)}`,
    type: randomItem(['APPROVAL', 'PENALTY', 'SERVICE']),
    typeLabel: '',
    tags: randomItem(riskTagsPool),
    riskLevel,
    riskLevelLabel: riskLevelLabels[riskLevel],
    auditStatus,
    auditStatusLabel: auditStatusMap[auditStatus],
    superviseStatus: false
  })
}
// 补全 typeLabel
riskControlList.forEach(item => { item.typeLabel = riskTypeLabels[item.type] || item.type })

// ============================================================
// 4. 督办调度中心数据
// ============================================================
export interface DispatchItem {
  id: number
  affairNo: string
  affairName: string
  source: string
  sourceLabel: string
  level: string
  levelLabel: string
  assignee: string
  createTime: string
  deadline: string
  status: string
  statusLabel: string
}

const sourceLabels: Record<string, string> = { 'TIME_WARNING': '时效预警', 'PROCESS_VIOLATION': '流程违规', 'RISK_CLUE': '风险线索' }
const levelLabels: Record<string, string> = { 'NORMAL': '普通', 'IMPORTANT': '重要', 'URGENT': '紧急' }
const dispatchStatusLabels: Record<string, string> = { 'PENDING': '待处置', 'IN_PROGRESS': '处置中', 'CLOSED': '已销号' }

export const dispatchList: DispatchItem[] = []
for (let i = 1; i <= 30; i++) {
  const source = randomItem(['TIME_WARNING', 'PROCESS_VIOLATION', 'RISK_CLUE'])
  const level = randomItem(['NORMAL', 'IMPORTANT', 'URGENT'])
  const status = randomItem(['PENDING', 'IN_PROGRESS', 'CLOSED'])
  let dayOffset: number
  if (status === 'CLOSED') {
    dayOffset = randomInt(-15, -1)
  } else if (status === 'PENDING') {
    dayOffset = randomInt(-5, 5)
  } else {
    dayOffset = randomInt(-3, 7)
  }
  const deadlineDate = new Date(2026, 5, 15 + dayOffset)
  const deadlineStr = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`
  dispatchList.push({
    id: i,
    affairNo: `SW-2026-${String(i).padStart(4, '0')}`,
    affairName: randomItem(affairNames),
    source,
    sourceLabel: sourceLabels[source],
    level,
    levelLabel: levelLabels[level],
    assignee: `${randomItem(operatorFamilyNames)}${randomItem(operatorGivenNames)}`,
    createTime: randomDate(),
    deadline: deadlineStr,
    status,
    statusLabel: dispatchStatusLabels[status]
  })
}

// ============================================================
// 5. 监察统计大屏数据
// ============================================================
export function generateDashboardData(timeRange: string, startDate?: string, endDate?: string) {
  const deptNames = departments.slice(0, 8)
  const deptRates = deptNames.map(() => randomInt(5, 45))
  const normalCount = randomInt(200, 400)
  const warningCount = randomInt(20, 60)
  const overdueCount = randomInt(5, 30)
  const warningTrend = MONTHS.map(() => randomInt(5, 40))
  const superviseTrend = MONTHS.map(() => randomInt(3, 25))
  const riskDeptNames = departments.slice(0, 7)
  const riskDeptCounts = riskDeptNames.map(() => randomInt(3, 25))
  const onTimeRate = randomInt(85, 98)

  return {
    totalCases: randomInt(300, 500),
    onTimeRate,
    overdueCases: overdueCount,
    superviseCases: randomInt(30, 80),
    deptNames,
    deptRates,
    normalCount,
    warningCount,
    overdueCount,
    months: MONTHS,
    warningTrend,
    superviseTrend,
    riskDeptNames,
    riskDeptCounts
  }
}