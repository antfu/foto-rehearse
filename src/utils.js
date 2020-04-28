/* eslint-disable no-alert */
import { ref, onMounted, onUnmounted, watch } from 'vue'

export const STORE_PREFIX = 'foto-rehearse-posts'
export const CONFIG_PREFIX = 'foto-rehearse-config'
const DEFAULT_POSTS = 8
const DEFAULT_IMAGES = [
  '/examples/photo-1588055312392-97068a233ee2.jpeg',
  '/examples/photo-1588056008734-1600aa6420e6.jpeg',
  '/examples/photo-1588055945372-9bd550cc3a57.jpeg',
]

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

const Serializers = {
  boolean: {
    read(v) { return v === 'true' },
    write(v) { return String(v) },
  },
  object: {
    read(v, d) { return v ? JSON.parse(v) : d },
    write(v) { return JSON.stringify(v) },
  },
  number: {
    read(v, d) { return v != null ? Number.parseFloat(v) : d },
    write(v) { return String(v) },
  },
  any: {
    read(v, d) { return v !== null && v !== undefined ? v : d },
    write(v) { return String(v) },
  },
  string: {
    read(v, d) { return v !== null && v !== undefined ? v : d },
    write(v) { return String(v) },
  },
}

export function useStorage(key, defaultValue, storage) {
  if (storage === undefined) storage = localStorage
  const data = ref(defaultValue)
  const type = defaultValue == null
    ? 'any'
    : typeof defaultValue === 'boolean'
      ? 'boolean'
      : typeof defaultValue === 'string'
        ? 'string'
        : typeof defaultValue === 'object'
          ? 'object'
        // @ts-ignore
          : !Number.isNaN(defaultValue)
            ? 'number'
            : 'any'
  function read() {
    try {
      let rawValue = storage.getItem(key)
      if (rawValue === undefined && defaultValue) {
        rawValue = Serializers[type].write(defaultValue)
        storage.setItem(key, rawValue)
      }
      else {
        data.value = Serializers[type].read(rawValue, defaultValue)
      }
    }
    catch (e) {
      console.warn(e)
    }
  }
  read()
  useEventListener('storage', read)
  watch(data, () => {
    try {
      if (data.value == null)
        storage.removeItem(key)
      else
        storage.setItem(key, Serializers[type].write(data.value))
    }
    catch (e) {
      console.warn(e)
    }
  }, { flush: 'sync', deep: true })
  return data
}

export function openDb() {
  return new Promise((resolve) => {
    const request = window.indexedDB.open(STORE_PREFIX, 1)

    request.onerror = function(event) {
      alert(`Failed to open db:\n${event.toString()}`)
    }

    request.onsuccess = function(event) {
      resolve(request.result)
    }

    request.onupgradeneeded = function(event) {
      const db = event.target.result
      const stores = []
      for (let i = 0; i < 5; i++) {
        if (!db.objectStoreNames.contains(`posts-${i}`))
          stores.push(db.createObjectStore(`posts-${i}`, { keyPath: 'id' }))
      }

      for (let i = 0; i < DEFAULT_POSTS; i++)
        stores[0].put({ id: i, url: DEFAULT_IMAGES[i] || '' })
    }
  })
}

export function loadPosts(db, tab = 0) {
  return new Promise((resolve) => {
    const store = db.transaction([`posts-${tab}`], 'readwrite')
      .objectStore(`posts-${tab}`)
    const request = store.getAll()
    request.onsuccess = () => {
      let posts = request.result
      if (!posts || !posts.length) {
        posts = new Array(DEFAULT_POSTS)
          .fill(null)
          .map((_, id) => ({ id, url: '' }))
      }
      posts.sort((a, b) => a.id - b.id)
      resolve(posts)
    }
  })
}

export function savePosts(db, posts = [], tab = 0) {
  const store = db.transaction([`posts-${tab}`], 'readwrite')
    .objectStore(`posts-${tab}`)

  const count = posts.length

  store.clear()

  for (let i = 0; i < count; i++)
    store.put({ id: i.toString(), url: posts[i].url })
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

export function popup(url, name, width, height, close = false) {
  const newWin = window.open(url, name, `height=${height},width=${width}`)
  if (window.focus)
    newWin.focus()
  if (close) {
    window.open('', '_parent', '')
    window.close()
  }
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }).join('')}`
}

export async function getColors(url, amount = 5) {
  const img = document.createElement('img')
  await new Promise((resolve) => {
    img.onload = () => resolve()
    img.src = url
  })
  const rgbs = new window.ColorThief().getPalette(img, amount)
  return rgbs.map(rgb => rgbToHex(...rgb))
}
