import { ref } from 'vue'
import Cache from '../utils/cache'
import { isEE } from '../icp/ipcRenderer'
import { useWKSDK } from './useWKSDK'
import ipcApiRoute from '../icp/ipcRoute'
import WKSDK, { Channel, MessageText, Mention, Setting } from 'wukongimjssdk'
import { ProhibitwordsService } from '../tsdd/ProhibitwordsService'
import { ConversationWrap } from '../tsdd/ConversationWrap'
import tsddApi from '../api/tsdd'
import { Convert } from '../tsdd/Convert'
import { useImCallback } from './useImCallback'
import { useChatStore } from '../stores/index'

export const useTSDD = () => {
  const { connectWebSocket } = useWKSDK()
  const chatStore = useChatStore()
  const getBrandsFromUserAgent = () => {
    const userAgent = navigator.userAgent

    if (/Chrome\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/i)?.[1]
      return `Chrome ${version}`
    } else if (/Firefox\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Firefox\/(\d+)/i)?.[1]
      return `Firefox ${version}`
    } else if (/Safari\/(\d+)/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      const version = userAgent.match(/Version\/(\d+)/i)?.[1]
      return `Safari ${version}`
    } else if (/Edge\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Edge\/(\d+)/i)?.[1]
      return `Edge ${version}`
    } else {
      return 'Unknown browser'
    }
  }

  const getOSAndVersion = () => {
    const userAgent = navigator.userAgent
    if (/Windows NT (\d+\.\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Windows NT (\d+\.\d+)/i)?.[1]
      return `Windows ${version}`
    } else if (/Mac OS X (\d+_\d+(_\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/Mac OS X (\d+_\d+(_\d+)?)/i)?.[1]?.replace(/_/g, '.')
      return `MacOS ${version}`
    } else if (/Android (\d+(\.\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/Android (\d+(\.\d+)?)/i)?.[1]
      return `Android ${version}`
    } else if (/CPU (iPhone )?OS (\d+_\d+(_\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/CPU (iPhone )?OS (\d+_\d+(_\d+)?)/i)?.[2]?.replace(/_/g, '.')
      return `iOS ${version}`
    } else if (/Linux/i.test(userAgent)) {
      return 'Linux (version not available)'
    } else {
      return 'Unknown OS and version'
    }
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const getDeviceIdFromStorage = () => {
    let deviceId = Cache.get('deviceId')
    if (!deviceId || deviceId === '') {
      deviceId = generateUUID()
      Cache.set('deviceId', deviceId)
    }
    return deviceId
  }

  const getDeviceInfo = () => {
    return {
      device_id: getDeviceIdFromStorage(),
      device_name: getOSAndVersion(),
      device_model: getBrandsFromUserAgent(),
    }
  }

  // 连接通信
  const connect = userInfo => {
    return new Promise((resolve, reject) => {
      const { initImCallback } = useImCallback()
      initImCallback()
      if (isEE) {
        // ee 走tcp
        ipcApiRoute.connectTcp(userInfo).then(res => {
          // initWKSDK()
          resolve(res)
        })
      } else {
        // web 走web socket
        connectWebSocket(userInfo).then(res => {
          // initWKSDK()
          resolve(res)
        })
      }
    })
  }

  // 同步会话列表
  const syncConversationList = () => {
    return new Promise(async (resolve, reject) => {
      if (isEE) {
        const res = await ipcApiRoute.syncConversationList()
        resolve(res.data)
      } else {
        const conversations = await WKSDK.shared().conversationManager.sync({})
        chatStore.setConversationList(conversations)
        resolve(conversations)
      }
    })
  }

  const sendMessage = data => {
    return new Promise(async (resolve, reject) => {
      if (!chatStore.currentConversation) {
        reject(new Error('当前会话不存在'))
        return
      }
      if (isEE) {
        data.channel = chatStore.currentConversation.channel
        const res = await ipcApiRoute.sendMessage(data)
        console.log('tcp sendMessage----->', res)
        resolve(res)
      } else {
        const { text, mention } = data
        const content = new MessageText(text)
        if (mention) {
          const mn = new Mention()
          mn.all = mention.all
          mn.uids = mention.uids
          content.mention = mn
        }
        const channel = chatStore.currentConversation.channel
        const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channel)
        let setting = new Setting()
        if (channelInfo?.orgData.receipt === 1) {
          setting.receiptEnabled = true
        }
        const message = await WKSDK.shared().chatManager.send(content, channel, setting)
        console.log('tcp sendMessage----->', message)
        resolve(message)
      }
    })
  }

  return {
    getBrandsFromUserAgent,
    getOSAndVersion,
    getDeviceIdFromStorage,
    generateUUID,
    getDeviceInfo,
    connect,
    syncConversationList,
    sendMessage,
  }
}
