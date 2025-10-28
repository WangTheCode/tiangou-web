import { createApp } from 'vue'
import Popup from './ConversationPicker.vue'

export const conversationPicker = (props) => {
  // 实例化组件，createApp第二个参数是props
  const confirmInstance = createApp(Popup, {
    ...props,
    onCancel: () => {
      props.onCancel && props.onCancel()
      unmount()
    },
  })

  // 创建一个挂载容器
  const parentNode = document.createElement('div')
  document.body.appendChild(parentNode)

  // 卸载组件
  const unmount = () => {
    confirmInstance.unmount()
    document.body.removeChild(parentNode)
  }
  // 挂载组件
  confirmInstance.mount(parentNode)

  return confirmInstance
}
