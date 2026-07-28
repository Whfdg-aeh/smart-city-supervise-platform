<route>
    { meta: { title: "事项管理" } }
</route>

<script setup lang="ts">
import { useAffairsStoreHook } from '@/store/modules/affairs'

const affairsStore = useAffairsStoreHook()

const Query = reactive({
  name: affairsStore.searchName,
  status: affairsStore.searchStatus,
  page: affairsStore.currentPage,
  limit: 10
})
const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])

// 表格多选
const selectedRows = ref<any[]>([])

// 编辑弹窗
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogTitle = ref('新增事项')
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  department: '',
  contact: '',
  phone: '',
  description: '',
  status: 'PENDING'
})

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref<any>({})

const formRules = {
  name: [{ required: true, message: '请输入事项名称', trigger: 'blur' }],
  department: [{ required: true, message: '请选择受理部门', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择办理状态', trigger: 'change' }]
}

const departmentOptions = [
  '交通运输局', '住房和城乡建设局', '自然资源局', '城市管理局',
  '公安局交警支队', '发展和改革局', '文化和旅游局', '生态环境局',
  '教育局', '卫生健康局', '人力资源和社会保障局', '市场监督管理局'
]

const statusOptions = [
  { label: '待办', value: 'PENDING' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '已办结', value: 'COMPLETED' },
  { label: '逾期', value: 'OVERDUE' }
]

const getStatusType = (status: string) => {
  const map: Record<string, string> = { 'PENDING': 'warning', 'IN_PROGRESS': '', 'COMPLETED': 'success', 'OVERDUE': 'danger' }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status
}

const isCompleted = (row: any) => row.status === 'COMPLETED'

// ---- 导出 ----
const affairsColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '事项名称', field: 'name' },
  { label: '受理部门', field: 'department' },
  { label: '申报人', field: 'applicant' },
  { label: '申报时间', field: 'applyTime' },
  { label: '办理状态', field: 'status', formatter: (v: string, row: any) => row.statusLabel }
]
const {
  loading: affairsExportLoading,
  handleExport,
  disabled: affairsExportDisabled,
  setTotalCount: setAffairsTotal
} = useExport(
  async () => {
    const res: any = await useAxios().get('/api/affairs/list', { params: { ...Query, exportMode: true } })
    return res.items || []
  },
  affairsColumns,
  '事项管理台账',
  Query
)

// 获取列表数据
async function fetchList() {
  try {
    loading.value = true
    const res: any = await useAxios().get('/api/affairs/list', { params: Query })
    tableData.value = res.items || []
    total.value = res.total || 0
    setAffairsTotal(res.total || 0)
  } finally {
    loading.value = false
  }
}

// 搜索（回车触发 + 按钮触发）
function handleSearch() {
  Query.page = 1
  affairsStore.setSearch(Query.name, Query.status, Query.page)
  fetchList()
}

// 重置：清空所有条件 + 页数归1 + 刷新
function handleReset() {
  Query.name = ''
  Query.status = ''
  Query.page = 1
  affairsStore.resetSearch()
  fetchList()
}

// 表格行点击 → 详情弹窗
function handleRowClick(row: any) {
  detailData.value = row
  detailVisible.value = true
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增事项'
  Object.assign(formData, { id: undefined, name: '', department: '', contact: '', phone: '', description: '', status: 'PENDING' })
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

// 编辑
function handleEdit(row: any) {
  dialogTitle.value = '编辑事项'
  Object.assign(formData, {
    id: row.id, name: row.name, department: row.department,
    contact: row.contact || row.applicant, phone: row.phone || '',
    description: row.description, status: row.status
  })
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

// 删除
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除事项"${row.name}"吗？`, '提示', { type: 'warning' })
    await useAxios().delete('/api/affairs/delete', { params: { id: row.id } })
    ElMessage.success('删除成功')
    fetchList()
  } catch { /* 取消删除 */ }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的事项')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条事项吗？`, '批量删除', { type: 'warning' })
    // 批量调用删除接口
    const ids = selectedRows.value.map(r => r.id)
    for (const id of ids) {
      await useAxios().delete('/api/affairs/delete', { params: { id } })
    }
    ElMessage.success(`成功删除 ${ids.length} 条事项`)
    selectedRows.value = []
    fetchList()
  } catch { /* 取消删除 */ }
}

