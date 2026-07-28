<script setup lang="ts">
import { useAppStoreHook } from '@/store/modules/app'

const AppStore = useAppStoreHook()

const pwdLoading = ref(false)
const pwdFormRef = ref()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码需包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

function resetForm() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  nextTick(() => pwdFormRef.value?.clearValidate())
}

async function handlePwdSubmit() {
  try {
    await pwdFormRef.value?.validate()
    pwdLoading.value = true
    await useAxios().put('/api/user/change-password', {
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功')
    AppStore.closeChangePassword()
    resetForm()
  } catch (e: any) {
    if (e?.message) {
      ElMessage.error(e.message)
    }
  } finally {
    pwdLoading.value = false
  }
}

function handleClose() {
  AppStore.closeChangePassword()
  resetForm()
}
</script>

<template>
  <el-dialog
    v-model="AppStore.changePasswordVisible"
    title="修改密码"
    :close-on-click-modal="false"
    width="500px"
    @closed="resetForm"
  >
    <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handlePwdSubmit" :loading="pwdLoading">确定</el-button>
    </template>
  </el-dialog>
</template>
