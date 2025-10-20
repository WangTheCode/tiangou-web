import { createApp } from 'vue'
// import VueUiWraper from 'vue-ui-wraper'
// import Antd from 'ant-design-vue'
import piniaStore from '@/store'

export class ModalManager {
  static instance = null
  modalApp = null
  modalContainer = null

  constructor() {
    this.createContainer()
  }

  static getInstance() {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager()
    }
    return ModalManager.instance
  }

  createContainer() {
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div')
      this.modalContainer.id = 'modal-container'
      document.body.appendChild(this.modalContainer)
    }

    if (!this.modalApp) {
      this.modalApp = createApp({
        name: 'ModalContainer',
        template: '<div id="modal-root"></div>',
      })
      // 注册全局组件
      this.modalApp.use(piniaStore)
      this.modalApp.mount(this.modalContainer)
    }
  }

  showModal(ModalComponent, props) {
    const container = document.createElement('div')
    document.getElementById('modal-root')?.appendChild(container)

    const modalInstance = createApp(ModalComponent, {
      ...props,
      onCancel: () => {
        props.onCancel?.()
        this.destroyModal(modalInstance, container)
      },
    })

    // 在模态框实例中也注册必要的组件库
    modalInstance.use(Antd).use(piniaStore)

    modalInstance.mount(container)
    return modalInstance
  }

  destroyModal(instance, container) {
    instance.unmount()
    container.remove()
  }

  // 可选：提供销毁整个 ModalManager 的方法
  destroy() {
    if (this.modalApp) {
      this.modalApp.unmount()
      this.modalApp = null
    }
    if (this.modalContainer) {
      this.modalContainer.remove()
      this.modalContainer = null
    }
    ModalManager.instance = null
  }
}
