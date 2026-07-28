<route lang="json">
{
  "meta": { "title": "登录", "layout": "fullscreen" }
}
</route>

<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">智慧城市事项监管平台</h1>
      <p class="login-subtitle">Smart City Affairs Supervision Platform</p>

      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <span :class="{ active: loginMode === 'account' }" @click="loginMode = 'account'">账号密码登录</span>
        <span :class="{ active: loginMode === 'sms' }" @click="loginMode = 'sms'">短信验证码登录</span>
      </div>

      <!-- 账号密码登录 -->
      <div v-if="loginMode === 'account'" class="login-form">
        <el-form size="large" @keyup.enter="login">
          <el-form-item>
            <el-input v-model="formData.account" placeholder="请输入账号" size="large">
              <template #prefix>
                <el-icon><i-ep-User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="formData.password" type="password" show-password placeholder="请输入密码" size="large">
              <template #prefix>
                <el-icon><i-ep-Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <el-button type="primary" class="w-full" size="large" @click="login" :loading="data.loading">
          登 录
        </el-button>
        <p class="login-tip">默认账号：admin / admin</p>
      </div>

      <!-- 短信验证码登录 -->
      <div v-else class="login-form">
        <el-form size="large" @keyup.enter="smsLogin">
          <el-form-item>
            <el-input v-model="smsForm.phone" placeholder="请输入手机号" size="large" maxlength="11">
              <template #prefix>
                <el-icon><i-ep-Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <div class="flex w-full gap-2">
              <el-input v-model="smsForm.code" placeholder="请输入验证码" size="large" maxlength="6" class="flex-1">
                <template #prefix>
                  <el-icon><i-ep-Lock /></el-icon>
                </template>
              </el-input>
              <SmsCodeButton :phonenumber="smsForm.phone" :type="1">
                <template #default="{ disabled, text, send }">
                  <el-button :disabled="disabled || !smsForm.phone" size="large" @click="send" class="sms-btn">
                    {{ text }}
                  </el-button>
                </template>
              </SmsCodeButton>
            </div>
          </el-form-item>
        </el-form>
        <el-button type="primary" class="w-full" size="large" @click="smsLogin" :loading="smsLoading">
          登 录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/modules/user"

const loginMode = ref('account')

const data = reactive({
  loading: false,
  data: null
})

const formData = reactive({
  account: 'admin',
  password: 'admin',
})

const smsForm = reactive({
  phone: '',
  code: ''
})
const smsLoading = ref(false)

const login = async () => {
  try {
    data.loading = true
    await useUserStore().login(formData)
    data.loading = false
    location.reload()
  } catch (error) {
    console.log(error)
  } finally {
    data.loading = false
  }
}

const smsLogin = async () => {
  if (!smsForm.phone || !smsForm.code) {
    ElMessage.warning('请填写手机号和验证码')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  try {
    smsLoading.value = true
    const res: any = await useAxios().post('/api/sms/login', {
      phonenumber: smsForm.phone,
      code: smsForm.code
    })
    if (res?.token) {
      const { useStorage } = await import('@vueuse/core')
      useStorage<string>('XSRF-TOKEN', res.token)
      location.reload()
    }
  } catch (error) {
    console.log(error)
  } finally {
    smsLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  background-image: url('@/assets/login-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
}

.login-box {
  position: relative;
  z-index: 1;
  width: 440px;
  padding: 48px 40px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  color: #ffffff;
  margin: 0;
}

.login-subtitle {
  font-size: 13px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
  margin-bottom: 32px;
  letter-spacing: 1px;
}

.login-tabs {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 28px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  user-select: none;

  span {
    padding-bottom: 6px;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
  }
  span.active {
    color: #fff;
    border-bottom-color: #409EFF;
  }
}

.login-form {
  width: 100%;
}

.login-tip {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 16px;
}

.sms-btn {
  width: 130px;
  white-space: nowrap;
}
</style>