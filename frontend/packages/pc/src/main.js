import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import piniaStore from '@global/stores/counter'

// 导入共享样式
import '@global/assets/main.css'
import '@global/assets/theme.css'

const app = createApp(App)

app.use(piniaStore)
app.use(router)

app.mount('#app')
