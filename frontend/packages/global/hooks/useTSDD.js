import { ref } from 'vue'
import Cache from '../utils/cache'
import { isEE } from '../icp/ipcRenderer'
import { useWKSDK } from './useWKSDK'
import ipcApiRoute from '../icp/ipcRoute'

export const useTSDD = () => {
  const { connectWebSocket } = useWKSDK()

  const getBrandsFromUserAgent = () => {
    const userAgent = navigator.userAgent;

    if (/Chrome\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/i)?.[1];
      return `Chrome ${version}`;
    } else if (/Firefox\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Firefox\/(\d+)/i)?.[1];
      return `Firefox ${version}`;
    } else if (/Safari\/(\d+)/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      const version = userAgent.match(/Version\/(\d+)/i)?.[1];
      return `Safari ${version}`;
    } else if (/Edge\/(\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Edge\/(\d+)/i)?.[1];
      return `Edge ${version}`;
    } else {
      return "Unknown browser";
    }
  }

  const getOSAndVersion = () => {
    const userAgent = navigator.userAgent;
    if (/Windows NT (\d+\.\d+)/i.test(userAgent)) {
      const version = userAgent.match(/Windows NT (\d+\.\d+)/i)?.[1];
      return `Windows ${version}`;
    } else if (/Mac OS X (\d+_\d+(_\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/Mac OS X (\d+_\d+(_\d+)?)/i)?.[1]?.replace(/_/g, ".");
      return `MacOS ${version}`;
    } else if (/Android (\d+(\.\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/Android (\d+(\.\d+)?)/i)?.[1];
      return `Android ${version}`;
    } else if (/CPU (iPhone )?OS (\d+_\d+(_\d+)?)/i.test(userAgent)) {
      const version = userAgent.match(/CPU (iPhone )?OS (\d+_\d+(_\d+)?)/i)?.[2]?.replace(/_/g, ".");
      return `iOS ${version}`;
    } else if (/Linux/i.test(userAgent)) {
      return "Linux (version not available)";
    } else {
      return "Unknown OS and version";
    }
  }

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const getDeviceIdFromStorage = () => {
    let deviceId = Cache.get("deviceId");
    if (!deviceId || deviceId === "") {
      deviceId = generateUUID();
      Cache.set("deviceId", deviceId);
    }
    return deviceId;
  }

  const getDeviceInfo = () => {
      return {
          "device_id": getDeviceIdFromStorage(),
          "device_name": getOSAndVersion(), 
          "device_model": getBrandsFromUserAgent(),
 
      }
  }

  // 连接通信
  const connect = (userInfo) => {
    return new Promise((resolve, reject) => {
      if (isEE) {
        // ee 走tcp
        ipcApiRoute.connectTcp(userInfo).then(res => {
          console.log(res)
          resolve(res)
        })
      }else{
        // web 走web socket
        connectWebSocket(userInfo).then(res => {
          resolve(res)
        })
      } 
    })
  }

  // 同步会话列表
  const syncConversationList = () => {
    return new Promise((resolve, reject) => {
      if (isEE) {
        ipcApiRoute.syncConversationList().then(res => {
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      }else{
        // 走 useWKSDK 实现
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
      syncConversationList
  }
}
