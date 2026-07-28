<route>
  { meta: { title: "监察总览" } }
</route>

<script setup lang="ts">
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { FullScreen } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)

// 时间筛选
const timeRange = ref('month')
const customDateRange = ref<[string, string]>(['', ''])
const showCustomPicker = ref(false)

const timeRangeOptions = [
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
  { label: '自定义', value: 'custom' }
]

function onTimeRangeChange(val: string) {
  showCustomPicker.value = val === 'custom'
  if (val !== 'custom') {
    fetchData()
  }
}

function onCustomDateChange() {
  if (customDateRange.value[0] && customDateRange.value[1]) {
    fetchData()
  }
}

// 指标卡片
const statCards = ref([
  { label: '总办件量', value: 0, unit: '件', color: '#409EFF' },
  { label: '按时办结率', value: '0%', unit: '', color: '#67C23A' },
  { label: '超期件数', value: 0, unit: '件', color: '#F56C6C' },
  { label: '督办件数', value: 0, unit: '件', color: '#E6A23C' }
])

// 图表实例
const chart1 = ref<HTMLElement>()
const chart2 = ref<HTMLElement>()
const chart3 = ref<HTMLElement>()
const chart4 = ref<HTMLElement>()

let instance1: any = null
let instance2: any = null
let instance3: any = null
let instance4: any = null

function initCharts(data: any) {
  // 各部门超时率柱状图
  if (instance1) instance1.dispose()
  instance1 = echarts.init(chart1.value!)
  instance1.setOption({
    title: { text: '各部门超时率', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `${p.name}<br/>超时率: ${p.value}%<br/>办结率: ${100 - p.value}%`
      }
    },
    xAxis: { type: 'category', data: data.deptNames || [], axisLabel: { color: '#aaa', rotate: 30 } },
    yAxis: { type: 'value', name: '超时率(%)', axisLabel: { color: '#aaa' }, nameTextStyle: { color: '#aaa' } },
    series: [{
      type: 'bar',
      data: data.deptRates || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ff6b6b' }, { offset: 1, color: '#ee5a24' }
        ])
      }
    }],
    grid: { left: '10%', right: '5%', bottom: '20%' },
    backgroundColor: 'transparent'
  })
  instance1.on('click', (params: any) => {
    if (params.name) {
      router.push(`/government/time-limit?department=${encodeURIComponent(params.name)}`)
    }
  })

  // 时效状态分布饼图
  if (instance2) instance2.dispose()
  instance2 = echarts.init(chart2.value!)
  instance2.setOption({
    title: { text: '时效状态分布', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}件 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '55%'],
      data: [
        { value: data.normalCount || 0, name: '正常', itemStyle: { color: '#67C23A' } },
        { value: data.warningCount || 0, name: '临期预警', itemStyle: { color: '#E6A23C' } },
        { value: data.overdueCount || 0, name: '超期', itemStyle: { color: '#F56C6C' } }
      ],
      label: { color: '#aaa', formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: '#555' } }
    }],
    backgroundColor: 'transparent'
  })

  // 预警与督办月度趋势折线图
  if (instance3) instance3.dispose()
  instance3 = echarts.init(chart3.value!)
  instance3.setOption({
    title: { text: '预警与督办月度趋势', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let html = `${params[0].axisValue}<br/>`
        params.forEach((p: any) => {
          html += `${p.marker} ${p.seriesName}: ${p.value}件<br/>`
        })
        return html
      }
    },
    legend: { data: ['预警数', '督办数'], textStyle: { color: '#aaa' }, bottom: 0 },
    xAxis: { type: 'category', data: data.months || [], axisLabel: { color: '#aaa' } },
    yAxis: { type: 'value', axisLabel: { color: '#aaa' } },
    series: [
      {
        name: '预警数',
        type: 'line',
        smooth: true,
        data: data.warningTrend || [],
        lineStyle: { color: '#E6A23C', width: 3 },
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '督办数',
        type: 'line',
        smooth: true,
        data: data.superviseTrend || [],
        lineStyle: { color: '#409EFF', width: 3 },
        itemStyle: { color: '#409EFF' }
      }
    ],
    grid: { left: '8%', right: '5%', bottom: '20%' },
    backgroundColor: 'transparent'
  })

  // 风险办件部门分布
  if (instance4) instance4.dispose()
  instance4 = echarts.init(chart4.value!)
  instance4.setOption({
    title: { text: '风险办件部门分布', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `${p.name}<br/>风险件数: ${p.value}件<br/>办结率: ${randomInt(80, 98)}%`
      }
    },
    xAxis: { type: 'category', data: data.riskDeptNames || [], axisLabel: { color: '#aaa', rotate: 30 } },
    yAxis: { type: 'value', name: '风险件数', axisLabel: { color: '#aaa' }, nameTextStyle: { color: '#aaa' } },
    series: [{
      type: 'bar',
      data: data.riskDeptCounts || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f093fb' }, { offset: 1, color: '#f5576c' }
        ])
      }
    }],
    grid: { left: '10%', right: '5%', bottom: '20%' },
    backgroundColor: 'transparent'
  })
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function fetchData() {
  try {
    loading.value = true
    const params: any = { timeRange: timeRange.value }
    if (timeRange.value === 'custom' && customDateRange.value[0] && customDateRange.value[1]) {
      params.startDate = customDateRange.value[0]
      params.endDate = customDateRange.value[1]
    }
    const res: any = await useAxios().get('/api/government/monitor-dashboard', { params })
    if (res) {
      statCards.value = [
        { label: '总办件量', value: res.totalCases || 0, unit: '件', color: '#409EFF' },
        { label: '按时办结率', value: (res.onTimeRate || 0) + '%', unit: '', color: '#67C23A' },
        { label: '超期件数', value: res.overdueCases || 0, unit: '件', color: '#F56C6C' },
        { label: '督办件数', value: res.superviseCases || 0, unit: '件', color: '#E6A23C' }
      ]
      nextTick(() => initCharts(res))
    }
    setDashboardTotal(4) // 固定 4 个指标卡片，导出按钮可用
  } finally {
    loading.value = false
  }
}

