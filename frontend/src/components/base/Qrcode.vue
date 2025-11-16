<template>
  <div class="qrcode">
    <canvas ref="qrCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const qrCanvas = ref(null)

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  width: {
    type: Number,
    default: 200,
  },
  height: {
    type: Number,
    default: 200,
  },
})

function renderQrcode() {
  QRCode.toCanvas(
    qrCanvas.value,
    props.text,
    { width: props.width, height: props.height },
    (error) => {
      if (error) console.error(error)
    },
  )
}

onMounted(() => {
  renderQrcode()
})

watch(
  () => props.text,
  () => {
    renderQrcode()
  },
)
</script>

<style scoped></style>
