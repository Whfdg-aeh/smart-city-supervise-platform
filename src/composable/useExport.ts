import * as XLSX from 'xlsx'
import { useUserStoreHook } from '@/store/modules/user'

/** 导出列定义 */
export interface ExportColumn {
  label: string
  field: string
  formatter?: (val: any, row: any) => string | number
}

const EXPORT_CONFIG = {
  MAX_EXPORT_COUNT: 5000,
  FILE_PREFIX: '智慧城市事项监管平台'
}

/**
 * 通用导出封装
 *
 * 每页导出步骤：
 * 1. 在 <script setup> 中调用 useExport()
 * 2. 定义导出列 columns
 * 3. 模板按钮绑定 loading / disabled
 * 4. 在 fetchList 中调用 setTotalCount(res.total)
 *
 * 示例：
 * ```ts
 * const columns = [
 *   { label: '事项名称', field: 'name' },
 *   { label: '状态', field: 'status', formatter: (v, row) => row.statusLabel }
 * ]
 * const { loading, handleExport, disabled, setTotalCount } = useExport(
 *   () => useAxios().get('/api/xxx/list', { params: { ...Query, exportMode: true } }),
 *   columns,
 *   '台账名称',
 *   Query
 * )
 * ```
 */
export function useExport(
  apiFn: () => Promise<any>,
  columns: ExportColumn[],
  fileNameTemplate: string,
  params?: Record<string, any>
) {
  const loading = ref(false)
  const totalCount = ref(0)

  /** 导出按钮是否禁用（无数据时禁用） */
  const disabled = computed(() => totalCount.value === 0)

  /** 由页面更新总条数，驱动 disabled */
  function setTotalCount(count: number) {
    totalCount.value = count
  }

  /**
   * 上报导出审计日志
   */
  async function reportExportLog(exportCount: number, fileName: string) {
    try {
      const userStore = useUserStoreHook()
      await useAxios().post('/api/system/export-log/save', {
        moduleName: fileNameTemplate,
        searchParams: JSON.stringify(params || {}),
        exportCount,
        fileName,
        operator: userStore.UserData?.name || '未知用户'
      })
    } catch (e) {
      console.error('导出审计日志上报失败', e)
    }
  }

  /** 执行导出 */
  async function handleExport() {
    if (loading.value) return
    if (totalCount.value === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    if (totalCount.value > EXPORT_CONFIG.MAX_EXPORT_COUNT) {
      ElMessage.warning(
        `数据量较大（${totalCount.value}条），仅导出前${EXPORT_CONFIG.MAX_EXPORT_COUNT}条`
      )
    }

    try {
      loading.value = true
      const res = await apiFn()
      // 兼容多种返回格式
      const allData = res?.items || res?.data?.items || res || []

      if (!allData || allData.length === 0) {
        ElMessage.warning('暂无数据可导出')
        return
      }

      // 按列定义映射数据
      const rows = allData.slice(0, EXPORT_CONFIG.MAX_EXPORT_COUNT).map((item: any) => {
        const row: Record<string, any> = {}
        columns.forEach(col => {
          row[col.label] = col.formatter
            ? col.formatter(item[col.field], item)
            : (item[col.field] ?? '')
        })
        return row
      })

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)

      // 自动列宽
      ws['!cols'] = columns.map(col => ({
        wch: Math.max(col.label.length * 2 + 4, 12)
      }))

      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      // 统一文件名：前缀_名称_YYYYMMDD.xlsx
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const fileName = `${EXPORT_CONFIG.FILE_PREFIX}_${fileNameTemplate}_${dateStr}.xlsx`
      XLSX.writeFile(wb, fileName)

      ElMessage.success(`导出成功，共 ${rows.length} 条数据`)

      // 上报导出审计日志
      reportExportLog(rows.length, fileName)
    } catch (err: any) {
      console.error('导出异常:', err)
      ElMessage.error('导出失败：' + (err.message || '未知错误'))
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    handleExport,
    disabled,
    setTotalCount
  }
}