<route>
{
  meta: { title: "首页", middleware: "log" }
}
</route>

<template>
  <div>
    <!-- 时间筛选 -->
    <div class="mb-4 flex items-center gap-3">
      <el-radio-group v-model="timeRange" @change="handleTimeChange">
        <el-radio-button value="year">年度</el-radio-button>
        <el-radio-button value="custom">自定义区间</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="timeRange === 'year'"
        v-model="selectedYear"
        type="year"
        placeholder="选择年份"
        @change="handleTimeChange"
      />
      <template v-if="timeRange === 'custom'">
        <el-date-picker v-model="customRange" type="daterange" range-separator="至"
          start-placeholder="开始日期" end-placeholder="结束日期" @change="handleTimeChange" />
      </template>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card cursor-pointer" :class="{ 'stat-card--active': activeCard === 'PENDING' }" @click="drillDown('PENDING')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待办事项</p>
              <p class="text-2xl font-bold text-orange-500">{{ stats.pending }}</p>
            </div>
            <el-icon size="40" color="#e6a23c"><i-ep-Clock /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card cursor-pointer" :class="{ 'stat-card--active': activeCard === 'IN_PROGRESS' }" @click="drillDown('IN_PROGRESS')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">进行中</p>
              <p class="text-2xl font-bold text-blue-500">{{ stats.inProgress }}</p>
            </div>
            <el-icon size="40" color="#409eff"><i-ep-Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card cursor-pointer" :class="{ 'stat-card--active': activeCard === 'COMPLETED' }" @click="drillDown('COMPLETED')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">已办结</p>
              <p class="text-2xl font-bold text-green-500">{{ stats.completed }}</p>
            </div>
            <el-icon size="40" color="#67c23a"><i-ep-CircleCheck /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card--overdue cursor-pointer" :class="{ 'stat-card--active': activeCard === 'OVERDUE' }" @click="drillDown('OVERDUE')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">逾期事项</p>
              <p class="text-2xl font-bold text-red-500">{{ stats.overdue }}</p>
            </div>
            <el-icon size="40" color="#f56c6c"><i-ep-WarningFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="font-semibold">月度受理事项统计</span>
          </template>
          <div ref="barChartRef" class="h-[350px]"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="font-semibold">办结趋势</span>
          </template>
          <div ref="lineChartRef" class="h-[350px]"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { useAffairsStoreHook } from '@/store/modules/affairs'

const affairsStore = useAffairsStoreHook()
const router = useRouter()
const barChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()

const stats = reactive({ pending: 0, inProgress: 0, completed: 0, overdue: 0 })
const activeCard = ref('')

const barChart = ref<echarts.ECharts>()
const lineChart = ref<echarts.ECharts>()

// 时间筛选
const timeRange = ref('year')
const selectedYear = ref(new Date())
const customRange = ref<any[]>([])

function handleTimeChange() {
  // 模拟不同时间段的图表数据更新
  initBarChart()
  initLineChart()
}

// 下钻跳转
function drillDown(status: string) {
  activeCard.value = status
  affairsStore.setSearch('', status, 1)
  router.push('/example/formkit')
}

// 获取统计数据
async function fetchStats() {
  try {
    const res: any = await useAxios().get('/api/affairs/list', { params: { page: 1, limit: 100 } })
    const items = res.items || []
    stats.pending = items.filter((i: any) => i.status === 'PENDING').length
    stats.inProgress = items.filter((i: any) => i.status === 'IN_PROGRESS').length
    stats.completed = items.filter((i: any) => i.status === 'COMPLETED').length
    stats.overdue = items.filter((i: any) => i.status === 'OVERDUE').length
  } catch {
    stats.pending = 5; stats.inProgress = 4; stats.completed = 3; stats.overdue = 1
  }
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
const applyData = [120, 132, 101, 134, 90, 230, 210]
const completedData = [100, 115, 85, 120, 78, 200, 180]

function getCompletionRate(idx: number) {
  const a = applyData[idx]
  const c = completedData[idx]
  return a > 0 ? ((c / a) * 100).toFixed(1) : '0.0'
}

function initBarChart() {
  if (!barChartRef.value) return
  if (barChart.value) barChart.value.dispose()
  barChart.value = echarts.init(barChartRef.value)
  barChart.value.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const idx = params[0]?.dataIndex
        const rate = getCompletionRate(idx)
        let html = `<b>${months[idx]}</b><br/>`
        params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${p.value}<br/>` })
        html += `<span style="color:#909399">办结率: ${rate}%</span>`
        return html
      }
    },
    legend: { data: ['受理事项', '已办结'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '受理事项', type: 'bar', data: applyData, itemStyle: { color: '#409eff' } },
      { name: '已办结', type: 'bar', data: completedData, itemStyle: { color: '#67c23a' } }
    ]
  })
}

function initLineChart() {
  if (!lineChartRef.value) return
  if (lineChart.value) lineChart.value.dispose()
  lineChart.value = echarts.init(lineChartRef.value)
  lineChart.value.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const idx = params[0]?.dataIndex
        const rate = getCompletionRate(idx)
        let html = `<b>${months[idx]}</b><br/>`
        params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${p.value}<br/>` })
        html += `<span style="color:#909399">办结率: ${rate}%</span>`
        return html
      }
    },
    legend: { data: ['受理量', '办结量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      { name: '受理量', type: 'line', smooth: true, data: applyData, itemStyle: { color: '#409eff' } },
      { name: '办结量', type: 'line', smooth: true, data: completedData, itemStyle: { color: '#67c23a' } }
    ]
  })
}

// 窗口自适应
let resizeTimer: any = null
function handleResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    barChart.value?.resize()
    lineChart.value?.resize()
  }, 200)
}

onMounted(async () => {
  await fetchStats()
  nextTick(() => {
    initBarChart()
    initLineChart()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  barChart.value?.dispose()
  lineChart.value?.dispose()
})
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.stat-card--active {
  border-color: #409eff;
}
.stat-card--overdue {
  animation: overduePulse 2s infinite;
}
@keyframes overduePulse {
  0%, 100% { border-color: #f56c6c; }
  50% { border-color: #fab6b6; box-shadow: 0 0 8px rgba(245, 108, 108, 0.3); }
}
</style>
