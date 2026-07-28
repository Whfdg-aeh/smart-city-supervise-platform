import { defineStore } from 'pinia'
import { store } from '@/store'
import setting from '@/config/setting'

export const useAppStore = defineStore('app', () => {
  const locale = ref<any>(null)
  const size = ref<string>(setting.size)
  // 修改密码弹窗全局控制
  const changePasswordVisible = ref(false)

  function openChangePassword() {
    changePasswordVisible.value = true
  }

  function closeChangePassword() {
    changePasswordVisible.value = false
  }

  return { locale, size, changePasswordVisible, openChangePassword, closeChangePassword }
})

export function useAppStoreHook() {
  return useAppStore(store)
}
