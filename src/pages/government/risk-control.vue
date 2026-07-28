<route>
  { meta: { title: "风险疑点台账" } }
</route>

<script setup lang="ts">
const Query = reactive({
  type: '',
  department: '',
  riskLevel: '',
  tag: '',
  auditStatus: 'PENDING',
  page: 1,
  limit: 10
})

const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)
const detailTabActive = ref('basic')

const departmentOptions = ['交通运输局', '住房和城乡建设局', '自然资源局', '城市管理局', '公安局交警支队', '发展和改革局', '文化和旅游局', '生态环境局', '教育局', '卫生健康局']
const riskLevelOptions = [{ label: '全部', value: '' }, { label: '低风险', value: 'LOW' }, { label: '中风险', value: 'MEDIUM' }, { label: '高风险', value: 'HIGH' }]
const typeOptions = [{ label: '全部', value: '' }, { label: '行政审批', value: 'APPROVAL' }, { label: '行政处罚', value: 'PENALTY' }, { label: '公共服务', value: 'SERVICE' }]
const tagOptions = [{ label: '全部', value: '' }, { label: '材料疑点', value: '材料疑点' }, { label: '裁量异常', value: '裁量异常' }, { label: '流程可疑', value: '流程可疑' }]

const getRiskType = (type: string) => {
  const map: Record<string, string> = { 'LOW': 'success', 'MEDIUM': 'warning', 'HIGH': 'danger' }
  return map[type] || 'info'
}

const getTagType = (tag: string) => {
  const map: Record<string, string> = { '材料疑点': '', '裁量异常': 'warning', '流程可疑': 'danger' }
  return map[tag] || 'info'
}

async function fetchList() {
  try {
    loading.value = true
    const res: any = await useAxios().get('/api/government/risk-control', { params: Query })
    tableData.value = res.items || []
    total.value = res.total || 0
    setRiskTotal(res.total || 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() { Query.page = 1; fetchList() }
function handleReset() {
  Query.type = ''
  Query.department = ''
  Query.riskLevel = ''
  Query.tag = ''
  Query.auditStatus = 'PENDING'
  Query.page = 1
  fetchList()
}
function handlePageChange(page: number) { Query.page = page; fetchList() }

// ---- 导出 ----
const riskColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '事项名称', field: 'name' },
  { label: '受理部门', field: 'department' },
  { label: '申报人', field: 'applicant' },
  { label: '风险标签', field: 'tags', formatter: (v: string[]) => (v || []).join('、') },
  { label: '风险等级', field: 'riskLevel', formatter: (v: string, row: any) => row.riskLevelLabel },
  { label: '核查状态', field: 'auditStatus', formatter: (v: string, row: any) => row.auditStatusLabel }
]
const {
  loading: riskExportLoading,
  handleExport,
  disabled: riskExportDisabled,
  setTotalCount: setRiskTotal
} = useExport(
  async () => {
    const res: any = await useAxios().get('/api/government/risk-control', { params: { ...Query, exportMode: true } })
    return res.items || []
  },
  riskColumns,
  '风险疑点台账',
  Query
)

function handleBatchMark() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要标记的事项')
    return
  }
  ElMessage.success(`已批量标记 ${selectedRows.value.length} 条事项为已核查`)
}

function handleAudit(row: any) {
  ElMessageBox.confirm(`确认对事项"${row.name}"发起核查督办？`, '发起督办', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async () => {
      await useAxios().post('/api/government/supervise-dispatch/add', {
        id: row.id,
        affairName: row.name,
        department: row.department,
        source: 'RISK_AUDIT',
        level: row.riskLevel === 'HIGH' ? 'URGENT' : 'IMPORTANT',
        assignee: '',
        deadline: ''
      })
      row.superviseStatus = true
      ElMessage.success(`已对事项"${row.name}"发起督办`)
    })
    .catch(() => {})
}

function handleBatchAudit() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要发起督办的事项')
    return
  }
  ElMessageBox.confirm(`确认对选中的 ${selectedRows.value.length} 条事项发起督办？`, '批量督办', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async () => {
      for (const row of selectedRows.value) {
        await useAxios().post('/api/government/supervise-dispatch/add', {
          id: row.id,
          affairName: row.name,
          department: row.department,
          source: 'RISK_AUDIT',
          level: row.riskLevel === 'HIGH' ? 'URGENT' : 'IMPORTANT',
          assignee: '',
          deadline: ''
        })
        row.superviseStatus = true
      }
      ElMessage.success(`已对 ${selectedRows.value.length} 条事项发起督办`)
      selectedRows.value = []
      fetchList()
    })
    .catch(() => {})
}

