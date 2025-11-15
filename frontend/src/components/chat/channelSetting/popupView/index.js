import { createApp } from 'vue'
import PopupTextarea from './PopupTextarea.vue'
import PopupAvatar from './PopupAvatar.vue'

export const showPopupTextarea = (props) => {
  // 实例化组件，createApp第二个参数是props
  const confirmInstance = createApp(PopupTextarea, {
    ...props,
    onCancel: () => {
      props.onCancel && props.onCancel()
      unmount()
    },
  })

  // 确定挂载的父容器
  let mountContainer = document.body
  if (props.appendTo) {
    // 如果传入了 appendTo 参数，尝试查找对应的 DOM 元素
    const targetElement = document.querySelector(props.appendTo)
    if (targetElement) {
      mountContainer = targetElement
    } else {
      console.warn(`[showPopupTextarea] 未找到选择器 "${props.appendTo}" 对应的元素，将挂载到 body`)
    }
  }

  // 创建一个挂载容器
  const parentNode = document.createElement('div')
  mountContainer.appendChild(parentNode)

  // 卸载组件
  const unmount = () => {
    confirmInstance.unmount()
    mountContainer.removeChild(parentNode)
  }

  // 挂载组件
  confirmInstance.mount(parentNode)

  return confirmInstance
}

export const showPopupAvatar = (props) => {
  // 实例化组件，createApp第二个参数是props
  const confirmInstance = createApp(PopupAvatar, {
    ...props,
    onCancel: () => {
      props.onCancel && props.onCancel()
      unmount()
    },
  })

  // 确定挂载的父容器
  let mountContainer = document.body
  if (props.appendTo) {
    // 如果传入了 appendTo 参数，尝试查找对应的 DOM 元素
    const targetElement = document.querySelector(props.appendTo)
    if (targetElement) {
      mountContainer = targetElement
    }
  }

  // 创建一个挂载容器
  const parentNode = document.createElement('div')
  mountContainer.appendChild(parentNode)

  // 卸载组件
  const unmount = () => {
    confirmInstance.unmount()
    mountContainer.removeChild(parentNode)
  }

  // 挂载组件
  confirmInstance.mount(parentNode)

  return confirmInstance
}
