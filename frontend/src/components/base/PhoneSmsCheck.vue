<template>
  <el-form class="phone-form" :model="formData">
    <el-form-item>
      <PhoneInput
        ref="phoneInputRef"
        v-model:phone="formData.phone"
        v-model:countryCode="formData.countryCode"
      />
    </el-form-item>
    <el-form-item>
      <div class="flex gap-2 w-full">
        <el-input
          class="flex-1"
          size="large"
          v-model="formData.captchaCode"
          placeholder="请输入图形验证码"
        />
        <div class="w-[150px] captcha-image">
          <img :src="captchaImage" alt="图形验证码" />
        </div>
      </div>
    </el-form-item>
    <el-form-item>
      <div class="flex gap-2 w-full">
        <el-input
          class="flex-1"
          size="large"
          v-model="formData.smsCode"
          placeholder="请输入短信验证码"
        />
        <div class="w-[150px]">
          <GetSmsCodeButton size="large" :getSendData="getSmsSendData" />
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import GetSmsCodeButton from '@/components/base/GetSmsCodeButton.vue'
import PhoneInput from '@/components/base/PhoneInput.vue'
import commonApi from '@/api/common'

const formData = ref({
  phone: '',
  countryCode: '0086',
  captchaCode: '',
  captchaID: '',
  smsCode: '',
})

const captchaImage = ref('')

const getCaptchaImage = async () => {
  const res = await commonApi.getCaptchaImage()
  formData.value.captchaID = res.captcha_id
  const img = res.captcha_image || ''
  captchaImage.value = img && img.startsWith('data:') ? img : `data:image/png;base64,${img}`
}

const countries = ref([])

const fetchCountries = async () => {
  const res = await commonApi.getCountries()
  countries.value = res
}

fetchCountries()

const getSmsSendData = () => {
  return {
    zone: formData.value.countryCode + formData.value.phone,
    captcha_code: formData.value.captchaCode,
    captcha_id: formData.value.captchaID,
  }
}

getCaptchaImage()

const validate = (callback) => {
  let valid = false
  let errorMsgs = []
  if (!formData.value.phone) {
    errorMsgs.push({
      field: 'phone',
      msg: '请输入手机号码',
    })
  }
  if (!formData.value.countryCode) {
    errorMsgs.push({
      field: 'countryCode',
      msg: '请选择国家',
    })
  }
  if (!formData.value.captchaCode) {
    errorMsgs.push({
      field: 'captchaCode',
      msg: '请输入图形验证码',
    })
  }
  if (!formData.value.smsCode) {
    errorMsgs.push({
      field: 'smsCode',
      msg: '请输入短信验证码',
    })
  }

  if (errorMsgs.length > 0) {
    callback(false, formData.value, errorMsgs)
  } else {
    callback(true, formData.value, errorMsgs)
  }

  callback()
}
</script>

<style lang="less" scoped>
.phone-form {
  &:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-select__wrapper) {
    padding-right: 6px;
  }
  .captcha-image {
    border-width: 1px;
    border-style: solid;
    border-color: #c0c4cc;
    border-radius: 5px;
    overflow: hidden;
    height: 46px;
  }
}
</style>
