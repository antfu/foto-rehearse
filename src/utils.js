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

const STORE_PREFIX = 'instagram-rehearser-posts'

export function loadPosts(tab = 0) {
  const count = +(localStorage.getItem(`${STORE_PREFIX}-${tab}-count`) || '30')
  return Array(count)
    .fill(null)
    .map((_, idx) => ({ url: localStorage.getItem(`${STORE_PREFIX}-${tab}-${idx}`), id: idx }))
}

export function savePosts(posts = [], tab = 0) {
  const count = posts.length

  localStorage.setItem(`${STORE_PREFIX}-${tab}-count`, count.toString())
  for (let i = 0; i < count; i++)
    localStorage.setItem(`${STORE_PREFIX}-${tab}-${i}`, posts[i].url)
}

export function resizedataURL(url, MAX_WIDTH = 512, MAX_HEIGHT = 512) {
  const img = document.createElement('img')

  return new Promise((resolve) => {
    img.onload = function() {
      // We create a canvas and get its context.
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      }
      else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(this, 0, 0, width, height)

      resolve(canvas.toDataURL())

      img.remove()
    }

    img.src = url
  })
}

export async function getDataUrls(files) {
  return await Promise.all(
    Array
      .from(files)
      .map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.addEventListener('load', async() => {
            const url = reader.result
            const resized = await resizedataURL(url, 512, 512)
            resolve(resized)
          }, false)

          reader.readAsDataURL(file)
        })
      }),
  )
}
