import { ref, onMounted, onUnmounted } from 'vue'

function useEventListener(type, listener, options, target) {
  if (target === undefined) target = window
  onMounted(() => {
    target.addEventListener(type, listener, options)
  })
  onUnmounted(() => {
    target.removeEventListener(type, listener, options)
  })
}

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  useEventListener('resize', () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  })
  return { width, height }
}

export async function getDataUrls(files) {
  return await Promise.all(
    Array
      .from(files)
      .map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.addEventListener('load', () => {
            resolve(reader.result)
          }, false)

          reader.readAsDataURL(file)
        })
      }),
  )
}
