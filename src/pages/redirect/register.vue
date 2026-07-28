<route>
{
  meta: { title: "注册", roles: [1], layout: "fullscreen" }
}
</route>

<template>
  <div class="h-[100vh] w-[100vw] flex justify-center bg-[#333]">
    <div class="mt-[15%] text-white">
      <h1 class="text-[32px] font-semibold text-center">注册</h1>
      <div class="w-[420px] mt-6">
        <el-form size="large">
          <el-form-item label-position="top">
            <el-input v-model="formData.account" placeholder="请输入账号"/>
          </el-form-item>
          <el-form-item label-position="top">
            <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11"/>
          </el-form-item>
          <el-form-item label-position="top">
            <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item label-position="top">
            <div class="flex w-full gap-2">
              <el-input v-model="formData.code" placeholder="请输入验证码" maxlength="6" class="flex-1" />
              <SmsCodeButton :phonenumber="formData.phone" :type="0">
                <template #default="{ disabled, text, send }">
                  <el-button :disabled="disabled || !formData.phone" @click="send" class="w-[130px] whitespace-nowrap">
                    {{ text }}
                  </el-button>
                </template>
              </SmsCodeButton>
            </div>
          </el-form-item>
        </el-form>
        <el-button color="#626aef" class="w-full mt-3" size="large" @click="register" :loading="data.loading">立即注册</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const data = reactive({
  loading: false
})

const formData = reactive({
  account: '',
  phone: '',
  password: '',
  code: ''
})

const register = async () => {
  if (!formData.account) { ElMessage.warning('请输入账号'); return }
  if (!formData.phone) { ElMessage.warning('请输入手机号'); return }
  if (!/^1[3-9]\d{9}$/.test(formData.phone)) { ElMessage.warning('请输入正确的手机号'); return }
  if (!formData.password) { ElMessage.warning('请输入密码'); return }
  if (!formData.code) { ElMessage.warning('请输入验证码'); return }

  try {
    data.loading = true
    const res: any = await useAxios().post('/api/sms/register', {
      account: formData.account,
      phonenumber: formData.phone,
      password: formData.password,
      code: formData.code
    })
    if (res?.token) {
      ElMessage.success('注册成功')
      const { useStorage } = await import('@vueuse/core')
      useStorage<string>('XSRF-TOKEN', res.token)
      location.reload()
    }
  } catch (error) {
    console.log(error)
  } finally {
    data.loading = false
  }
}
</script>