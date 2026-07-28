<script setup lang="ts">
import { useUserStoreHook } from '@/store/modules/user'
import { useSettingsStore } from '@/store/modules/settings'
import { useAppStoreHook } from '@/store/modules/app'
import { useRouter } from 'vue-router'
import Breadcrumb from '@/Layouts/components/Breadcrumb/index.vue'

const UserStore = useUserStoreHook()
const SettingsStore = useSettingsStore()
const AppStore = useAppStoreHook()
const router = useRouter()

function goProfile() {
  router.push('/profile')
}

function openChangePassword() {
  AppStore.openChangePassword()
}

async function handleLogout() {
  await UserStore.logout()
}

// 消息通知
const notifications = ref([
  { id: 1, title: '逾期预警', content: '公共停车场建设审批 已逾期，请及时处理', time: '10分钟前', read: false },
  { id: 2, title: '事项提醒', content: '城市道路改扩建项目审批 待审核', time: '1小时前', read: false },
  { id: 3, title: '系统通知', content: '智慧城市事项监管平台 V2.0 已更新', time: '昨天', read: true }
])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function handleNotificationClick(item: any) {
  item.read = true
  router.push('/example/formkit')
}
</script>

<template>
  <div class="h-full flex justify-between items-center">
    <div class="text-[18px] font-semibold flex items-center gap-2">
      <el-button text size="small" @click="SettingsStore.changeSetting({ key: 'showSidebar', value: !SettingsStore.showSidebar })">
        <el-icon size="18">
          <i-ep-Expand v-if="SettingsStore.showSidebar" />
          <i-ep-Fold v-else />
        </el-icon>
      </el-button>
      <Breadcrumb />
    </div>
    <div class="flex items-center gap-3">
      <!-- 消息通知 -->
      <el-popover placement="bottom" :width="320" trigger="click">
        <template #reference>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-icon size="20" class="cursor-pointer"><i-ep-Bell /></el-icon>
          </el-badge>
        </template>
        <div class="max-h-[300px] overflow-y-auto">
          <p v-if="notifications.length === 0" class="text-center text-gray-400 py-4">暂无消息</p>
          <div
            v-for="item in notifications"
            :key="item.id"
            class="py-3 px-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
            :class="{ 'bg-blue-50': !item.read }"
            @click="handleNotificationClick(item)"
          >
            <p class="text-sm font-semibold">{{ item.title }} <span v-if="!item.read" class="inline-block w-2 h-2 bg-red-500 rounded-full ml-1" /></p>
            <p class="text-xs text-gray-500 mt-1">{{ item.content }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ item.time }}</p>
          </div>
        </div>
      </el-popover>

      <span>{{ UserStore.UserData?.name }}</span>
      <el-dropdown trigger="click">
        <el-avatar :size="40" :src="UserStore.UserData?.avatar" class="cursor-pointer" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile">
              <el-icon><i-ep-User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item @click="openChangePassword">
              <el-icon><i-ep-Lock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><i-ep-SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
