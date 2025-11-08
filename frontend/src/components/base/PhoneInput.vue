<template>
  <el-input class="phone-input" v-model="phone" size="large" placeholder="请输入手机号码">
    <template #prepend>
      <el-select v-model="countryCode" size="large" placeholder="国家" style="width: 150px">
        <el-option
          v-for="item in countries"
          :key="item.code"
          :label="`+${item.code} ${item.name}`"
          :value="item.code"
        />
      </el-select>
    </template>
  </el-input>
</template>

<script setup>
import { ref } from 'vue'
import commonApi from '@/api/common'

// 双向绑定的 model 定义
const phone = defineModel('phone', {
  type: String,
  default: '',
})

const countryCode = defineModel('countryCode', {
  type: String,
  default: '0086',
})

// 国家列表数据
const countries = ref([])

// 获取国家列表
const fetchCountries = async () => {
  const res = await commonApi.getCountries()
  countries.value = res
}

fetchCountries()
</script>

<style lang="less" scoped>
.phone-input {
  &:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-select__wrapper) {
    padding-right: 6px;
  }
}
</style>