function handleViewDetail(row: any) {
  detailData.value = row
  detailTabActive.value = 'basic'
  detailDialogVisible.value = true
}

function handleSelectionChange(rows: any[]) { selectedRows.value = rows }

onMounted(() => fetchList())
</script>

<template>
  <div>
    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap mb-4">
      <el-select v-model="Query.type" placeholder="事项类型" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="Query.department" placeholder="受理部门" clearable style="width: 160px" @change="handleSearch">
        <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
      </el-select>
      <el-select v-model="Query.riskLevel" placeholder="风险等级" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="Query.tag" placeholder="风险标签" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon><span>搜索</span>
      </el-button>
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon><span>重置</span>
      </el-button>
      <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchMark">
        <el-icon><i-ep-Select /></el-icon><span>批量标记核查</span>
      </el-button>
      <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchAudit">
        <el-icon><i-ep-Bell /></el-icon><span>发起核查督办</span>
      </el-button>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button :disabled="riskExportDisabled" :loading="riskExportLoading" @click="handleExport">
          <el-icon><i-ep-Download /></el-icon><span>导出风险台账</span>
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
        <el-table-column label="风险标签" align="center" width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" :type="getTagType(tag)" class="mr-1">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskType(row.riskLevel)">{{ row.riskLevelLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核查状态" align="center" width="100">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <el-tag :type="row.auditStatus === 'DONE' ? 'success' : 'info'">{{ row.auditStatusLabel }}</el-tag>
              <el-tag v-if="row.superviseStatus" type="warning" size="small">已督办</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="260">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              <el-icon><i-ep-View /></el-icon><span>查看详情</span>
            </el-button>
            <el-button type="warning" link @click="handleAudit(row)">
              <el-icon><i-ep-Bell /></el-icon><span>发起核查督办</span>
            </el-button>
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

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="风险疑点详情" width="700px" destroy-on-close>
      <template v-if="detailData">
        <el-tabs v-model="detailTabActive">
          <el-tab-pane label="基础信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="事项名称" :span="2">{{ detailData.name }}</el-descriptions-item>
              <el-descriptions-item label="受理部门">{{ detailData.department }}</el-descriptions-item>
              <el-descriptions-item label="申报人">{{ detailData.applicant }}</el-descriptions-item>
              <el-descriptions-item label="事项类型">{{ detailData.typeLabel }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="getRiskType(detailData.riskLevel)">{{ detailData.riskLevelLabel }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="触发规则" name="rules">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="风险标签">
                <template v-if="detailData.tags && detailData.tags.length">
                  <el-tag v-for="tag in detailData.tags" :key="tag" :type="getTagType(tag)" class="mr-1">{{ tag }}</el-tag>
                </template>
                <span v-else class="text-gray-400">无</span>
              </el-descriptions-item>
              <el-descriptions-item label="触发规则说明">
                {{ detailData.ruleDescription || '暂无触发规则说明' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="申报材料预览" name="materials">
            <el-table :data="detailData.materials || []" stripe>
              <el-table-column label="序号" type="index" width="60" align="center" />
              <el-table-column label="材料名称" prop="name" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link>
                    <el-icon><i-ep-Download /></el-icon><span>预览</span>
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无申报材料" :image-size="60" />
              </template>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="历史审批意见" name="opinions">
            <el-timeline>
              <el-timeline-item
                v-for="(opinion, index) in detailData.opinions || []"
                :key="index"
                :timestamp="opinion.time"
                :type="opinion.type === 'AGREE' ? 'success' : 'danger'"
              >
                <p class="mb-1">{{ opinion.content }}</p>
                <p class="text-sm text-gray-400">{{ opinion.operator }} · {{ opinion.dept }}</p>
              </el-timeline-item>
              <template v-if="!detailData.opinions || detailData.opinions.length === 0">
                <el-empty description="暂无历史审批意见" :image-size="60" />
              </template>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </div>
</template>