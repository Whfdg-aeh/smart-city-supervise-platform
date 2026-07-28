import { defineStore } from 'pinia'
import { store } from '@/store'

export const useAffairsStore = defineStore('affairs', () => {
  // 事项列表搜索条件缓存
  const searchName = ref('')
  const searchStatus = ref('')
  const currentPage = ref(1)

  function setSearch(name: string, status: string, page: number = 1) {
    searchName.value = name
    searchStatus.value = status
    currentPage.value = page
  }

  function resetSearch() {
    searchName.value = ''
    searchStatus.value = ''
    currentPage.value = 1
  }

  return { searchName, searchStatus, currentPage, setSearch, resetSearch }
})

export function useAffairsStoreHook() {
  return useAffairsStore(store)
}
