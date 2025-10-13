import { ref, watch, onMounted } from 'vue'
import { useDevice } from './useDevice'
import { useAppStore, useUserStore, useChatStore } from '../stores/index'
import 'dayjs/locale/zh-cn'
import Cache from '../utils/cache'
import { useRouter } from 'vue-router'
import ipcListener from '../icp/ipcListener'
import { isEE } from '../icp/ipcRenderer'

export const useAppBase = () => {
  useDevice()
  const userStore = useUserStore()
  const appStore = useAppStore()
  const chatStore = useChatStore()
  const router = useRouter()
  const cacheUserInfo = Cache.get('USER_INFO')
  if (cacheUserInfo && cacheUserInfo.uid) {
    userStore.setUserInfo(cacheUserInfo).then(() => {
      chatStore.connect(cacheUserInfo)
    })
  } else {
    router.push('/login')
    // userStore.setUserInfo({ "uid": "2194c7d5b9b0452ab27fb4731eb0db5d", "app_id": "", "name": "sead_test3", "username": "008615512345670", "sex": 1, "category": "", "short_no": "7138278", "zone": "0086", "phone": "15512345670", "token": "cccbbe6854ff4c6389204022ca323772", "chat_pwd": "", "lock_screen_pwd": "", "lock_after_minute": 0, "setting": { "search_by_phone": 1, "search_by_short": 1, "new_msg_notice": 1, "msg_show_detail": 1, "voice_on": 1, "shock_on": 1, "offline_protection": 0, "device_lock": 0, "mute_of_app": 0 }, "rsa_public_key": "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUE2ZmhjekRUMWVURWN5RDY2bWw3SApqNUd1SXhMMU5hTEhkZmlrNDZPSkpXZUdTc0xheDRZbG5hclRFYzZ6VXcyQlJVZlQ4eEdpMi9FRjFNRGF2ZjNKCmNoWXp6UmVHT1o5VDd2ajlxTjFpVEp0SklVTldSelBnU0EydFhXSndQR2htT0RRQW9CVnV1Z0RDOWRLZDlDTCsKbXp4MXdHMUtkSG5YZmVpUDMzK05pa21wTFhmdXF0aFM2VzFOa3JnbmoyQTI3UWRwS3lZTFRka2NoOHVwc1AxYgpsalQvbi84MlNMLzVhYmlQYlJiVmFxYjYzVGhESmo5Yzg3WUg3T0lQTnMxNVJZazluL3hKZ3pDcWNlWk9PY3l2CkkzOUpjRGdGb25SWnk0ZmtlV0ovYTR0K0k0bzNadFhMbENwdFk4OXJHdGoxWG5MVGRNeERKR2xRczRvQ21GaTAKL1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==", "short_status": 0, "msg_expire_second": 0 })
  }

  const onPlayVoice = async url => {
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
    newVal => {
      if (newVal) {
        onPlayVoice(newVal)
      }
    }
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
    if (isEE) {
      ipcListener.onConnectStatus()
      ipcListener.onAddMessageListener()
      ipcListener.onAddConversationListener()
      ipcListener.onSyncConversationList()
    }
  })
}