// 表格多选变化
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    dialogLoading.value = true
    if (formData.id) {
      await useAxios().put('/api/affairs/update', formData)
    } else {
      await useAxios().post('/api/affairs/add', formData)
    }
    ElMessage.success(formData.id ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchList()
  } catch { /* 表单校验失败 */ }
  finally { dialogLoading.value = false }
}

function handlePageChange(page: number) {
  Query.page = page
  affairsStore.setSearch(Query.name, Query.status, page)
  fetchList()
}

// 初始化：恢复缓存条件
onMounted(() => {
  Query.name = affairsStore.searchName
  Query.status = affairsStore.searchStatus
  Query.page = affairsStore.currentPage
  fetchList()
})
</script>

<template>
  <div>
    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap">
      <el-input v-model="Query.name" placeholder="事项名称" clearable style="width: 220px" @keyup.enter="handleSearch" @clear="handleSearch" />
      <el-select v-model="Query.status" placeholder="事项办理状态" clearable style="width: 180px" @change="handleSearch">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon>
        <span>搜索</span>
      </el-button>
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon>
        <span>重置</span>
      </el-button>
      <el-button type="primary" @click="handleAdd">
        <el-icon><i-ep-Plus /></el-icon>
        <span>新增</span>
      </el-button>
      <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
        <el-icon><i-ep-Delete /></el-icon>
        <span>批量删除</span>
      </el-button>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button :disabled="affairsExportDisabled" :loading="affairsExportLoading" @click="handleExport">
          <el-icon><i-ep-Download /></el-icon>
          <span>导出Excel</span>
        </el-button>
      </el-tooltip>
      <el-button @click="handleDownloadTemplate">
        <el-icon><i-ep-Upload /></el-icon>
        <span>导入模板下载</span>
      </el-button>
    </div>

    <!-- 表格区域 -->
    <div class="mt-4" v-loading="loading" element-loading-text="数据加载中...">
      <el-table
        :data="tableData"
        stripe
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        highlight-current-row
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column prop="affairNo" label="事项编号" align="center" width="140" />

        <el-table-column prop="name" label="事项名称" align="center" min-width="200" show-overflow-tooltip />

        <el-table-column prop="department" label="受理部门" align="center" width="160" />

        <el-table-column prop="applicant" label="申报人" align="center" width="100" />

        <el-table-column prop="applyTime" label="申报时间" align="center" width="170" sortable />

        <el-table-column label="办理状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="150">
          <template #default="{ row }">
            <el-button type="primary" link :disabled="isCompleted(row)" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <el-empty description="暂无数据" :image-size="80">
            <el-button type="primary" @click="handleAdd">新增事项</el-button>
          </el-empty>
        </template>
      </el-table>

      <!-- 分页 -->
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" :close-on-click-modal="false" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="事项名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入事项名称" />
        </el-form-item>
        <el-form-item label="受理部门" prop="department">
          <el-select v-model="formData.department" placeholder="请选择受理部门" class="w-full">
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="formData.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="事项描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入事项描述" />
        </el-form-item>
        <el-form-item label="办理状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择办理状态" class="w-full">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="dialogLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 事项详情弹窗 -->
    <el-dialog v-model="detailVisible" title="事项详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="事项名称" :span="2">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="受理部门">{{ detailData.department }}</el-descriptions-item>
        <el-descriptions-item label="办理状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusLabel(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申报人">{{ detailData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申报时间">{{ detailData.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="联系人" :span="2">{{ detailData.contact || detailData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="联系电话" :span="2">{{ detailData.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="事项描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
