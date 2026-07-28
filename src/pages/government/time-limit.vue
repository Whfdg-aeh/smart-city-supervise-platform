<route>
  { meta: { title: "时效异常台账" } }
</route>

<script setup lang="ts">
const Query = reactive({
  name: '',
  department: '',
  status: '',
  timeStatus: 'WARNING,OVERDUE',
  showAll: false,
  page: 1,
  limit: 10
})

const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])

// 表格多选
const selectedRows = ref<any[]>([])

// 时间轴弹窗
const timelineVisible = ref(false)
const timelineLoading = ref(false)
const timelineData = ref<any>({
  affair: null,
  steps: [],
  pauseRecords: [],
  correctionNodes: []
})
// 请求计数器，防止接口返回顺序错乱
let timelineRequestId = 0

// 统计卡片
const statCards = ref([
  { label: '在办事项总数', value: 0, color: '#409EFF', icon: 'Document' },
  { label: '临期预警事项', value: 0, color: '#E6A23C', icon: 'Warning' },
  { label: '超期事项', value: 0, color: '#F56C6C', icon: 'CircleClose' },
  { label: '平均办理时长', value: '0天', color: '#67C23A', icon: 'Timer' }
])

const departmentOptions = ['交通运输局', '住房和城乡建设局', '自然资源局', '城市管理局', '公安局交警支队', '发展和改革局', '文化和旅游局', '生态环境局', '教育局', '卫生健康局']
const statusOptions = [{ label: '待办', value: 'PENDING' }, { label: '进行中', value: 'IN_PROGRESS' }, { label: '已办结', value: 'COMPLETED' }, { label: '逾期', value: 'OVERDUE' }]

const getTimeStatusType = (status: string) => {
  const map: Record<string, string> = { 'NORMAL': 'success', 'WARNING': 'warning', 'OVERDUE': 'danger' }
  return map[status] || 'info'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { 'PENDING': 'warning', 'IN_PROGRESS': '', 'COMPLETED': 'success', 'OVERDUE': 'danger' }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status
}

async function fetchList() {
  try {
    loading.value = true
    const params = { ...Query }
    if (params.showAll) {
      params.timeStatus = ''
    }
    const res: any = await useAxios().get('/api/government/time-limit', { params })
    tableData.value = res.items || []
    total.value = res.total || 0
    setTimeLimitTotal(res.total || 0)
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const params: any = { showAll: Query.showAll }
    const res: any = await useAxios().get('/api/government/time-limit/stats', { params })
    if (res) {
      statCards.value = [
        { label: '在办事项总数', value: res.total || 0, color: '#409EFF', icon: 'Document' },
        { label: '临期预警事项', value: res.warning || 0, color: '#E6A23C', icon: 'Warning' },
        { label: '超期事项', value: res.overdue || 0, color: '#F56C6C', icon: 'CircleClose' },
        { label: '平均办理时长', value: res.avgDuration || '0天', color: '#67C23A', icon: 'Timer' }
      ]
    }
  } catch { /* ignore */ }
}

function handleSearch() {
  Query.page = 1
  fetchList()
}

function handleReset() {
  Query.name = ''
  Query.department = ''
  Query.status = ''
  Query.timeStatus = 'WARNING,OVERDUE'
  Query.showAll = false
  Query.page = 1
  selectedRows.value = []
  fetchList()
  fetchStats()
}

// 显示全部事项切换
function handleShowAllChange(val: boolean) {
  Query.showAll = val
  Query.page = 1
  fetchList()
  fetchStats()
}

function handlePageChange(page: number) {
  Query.page = page
  fetchList()
}

// ---- 导出 ----
const timeLimitColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '事项名称', field: 'name' },
  { label: '受理部门', field: 'department' },
  { label: '申报人', field: 'applicant' },
  { label: '申报时间', field: 'applyTime' },
  { label: '当前环节', field: 'currentNode' },
  { label: '总时限', field: 'totalTime' },
  { label: '已耗时', field: 'usedTime' },
  { label: '剩余时限', field: 'remainingTime' },
  { label: '时效状态', field: 'timeStatus', formatter: (v: string, row: any) => row.timeStatusLabel },
  { label: '办理状态', field: 'status', formatter: (v: string, row: any) => row.statusLabel }
]
const {
  loading: timeLimitExportLoading,
  handleExport,
  disabled: timeLimitExportDisabled,
  setTotalCount: setTimeLimitTotal
} = useExport(
  async () => {
    const params = { ...Query, exportMode: true }
    if (params.showAll) params.timeStatus = ''
    const res: any = await useAxios().get('/api/government/time-limit', { params })
    return res.items || []
  },
  timeLimitColumns,
  '时效异常台账',
  Query
)