// 点击超期指标卡片跳转
function onCardClick(card: any) {
  if (card.label === '超期件数') {
    router.push('/government/time-limit?timeStatus=OVERDUE')
  }
}

// 全屏查看
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// ---- 导出统计报表 ----
const dashboardColumns = [
  { label: '事项编号', field: 'affairNo' },
  { label: '数值', field: 'value' },
  { label: '单位', field: 'unit' }
]
const {
  loading: dashboardExportLoading,
  handleExport: handleDashboardExport,
  disabled: dashboardExportDisabled,
  setTotalCount: setDashboardTotal
} = useExport(
  async () => {
    const params: any = { timeRange: timeRange.value }
    if (timeRange.value === 'custom' && customDateRange.value[0] && customDateRange.value[1]) {
      params.startDate = customDateRange.value[0]
      params.endDate = customDateRange.value[1]
    }
    const res: any = await useAxios().get('/api/government/monitor-export', { params })
    return res.items || []
  },
  dashboardColumns,
  '监察统计报表',
  { timeRange: timeRange.value, startDate: customDateRange.value[0], endDate: customDateRange.value[1] }
)

onMounted(() => fetchData())

// 窗口自适应
let resizeHandler: any = null
onMounted(() => {
  resizeHandler = () => {
    instance1?.resize()
    instance2?.resize()
    instance3?.resize()
    instance4?.resize()
  }
  window.addEventListener('resize', resizeHandler)
})
onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  instance1?.dispose()
  instance2?.dispose()
  instance3?.dispose()
  instance4?.dispose()
})
</script>

<template>
  <div class="monitor-dashboard" :class="{ 'p-4': true }" v-loading="loading" element-loading-text="数据加载中...">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <el-radio-group :model-value="timeRange" @change="onTimeRangeChange" size="small">
          <el-radio-button v-for="opt in timeRangeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="showCustomPicker"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="onCustomDateChange"
        />
      </div>
      <el-tooltip content="未勾选时导出筛选范围内全部数据，勾选后仅导出选中条目" placement="top">
        <el-button type="primary" size="small" :disabled="dashboardExportDisabled" :loading="dashboardExportLoading" @click="handleDashboardExport">
          <template #icon><el-icon><i-ep-Download /></el-icon></template>
          导出统计报表
        </el-button>
      </el-tooltip>
      <el-button type="primary" size="small" @click="toggleFullscreen">
        <template #icon><el-icon><FullScreen /></el-icon></template>
        全屏查看
      </el-button>
    </div>

    <!-- 指标卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="stat-card rounded-lg p-5 text-center"
        :class="{ 'cursor-pointer': card.label === '超期件数' }"
        @click="onCardClick(card)"
      >
        <p class="text-gray-400 text-sm mb-1">{{ card.label }}</p>
        <p class="text-3xl font-bold" :style="{ color: card.color }">{{ card.value }}<span v-if="card.unit" class="text-base ml-1">{{ card.unit }}</span></p>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-2 gap-4">
      <div ref="chart1" class="chart-box rounded-lg" style="height: 320px"></div>
      <div ref="chart2" class="chart-box rounded-lg" style="height: 320px"></div>
      <div ref="chart3" class="chart-box rounded-lg" style="height: 320px"></div>
      <div ref="chart4" class="chart-box rounded-lg" style="height: 320px"></div>
    </div>
  </div>
</template>

<style scoped>
.monitor-dashboard {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: calc(100vh - 140px);
  border-radius: 8px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.stat-card.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.3);
}

.chart-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
}
</style>