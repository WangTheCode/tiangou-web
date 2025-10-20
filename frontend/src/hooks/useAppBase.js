import { ref, watch, onMounted } from 'vue'
import { useDevice } from './useDevice'
import { useAppStore, useUserStore, useChatStore } from '../stores/index'
import 'dayjs/locale/zh-cn'
import Cache from '../utils/cache'
import { useRouter } from 'vue-router'
import ipcListener from '../utils/icp/ipcListener'
import { isEE } from '../utils/icp/ipcRenderer'

export const useAppBase = () => {
  useDevice()
  const userStore = useUserStore()
  const appStore = useAppStore()
  const chatStore = useChatStore()
  const router = useRouter()
  const cacheUserInfo = Cache.get('USER_INFO')
  if (cacheUserInfo && cacheUserInfo.uid) {
    userStore.setUserInfo(cacheUserInfo).then(() => {
      chatStore.connectIm(cacheUserInfo)
    })
  } else {
    router.push('/login')
  }

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
        console.log(audioEl, url)
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
    if (isEE) {
      ipcListener.init()
    }
  })
}
