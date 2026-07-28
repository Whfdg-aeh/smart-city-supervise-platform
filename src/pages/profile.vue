<route>
    { meta: { title: "个人中心" } }
</route>

<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover" class="h-full">
          <div class="flex flex-col items-center py-6">
            <el-avatar :size="80" :src="userInfo.avatar" class="cursor-pointer" @click="avatarDialogVisible = true" />
            <p class="mt-4 text-xl font-semibold">{{ userInfo.name }}</p>
            <p class="mt-1 text-gray-500">{{ userInfo.email }}</p>
            <el-tag class="mt-3" type="success">管理员</el-tag>
            <div class="flex gap-2 mt-4">
              <el-button type="primary" @click="editDialogVisible = true">编辑个人信息</el-button>
              <el-button @click="openChangePassword">修改密码</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="hover" class="h-full">
          <template #header>
            <span class="font-semibold">基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{ userInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="角色">超级管理员</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ displayPhone }}</el-descriptions-item>
            <el-descriptions-item label="部门">智慧城市管理中心</el-descriptions-item>
            <el-descriptions-item label="注册时间">2026-01-15</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑个人信息弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑个人信息" :close-on-click-modal="false" width="500px">
      <el-alert type="info" :closable="false" show-icon class="mb-4">
        仅支持修改邮箱、联系电话
      </el-alert>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditSubmit" :loading="editLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 头像上传弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="更换头像" width="400px">
      <div class="flex flex-col items-center gap-4 py-4">
        <el-avatar :size="120" :src="userInfo.avatar" />
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          accept="image/*"
        >
          <el-button type="primary">选择图片</el-button>
        </el-upload>
        <p class="text-gray-400 text-sm">支持 JPG/PNG 格式，大小不超过 2MB</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useAppStoreHook } from '@/store/modules/app'
import { useUserStoreHook } from '@/store/modules/user'

const AppStore = useAppStoreHook()
const UserStore = useUserStoreHook()

const userInfo = reactive({
  name: '张三',
  email: 'zhangsan@example.com',
  rawPhone: '13812348001',
  phone: '138****8001',
  avatar: 'https://meichuangyx-test.oss-cn-hangzhou.aliyuncs.com/ADMIN/bdb3da5c-b6a8-42c2-82ea-8e9ef32ab78b.png'
})

const displayPhone = computed(() => {
  const p = userInfo.rawPhone
  if (!p || p.length < 7) return userInfo.phone
  return p.slice(0, 3) + '****' + p.slice(-4)
})

function openChangePassword() {
  AppStore.openChangePassword()
}

// ---- 编辑个人信息 ----
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({ email: '', phone: '' })

const editRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

watch(editDialogVisible, (val) => {
  if (val) {
    editForm.email = userInfo.email
    editForm.phone = userInfo.rawPhone
    nextTick(() => editFormRef.value?.clearValidate())
  }
})

async function handleEditSubmit() {
  try {
    await editFormRef.value?.validate()
    editLoading.value = true
    await useAxios().put('/api/user/update', { email: editForm.email, phone: editForm.phone })
    userInfo.email = editForm.email
    userInfo.rawPhone = editForm.phone
    UserStore.updateUserInfo({ email: editForm.email, phone: editForm.phone })
    ElMessage.success('个人信息更新成功')
    editDialogVisible.value = false
  } catch { /* 校验失败 */ }
  finally { editLoading.value = false }
}

// ---- 头像上传 ----
const avatarDialogVisible = ref(false)

function beforeAvatarUpload(file: File) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJpgOrPng) {
    ElMessage.error('头像仅支持 JPG/PNG 格式')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB')
    return false
  }
  const reader = new FileReader()
  reader.onload = (e: any) => {
    const newAvatar = e.target.result
    userInfo.avatar = newAvatar
    UserStore.updateAvatar(newAvatar)
  }
  reader.readAsDataURL(file)
  ElMessage.success('头像更新成功')
  avatarDialogVisible.value = false
  return false
}

onMounted(async () => {
  if (UserStore.UserData?.name) {
    userInfo.name = UserStore.UserData.name
    userInfo.email = UserStore.UserData.email
    if (UserStore.UserData.avatar) userInfo.avatar = UserStore.UserData.avatar
  }
  try {
    const res: any = await useAxios().get('/api/user/info')
    if (res?.name) {
      userInfo.name = res.name
      userInfo.email = res.email
      if (res.avatar) userInfo.avatar = res.avatar
      UserStore.updateUserInfo(res)
    }
  } catch { /* 使用默认数据 */ }
})
</script>
