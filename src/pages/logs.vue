<route>
    { meta: { title: "操作日志" } }
</route>

<template>
  <div>
    <!-- 搜索区域 -->
    <div class="flex items-center gap-4 flex-wrap mb-4">
      <el-input v-model="query.keyword" placeholder="操作人 / 操作内容" clearable style="width: 220px" />
      <el-date-picker v-model="query.dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      <el-button type="warning" @click="handleSearch">
        <el-icon><i-ep-Search /></el-icon>搜索
      </el-button>
      <el-button @click="handleReset">
        <el-icon><i-ep-Refresh /></el-icon>重置
      </el-button>
    </div>

    <!-- 表格 -->
    <div v-loading="loading" element-loading-text="加载中...">
      <el-table :data="tableData" stripe>
        <el-table-column label="序号" align="center" width="70">
          <template #default="{ $index }">{{ (query.page - 1) * query.limit + $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" align="center" width="120" />
        <el-table-column prop="action" label="操作类型" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="actionTypeMap[row.action]">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="操作内容" align="center" min-width="200" show-overflow-tooltip />
        <el-table-column prop="module" label="操作模块" align="center" width="120" />
        <el-table-column prop="ip" label="IP地址" align="center" width="140" />
        <el-table-column prop="createTime" label="操作时间" align="center" width="170" sortable />

        <template #empty>
          <el-empty description="暂无操作日志" :image-size="80" />
        </template>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          background
          v-model:current-page="query.page"
          :page-size="query.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const query = reactive({
  keyword: '',
  dateRange: [] as any[],
  page: 1,
  limit: 10
})
const total = ref(0)
const loading = ref(false)
const tableData = ref<any[]>([])

const actionTypeMap: Record<string, string> = {
  '新增': 'success',
  '修改': 'warning',
  '删除': 'danger',
  '登录': '',
  '导出': 'info'
}

async function fetchList() {
  try {
    loading.value = true
    // 模拟数据
    await new Promise(r => setTimeout(r, 500))
    const demoLogs = [
      { id: 1, operator: '张三', action: '新增', content: '新增事项：城市道路改扩建项目审批', module: '事项管理', ip: '192.168.1.100', createTime: '2026-07-27 14:30:00' },
      { id: 2, operator: '张三', action: '修改', content: '修改事项状态：老旧小区电梯加装备案 → 进行中', module: '事项管理', ip: '192.168.1.100', createTime: '2026-07-27 11:20:00' },
      { id: 3, operator: '李四', action: '删除', content: '删除事项：测试数据事项', module: '事项管理', ip: '192.168.1.101', createTime: '2026-07-27 10:05:00' },
      { id: 4, operator: '张三', action: '登录', content: '用户登录系统', module: '系统登录', ip: '192.168.1.100', createTime: '2026-07-27 09:00:00' },
      { id: 5, operator: '张三', action: '导出', content: '导出事项列表Excel', module: '事项管理', ip: '192.168.1.100', createTime: '2026-07-26 17:45:00' },
      { id: 6, operator: '李四', action: '新增', content: '新增事项：公共停车场建设审批', module: '事项管理', ip: '192.168.1.101', createTime: '2026-07-26 15:30:00' },
      { id: 7, operator: '张三', action: '修改', content: '修改个人信息', module: '个人中心', ip: '192.168.1.100', createTime: '2026-07-26 14:00:00' },
      { id: 8, operator: '李四', action: '登录', content: '用户登录系统', module: '系统登录', ip: '192.168.1.101', createTime: '2026-07-26 08:30:00' }
    ]

    let filtered = [...demoLogs]
    if (query.keyword) {
      filtered = filtered.filter(l => l.operator.includes(query.keyword) || l.content.includes(query.keyword))
    }

    total.value = filtered.length
    const start = (query.page - 1) * query.limit
    tableData.value = filtered.slice(start, start + query.limit)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.dateRange = []
  query.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  query.page = page
  fetchList()
}

onMounted(() => fetchList())
</script>