// 表格多选变化
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

// 单行督办
async function handleSupervise(row: any) {
  try {
    await ElMessageBox.confirm(`确认对事项"${row.name}"发起督办？`, '发起督办', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    await useAxios().post('/api/government/supervise-dispatch/add', {
      id: row.id,
      affairName: row.name,
      department: row.department,
      source: 'TIME_WARNING',
      level: row.timeStatus === 'OVERDUE' ? 'URGENT' : 'IMPORTANT',
      assignee: '',
      deadline: ''
    })
    // 更新本地行数据，不重新请求列表保持当前分页
    row.superviseStatus = true
    ElMessage.success(`已对事项"${row.name}"发起督办`)
  } catch { /* 取消操作 */ }
}

// 批量督办
async function handleBatchSupervise() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要督办的事项')
    return
  }
  try {
    await ElMessageBox.confirm(`确认对选中的 ${selectedRows.value.length} 条事项发起督办？`, '批量督办', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    for (const row of selectedRows.value) {
      await useAxios().post('/api/government/supervise-dispatch/add', {
        id: row.id,
        affairName: row.name,
        department: row.department,
        source: 'TIME_WARNING',
        level: row.timeStatus === 'OVERDUE' ? 'URGENT' : 'IMPORTANT',
        assignee: '',
        deadline: ''
      })
      // 更新本地行数据
      row.superviseStatus = true
    }
    ElMessage.success(`成功对 ${selectedRows.value.length} 条事项发起督办`)
    selectedRows.value = []
    fetchList()
  } catch { /* 取消操作 */ }
}

