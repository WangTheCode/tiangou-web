<template>
  <div class="login-page bg-gradient h-screen relative">
    <div class="relative z-10 w-full h-full">
      <Logo class="absolute top-10 left-10">
        <span class="text-black">来窝里，遇见心有灵犀的<span class="text-primary">ta</span></span>
      </Logo>
      <img src="/images/login/img2.png" class="absolute top-0 left-[36%] w-[300px] h-auto" />
      <img src="/images/login/img3.png" class="absolute top-[30%] left-4 w-[100px]" />
      <img src="/images/login/img4.png" class="absolute top-[28%] left-[30%] w-[100px]" />
      <img src="/images/login/img5.png" class="absolute top-[45%] left-[40%] w-[100px]" />
      <img src="/images/login/img6.png" class="absolute bottom-0 left-0 w-[40%]" />
      <img src="/images/login/img7.png" class="absolute bottom-0 left-[45%] w-[150px]" />
      <img src="/images/login/img8.png" class="absolute top-[10%] right-[10%] w-[100px]" />
      <img src="/images/login/img9.png" class="absolute top-[30%] right-0 w-[200px] h-auto" />
      <img src="/images/login/img10.png" class="absolute bottom-[5%] right-[5%] w-[150px] h-auto" />
    </div>
    <div
      class="absolute w-1/2 top-0 right-0 z-20 h-full bg-white/30 backdrop-blur-sm border-l border-white/20"
    >
      <div class="flex items-center justify-center h-full">
        <div class="relative rounded-xl shadow-md w-[460px]">
          <div class="absolute left-4" style="top: -62px">
            <img src="/images/login/img11.png" class="w-[100px] h-auto" />
          </div>
          <div class="bg-primary p-4 rounded-t-xl text-white text-lg">欢迎登录甜狗窝</div>
          <div class="p-4 bg-white rounded-b-xl" style="height: 390px">
            <Tabs :tabs="tabs" v-model:activeKey="loginType" />

            <div v-if="loginType === 'scan'" class="mt-10">
              <div class="text-center text-black">
                使用<span class="text-primary">甜狗窝APP</span>扫码登录
              </div>

              <div class="w-[200px] h-[200px]"></div>
              <div class="text-center text-gray-400">
                打开<span class="text-primary">甜狗窝APP</span>点击消息-点击右上角扫一扫
              </div>
            </div>
            <div v-if="loginType === 'phone'" class="mt-10">
              <PhoneSmsCheck ref="phoneLoginFormRef" />
              <div class="text-center mt-6 mb-10">
                <el-button type="primary" size="large" @click="onSubmitPhoneLogin" class="w-full"
                  >登录</el-button
                >
              </div>
            </div>
            <div v-if="loginType === 'account'" class="mt-10">
              <el-form class="phone-form" :model="accountLoginData">
                <el-form-item>
                  <PhoneInput
                    ref="phoneInputRef"
                    v-model:phone="accountLoginData.phone"
                    v-model:countryCode="accountLoginData.countryCode"
                  />
                </el-form-item>
                <el-form-item>
                  <el-input
                    size="large"
                    v-model="accountLoginData.password"
                    placeholder="请输入密码"
                    type="password"
                    show-password
                  />
                </el-form-item>
              </el-form>
              <div class="text-center mt-6 mb-10">
                <el-button type="primary" size="large" @click="onSubmitPhoneLogin" class="w-full"
                  >登录</el-button
                >
              </div>
            </div>
            <div class="flex" v-if="loginType === 'account' || loginType === 'phone'">
              <div class="flex-1">
                还没有账号？<a class="text-primary" @click="onRegister">立即注册</a>
              </div>
              <div class="flex-1 text-right">
                <a class="text-primary" @click="onForgotPassword">忘记密码？</a>
              </div>
            </div>
          </div>
        </div>
        <!-- <h1>Login</h1>
        <input v-model="username" type="text" placeholder="Username" />
        <input v-model="password" type="password" placeholder="Password" />
        <button @click="login">Login</button> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useChatStore } from '@/stores/index'
import Logo from '@/components/ui/Logo.vue'
import Tabs from '@/components/base/Tabs.vue'
import commonApi from '@/api/common'
// import PhoneInput from '@/components/base/PhoneInput.vue'
import PhoneSmsCheck from '@/components/base/PhoneSmsCheck.vue'

const userStore = useUserStore()
const router = useRouter()
const chatStore = useChatStore()
const username = ref('008613155550002')
const password = ref('123456')
const loginType = ref('scan')
const accountLoginData = ref({
  phone: '',
  countryCode: '0086',
  password: '',
})
const phoneLoginFormRef = ref(null)

const tabs = [
  {
    key: 'scan',
    label: '扫码登录',
  },
  {
    key: 'phone',
    label: '手机号登录',
  },
  {
    key: 'account',
    label: '账号登录',
  },
]

const login = () => {
  userStore
    .login({
      username: username.value,
      password: password.value,
    })
    .then((res) => {
      chatStore.connectIm(res)
      router.push('/')
    })
}

const onSubmitPhoneLogin = () => {
  phoneLoginFormRef.value.validate((valid, formData, errorMsgs) => {
    if (valid) {
      console.log(formData)
    } else {
      console.log(errorMsgs)
    }
  })
}

const onRegister = () => {
  router.push('/register')
}

const onForgotPassword = () => {
  router.push('/forgot-password')
}

defineOptions({
  name: 'LoginPage',
})
</script>

<style lang="less" scoped></style>
