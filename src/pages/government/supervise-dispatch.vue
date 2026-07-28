<route>
  { meta: { title: "督办调度中心" } }
</route>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const Query = reactive({
  source: '',
  level: '',
  status: '',
  page: 1,
  limit: 10
})

const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const sourceOptions = [{ label: '全部', value: '' }, { label: '时效预警', value: 'TIME_WARNING' }, { label: '流程违规', value: 'PROCESS_VIOLATION' }, { label: '风险线索', value: 'RISK_CLUE' }]
const levelOptions = [{ label: '全部', value: '' }, { label: '普通', value: 'NORMAL' }, { label: '重要', value: 'IMPORTANT' }, { label: '紧急', value: 'URGENT' }]
const statusOptions = [{ label: '全部', value: '' }, { label: '待处置', value: 'PENDING' }, { label: '处置中', value: 'IN_PROGRESS' }, { label: '已销号', value: 'CLOSED' }]

const getLevelType = (level: string) => {
  const map: Record<string, string> = { 'NORMAL': 'info', 'IMPORTANT': 'warning', 'URGENT': 'danger' }
  return map[level] || 'info'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { 'PENDING': 'danger', 'IN_PROGRESS': 'warning', 'CLOSED': 'success' }
  return map[status] || 'info'
}

// 行样式预警
const rowStyle = (row: any) => {
  const now = Date.now()
  const deadline = new Date(row.deadline).getTime()
  const threeDays = 3 * 24 * 60 * 60 * 1000

  // 超过截止时间未处置
  if (row.status !== 'CLOSED' && deadline < now) {
    return { background: '#fef0f0' }
  }
  // 距离截止时间 ≤ 3天
  if (deadline - now <= threeDays && deadline >= now) {
    return { background: '#fdf6ec' }
  }
  return {}
}

// 新增督办单弹窗
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const formRef = ref()
const formData = reactive({
  affairName: '',
  source: '',
  level: 'NORMAL',
  assignee: '',
  deadline: ''
})

const formRules = {
  affairName: [{ required: true, message: '请输入关联事项名称', trigger: 'blur' }],
  source: [{ required: true, message: '请选择督办来源', trigger: 'change' }],
  level: [{ required: true, message: '请选择督办级别', trigger: 'change' }],
  assignee: [{ required: true, message: '请输入派发对象', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止处置时间', trigger: 'change' }]
}

function openAddDialog() {
  // 重置表单
  formData.affairName = ''
  formData.source = ''
  formData.level = 'NORMAL'
  formData.assignee = ''
  formData.deadline = ''

  // 接收路由 query 参数 affairName，自动填入
  const affairName = route.query.affairName as string
  if (affairName) {
    formData.affairName = affairName
  }

  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    dialogLoading.value = true
    await useAxios().post('/api/government/supervise-dispatch', formData)
    ElMessage.success('新增督办单成功')
    dialogVisible.value = false
    fetchList()
  } catch (err: any) {
    if (err?.message) ElMessage.error(err.message)
  } finally {
    dialogLoading.value = false
  }
}

async function fetchList() {
  try {
    loading.value = true
    const res: any = await useAxios().get('/api/government/supervise-dispatch', { params: Query })
    tableData.value = res.items || []
    total.value = res.total || 0
    setDispatchTotal(res.total || 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() { Query.page = 1; fetchList() }
function handleReset() { Query.source = ''; Query.level = ''; Query.status = ''; Query.page = 1; fetchList() }
function handlePageChange(page: number) { Query.page = page; fetchList() }
function handleSelectionChange(rows: any[]) { selectedRows.value = rows }

// ---- 导出 ----
const dispatchColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '关联事项名称', field: 'affairName' },
  { label: '督办来源', field: 'sourceLabel' },
  { label: '督办级别', field: 'levelLabel' },
  { label: '派发对象', field: 'assignee' },
  { label: '发起时间', field: 'createTime' },
  { label: '截止处置时间', field: 'deadline' },
  { label: '处置状态', field: 'statusLabel' }
]
const {
  loading: dispatchExportLoading,
  handleExport,
  disabled: dispatchExportDisabled,
  setTotalCount: setDispatchTotal
} = useExport(
  async () => {
    const res: any = await useAxios().get('/api/government/supervise-dispatch', { params: { ...Query, exportMode: true } })
    return res.items || []
  },
  dispatchColumns,
  '督办台账',
  Query
)

function handleViewDetail(row: any) { ElMessage.info(`查看督办单详情：${row.name || row.affairName}`) }
function handleClose(row: any) { ElMessage.info(`审核销号：${row.name || row.affairName}`) }

onMounted(() => fetchList())
</script>

<template>
  <div>
    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap mb-4">
      <el-select v-model="Query.source" placeholder="督办来源" clearable style="width: 160px" @change="handleSearch">
        <el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="Query.level" placeholder="督办级别" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="Query.status" placeholder="处置状态" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon><span>搜索</span>
      </el-button>
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon><span>重置</span>
      </el-button>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><i-ep-Plus /></el-icon><span>新增督办单</span>
      </el-button>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button :disabled="dispatchExportDisabled" :loading="dispatchExportLoading" @click="handleExport">
          <el-icon><i-ep-Download /></el-icon><span>导出督办台账</span>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 表格 -->
    <div v-loading="loading" element-loading-text="数据加载中...">
      <el-table
        :data="tableData"
        stripe
        highlight-current-row
        :row-style="rowStyle"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" align="center" width="50" />
        <el-table-column prop="affairNo" label="事项编号" align="center" width="140" />
        <el-table-column prop="affairName" label="关联事项名称" align="center" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sourceLabel" label="督办来源" align="center" width="120" />
        <el-table-column label="督办级别" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">{{ row.levelLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="派发对象" align="center" width="120" />
        <el-table-column prop="createTime" label="发起时间" align="center" width="160" />
        <el-table-column label="截止处置时间" align="center" width="160">
          <template #default="{ row }">
            <span
              :style="{
                color: row.status !== 'CLOSED' && new Date(row.deadline).getTime() < Date.now()
                  ? '#F56C6C'
                  : row.status !== 'CLOSED' && new Date(row.deadline).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000
                    ? '#E6A23C'
                    : 'inherit'
              }"
            >{{ row.deadline }}</span>
          </template>
        </el-table-column>
        <el-table-column label="处置状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              <el-icon><i-ep-View /></el-icon>查看详情
            </el-button>
            <el-button type="success" link :disabled="row.status === 'CLOSED'" @click="handleClose(row)">
              <el-icon><i-ep-Select /></el-icon>审核销号
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
        </template>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          background
          v-model:current-page="Query.page"
          :page-size="Query.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增督办单弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增督办单" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="right">
        <el-form-item label="关联事项名称" prop="affairName">
          <el-input v-model="formData.affairName" placeholder="请输入关联事项名称" />
        </el-form-item>
        <el-form-item label="督办来源" prop="source">
          <el-select v-model="formData.source" placeholder="请选择督办来源" style="width: 100%">
            <el-option v-for="item in sourceOptions.filter(o => o.value)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="督办级别" prop="level">
          <el-select v-model="formData.level" placeholder="请选择督办级别" style="width: 100%">
            <el-option label="普通" value="NORMAL" />
            <el-option label="重要" value="IMPORTANT" />
            <el-option label="紧急" value="URGENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="派发对象" prop="assignee">
          <el-input v-model="formData.assignee" placeholder="请输入派发对象" />
        </el-form-item>
        <el-form-item label="截止处置时间" prop="deadline">
          <el-date-picker
            v-model="formData.deadline"
            type="datetime"
            placeholder="请选择截止处置时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>