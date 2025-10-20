import { ref } from 'vue'
export default function useLoading(initValue = false) {
  const loading = ref(initValue)

  const startLoading = () => {
    loading.value = true
  }
  const endLoading = () => {
    loading.value = false
  }
  const toggle = () => {
    loading.value = !loading.value
  }
  return {
    loading,
    startLoading,
    endLoading,
    toggle,
  }
}
