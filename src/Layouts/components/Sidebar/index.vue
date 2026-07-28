<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import { useUserStoreHook } from '@/store/modules/user'

type MenuItem = {
  name?: string
  path: string
  icon?: string
  children?: MenuItem[]
}

const route = useRoute(),
  loading = ref(false),
  userStore = useUserStoreHook()

// 监管角色才显示电子监察菜单（role >= 28 为监管账号）
const isSupervisor = computed(() => (userStore.UserData?.role || 0) >= 28)

const allMenus = ref<MenuItem[]>([
  { name: '首页', path: '/', icon: 'HomeFilled' },
  { name: '事项管理', path: '/example/formkit', icon: 'Document' },
  {
    name: '电子监察',
    path: '/government',
    icon: 'Monitor',
    children: [
      { name: '监察总览', path: '/government/monitor-dashboard', icon: 'DataLine' },
      { name: '时效异常台账', path: '/government/time-limit', icon: 'Clock' },
      { name: '风险疑点台账', path: '/government/risk-control', icon: 'Warning' },
      { name: '流程审计检索', path: '/government/process-audit', icon: 'Search' },
      { name: '督办调度中心', path: '/government/supervise-dispatch', icon: 'Bell' }
    ]
  },
  { name: '个人中心', path: '/profile', icon: 'User' }
])

const menus = computed(() => {
  if (isSupervisor.value) return allMenus.value
  // 普通用户：过滤掉电子监察
  return allMenus.value.filter(m => m.path !== '/government')
})

const menuPathSet = computed(() => new Set(menus.value.map(it => it.path)))

const activeMenu = computed(() => {
  if (route.meta.activeMenu) return route.meta.activeMenu

  const matchedRoute = [...route.matched]
    .reverse()
    .find(r => menuPathSet.value.has(r.path))

  return matchedRoute?.path || route.path
})
</script>

<template>
  <el-scrollbar class="h-[100vh]">
    <el-menu router :default-active="activeMenu" class="min-h-[100vh]" mode="vertical" v-loading="loading">
      <sidebar-item v-for="it in menus" :key="it.path" :item="it" />
    </el-menu>
  </el-scrollbar>
</template>