// 查看时间轴
async function handleViewTimeline(row: any) {
  // 先清空数据再打开弹窗，防止闪现旧数据
  timelineData.value = { affair: null, steps: [], pauseRecords: [], correctionNodes: [] }
  timelineVisible.value = true
  timelineLoading.value = true
  const requestId = ++timelineRequestId
  try {
    const res: any = await useAxios().get('/api/government/time-limit/timeline', { params: { id: row.id } })
    // 只有最新的请求才更新数据，丢弃旧请求返回
    if (requestId === timelineRequestId) {
      timelineData.value = res
    }
  } catch { /* ignore */ }
  finally {
    if (requestId === timelineRequestId) {
      timelineLoading.value = false
    }
  }
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<template>
  <div>
    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div v-for="card in statCards" :key="card.label" class="rounded-lg p-4 shadow-sm border-l-4" :style="{ borderLeftColor: card.color }">
        <p class="text-gray-500 text-sm">{{ card.label }}</p>
        <p class="text-2xl font-bold mt-1" :style="{ color: card.color }">{{ card.value }}</p>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap mb-4">
      <el-input v-model="Query.name" placeholder="事项名称" clearable style="width: 180px" @keyup.enter="handleSearch" @clear="handleSearch" />
      <el-select v-model="Query.department" placeholder="受理部门" clearable style="width: 160px" @change="handleSearch">
        <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
      </el-select>
      <el-select v-model="Query.status" placeholder="办理状态" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-checkbox v-model="Query.showAll" @change="handleShowAllChange">显示全部事项</el-checkbox>
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon><span>搜索</span>
      </el-button>
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon><span>重置</span>
      </el-button>
      <el-button :disabled="selectedRows.length === 0" @click="handleBatchSupervise">
        <el-icon><i-ep-Bell /></el-icon><span>批量督办</span>
      </el-button>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button :disabled="timeLimitExportDisabled" :loading="timeLimitExportLoading" @click="handleExport">
          <el-icon><i-ep-Download /></el-icon><span>导出Excel</span>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 表格 -->
    <div v-loading="loading" element-loading-text="数据加载中...">
      <el-table :data="tableData" stripe highlight-current-row @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column prop="affairNo" label="事项编号" align="center" width="140" />

        <el-table-column prop="name" label="事项名称" align="center" min-width="180" show-overflow-tooltip />

        <el-table-column prop="department" label="受理部门" align="center" width="150" />

        <el-table-column prop="applicant" label="申报人" align="center" width="90" />

        <el-table-column prop="applyTime" label="申报时间" align="center" width="160" />

        <el-table-column prop="currentNode" label="当前环节" align="center" width="110" />

        <el-table-column prop="stepDuration" label="当前环节滞留时长" align="center" width="140" />

        <el-table-column prop="totalTime" label="总时限" align="center" width="80" />

        <el-table-column prop="usedTime" label="已耗时" align="center" width="80" />

        <el-table-column prop="remainingTime" label="剩余时限" align="center" width="80" />

        <el-table-column label="时效状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getTimeStatusType(row.timeStatus)">{{ row.timeStatusLabel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="办理状态" align="center" width="90">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <el-tag :type="getStatusType(row.status)">{{ row.statusLabel }}</el-tag>
              <el-tag v-if="row.superviseStatus" type="warning" size="small">已督办</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewTimeline(row)">查看时间轴</el-button>
            <el-button type="warning" link @click="handleSupervise(row)">发起督办</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
        </template>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination background v-model:current-page="Query.page" :page-size="Query.limit" :total="total" layout="total, prev, pager, next" @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 时间轴弹窗 -->
    <el-dialog v-model="timelineVisible" title="时效时间轴" width="720px" :close-on-click-modal="false" v-loading="timelineLoading" element-loading-text="加载中..." @closed="timelineData.value = { affair: null, steps: [], pauseRecords: [], correctionNodes: [] }">
      <template v-if="timelineData.affair">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="事项名称" :span="2">{{ timelineData.affair.name }}</el-descriptions-item>
            <el-descriptions-item label="受理部门">{{ timelineData.affair.department }}</el-descriptions-item>
            <el-descriptions-item label="当前环节">{{ timelineData.affair.currentNode }}</el-descriptions-item>
            <el-descriptions-item label="总时限">{{ timelineData.affair.totalTime }}</el-descriptions-item>
            <el-descriptions-item label="已耗时">{{ timelineData.affair.usedTime }}</el-descriptions-item>
            <el-descriptions-item label="剩余时限">{{ timelineData.affair.remainingTime }}</el-descriptions-item>
            <el-descriptions-item label="时效状态">
              <el-tag :type="getTimeStatusType(timelineData.affair.timeStatus)">{{ timelineData.affair.timeStatusLabel }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 办理流程时间轴 -->
        <h4 class="font-medium mb-2 flex items-center gap-1">
          <el-icon><i-ep-Timer /></el-icon>办理流程
        </h4>
        <div class="mb-4">
          <el-timeline>
            <el-timeline-item
              v-for="(step, index) in timelineData.steps"
              :key="index"
              :type="step.status === 'completed' ? 'success' : step.status === 'in_progress' ? 'primary' : 'info'"
              :color="step.status === 'completed' ? '#67C23A' : step.status === 'in_progress' ? '#409EFF' : '#C0C4CC'"
              :timestamp="step.time || '待进行'"
              placement="top"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ step.name }}</span>
                <span class="text-sm text-gray-500">{{ step.operator }}</span>
              </div>
              <p v-if="step.remark" class="text-sm text-gray-400 mt-1">{{ step.remark }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 暂停计时记录 -->
        <div v-if="timelineData.pauseRecords && timelineData.pauseRecords.length > 0" class="mb-4">
          <h4 class="font-medium mb-2 flex items-center gap-1">
            <el-icon><i-ep-VideoPause /></el-icon>暂停计时记录
          </h4>
          <el-table :data="timelineData.pauseRecords" border size="small">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="reason" label="暂停原因" min-width="160" />
            <el-table-column prop="startTime" label="暂停开始" width="170" align="center" />
            <el-table-column prop="endTime" label="暂停结束" width="170" align="center" />
            <el-table-column prop="duration" label="暂停时长" width="100" align="center" />
          </el-table>
        </div>

        <!-- 补正流转节点 -->
        <div v-if="timelineData.correctionNodes && timelineData.correctionNodes.length > 0">
          <h4 class="font-medium mb-2 flex items-center gap-1">
            <el-icon><i-ep-Edit /></el-icon>补正流转节点
          </h4>
          <el-table :data="timelineData.correctionNodes" border size="small">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="step" label="环节" width="100" align="center" />
            <el-table-column prop="content" label="补正内容" min-width="160" />
            <el-table-column prop="operator" label="操作人" width="100" align="center" />
            <el-table-column prop="time" label="操作时间" width="170" align="center" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'completed' ? '已完成' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 督办记录 -->
        <div v-if="timelineData.superviseLogs && timelineData.superviseLogs.length > 0" class="mt-4">
          <h4 class="font-medium mb-2 flex items-center gap-1">
            <el-icon><i-ep-Bell /></el-icon>督办记录
          </h4>
          <el-table :data="timelineData.superviseLogs" border size="small">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="content" label="督办内容" min-width="200" />
            <el-table-column prop="operator" label="操作人" width="100" align="center" />
            <el-table-column prop="time" label="操作时间" width="170" align="center" />
            <el-table-column label="督办状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'PENDING' ? 'warning' : 'success'" size="small">
                  {{ row.statusLabel || (row.status === 'PENDING' ? '待反馈' : '已办结') }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <template #footer>
        <el-button @click="timelineVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>