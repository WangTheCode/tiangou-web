import { ref, watch,onMounted } from 'vue'
import {useDevice} from './useDevice'
import { useAppStore,useUserStore } from '../stores/index'
import 'dayjs/locale/zh-cn' 
import { getUrlParams } from '../utils/helper'

export const useAppBase = () => {

  useDevice()
  const userStore = useUserStore()
  const appStore = useAppStore()
   


  const onPlayVoice = async (url) => {
    if (!url) return
    try {
      const elWraper = document.querySelector('#audioWraper')  
      elWraper.innerHTML = `<video id="audioPlayer">
            <source src="${url}" type="audio/wav" />
            <source src="${url}" type="audio/mp3" />
          </video>`
      setTimeout(() => {
        const audioEl = document.getElementById('audioPlayer')
        console.log(audioEl,url)
        if (audioEl && audioEl['play']) {
          audioEl['play']()
        }
      }, 100)
    } catch (error) {
      console.error('播放音频失败:', error)
    }
  }

  watch(
    () => appStore.playAudioUrl,
    (newVal) => {
      if (newVal) {
        onPlayVoice(newVal)
      }
    },
  )

  onMounted(() => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        appStore.createFingerprint()
      })
    } else {
      setTimeout(() => {
        appStore.createFingerprint()
      }, 100)
    } 
  })

  
}
