<route>
  { meta: { title: "流程审计检索" } }
</route>

<script setup lang="ts">
const Query = reactive({
  name: '',
  applicant: '',
  department: '',
  dateRange: [] as string[],
  page: 1,
  limit: 10
})

const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])

const departmentOptions = ['交通运输局', '住房和城乡建设局', '自然资源局', '城市管理局', '公安局交警支队', '发展和改革局', '文化和旅游局', '生态环境局', '教育局', '卫生健康局']

// 是否已执行搜索（导出按钮禁空条件校验）
const hasSearched = ref(false)

async function fetchList() {
  try {
    loading.value = true
    const params: any = { ...Query }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    const res: any = await useAxios().get('/api/government/process-audit', { params })
    tableData.value = res.items || []
    total.value = res.total || 0
    setAuditTotal(res.total || 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() { hasSearched.value = true; Query.page = 1; fetchList() }
function handleReset() {
  hasSearched.value = false
  Query.name = ''
  Query.applicant = ''
  Query.department = ''
  Query.dateRange = []
  Query.page = 1
  tableData.value = []
  total.value = 0
  setAuditTotal(0)
}
function handlePageChange(page: number) { Query.page = page; fetchList() }

// ---- 导出（流程审计检索：强制空条件禁用导出，防止全量泄露） ----
const auditColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '事项名称', field: 'name' },
  { label: '受理部门', field: 'department' },
  { label: '申报时间', field: 'applyTime' },
  { label: '操作环节', field: 'step' },
  { label: '变更摘要', field: 'summary' },
  { label: '当前状态', field: 'status', formatter: (v: string, row: any) => row.statusLabel },
  { label: '操作人', field: 'operator' },
  { label: '最新操作时间', field: 'operateTime' },
  { label: '操作行为', field: 'action' },
  { label: '操作IP', field: 'ip' }
]
const {
  loading: auditExportLoading,
  handleExport,
  disabled: auditExportDisabled,
  setTotalCount: setAuditTotal
} = useExport(
  async () => {
    const params: any = { ...Query, exportMode: true }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startTime = params.dateRange[0]
      params.endTime = params.dateRange[1]
    }
    delete params.dateRange
    const res: any = await useAxios().get('/api/government/process-audit', { params })
    return res.items || []
  },
  auditColumns,
  '流程审计日志',
  Query
)

function handleViewFlow(row: any) { ElMessage.info(`查看事项"${row.name}"的完整流程轨迹`) }
</script>

<template>
  <div>
    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap mb-4">
      <el-input v-model="Query.name" placeholder="事项名称" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-input v-model="Query.applicant" placeholder="申报人" clearable style="width: 140px" @keyup.enter="handleSearch" />
      <el-select v-model="Query.department" placeholder="受理部门" clearable style="width: 160px">
        <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
      </el-select>
      <el-date-picker
        v-model="Query.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="操作开始日期"
        end-placeholder="操作结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        clearable
      />
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon><span>搜索</span>
      </el-button>
      
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon><span>重置</span>
      </el-button>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button :disabled="!hasSearched || auditExportDisabled" :loading="auditExportLoading" @click="handleExport">
          <el-icon><i-ep-Download /></el-icon><span>导出审计日志</span>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 表格 -->
    <div v-loading="loading" element-loading-text="数据加载中...">
      <el-table :data="tableData" stripe highlight-current-row>
        <el-table-column prop="affairNo" label="事项编号" align="center" width="140" />
        <el-table-column prop="name" label="事项名称" align="center" min-width="160" show-overflow-tooltip />
        <el-table-column prop="department" label="受理部门" align="center" width="130" />
        <el-table-column prop="applyTime" label="申报时间" align="center" width="160" />
        <el-table-column prop="step" label="操作环节" align="center" width="120" />
        <el-table-column prop="summary" label="变更摘要" align="center" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="当前状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" align="center" width="100" />
        <el-table-column prop="operateTime" label="最新操作时间" align="center" width="160" />
        <el-table-column prop="action" label="操作行为" align="center" width="120" />
        <el-table-column prop="ip" label="操作IP" align="center" width="140" />
        <el-table-column label="操作" align="center" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewFlow(row)">
              <el-icon><i-ep-View /></el-icon><span>查看流程轨迹</span>
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size="80">
            <p class="text-gray-500">请输入检索条件，点击搜索查询审计日志</p>
          </el-empty>
        </template>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination background v-model:current-page="Query.page" :page-size="Query.limit" :total="total" layout="total, prev, pager, next" @current-change="handlePageChange" />
      </div>
    </div>
  </div>
</template>