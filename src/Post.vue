<template>
  <div ref="frame" class="frame" :style="style">
    <slot>
      <input
        v-if="!post.url || mode === 0"
        class="upload"
        type="file"
        multiple
        accept="*/image"
        title=" "
        @change="onImageSelect"
      >
      <pre v-if="mode === 1" class="info" :style="infoStyle">{{ info }}</pre>
      <div v-if="mode === 2" class="dots" :style="dotsStyle">
        <div v-for="c of colors.slice(1)" :key="c" class="dot" :style="{background:c}" />
      </div>
    </slot>
    <img
      v-show="mode === 0 && loaded && post.url"
      class="image"
      :style="imageStyle"
      :src="post.url"
      @load="onLoad"
    >
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue'
import { getDataUrls, getColors } from './utils.js'

export default {
  props: {
    size: { type: Number, default: 0 },
    mode: { type: Number, default: 0 },
    shooting: { type: Boolean, default: false },
    post: { type: Object, default: () => ({ url: '' }) },
  },
  setup(props, ctx) {
    const gap = ref(8)
    const loaded = ref(false)
    const imageStyle = ref({})

    const colors = ref([])
    onMounted(() => {
      watch(
        () => props.post.url,
        async() => {
          if (props.post.url)
            colors.value = await getColors(props.post.url, 5)
          else
            colors.value = []
        },
        { immediate: true, flush: 'pre' },
      )
    })

    const style = computed(() => {
      const obj = {
        width: `${props.size}px`,
        height: `${props.size}px`,
      }
      if (props.post.url) {
        if (props.mode === 1 || props.mode === 2)
          obj.backgroundColor = colors.value[0]
      }
      else if (props.shooting) {
        obj.backgroundColor = 'transparent'
      }
      return obj
    })

    const dotsStyle = computed(() => {
      return {
        backgroundColor: colors.value[0],
        height: `${(props.size - gap.value * 5) / 4}px`,
        gridGap: `${gap.value}px`,
        padding: `${gap.value}px`,
      }
    })

    const info = computed(() => {
      if (!colors.value[0])
        return ''
      const hex = colors.value[0]
      const color = window.chroma(hex)
      const [hue, sat, light] = color.hsl()

      return `${hex}\n\n`
      + `lum ${Math.round(light * 100)}%\n`
      + `sat ${Math.round(sat * 100)}%\n`
      + `hue ${hue.toFixed(1)}°`
    })

    const infoStyle = computed(() => {
      if (!colors.value[0])
        return {}
      const color = window.chroma(colors.value[0])
      return {
        color: color.luminance() > 0.5
          ? color.darken(2)
          : color.brighten(2),
      }
    })

    const onImageSelect = async(e) => {
      const urls = await getDataUrls(e.target.files)
      ctx.emit('upload', urls)
    }

    const onLoad = (e) => {
      loaded.value = true
      if (e.target.height > e.target.width)
        imageStyle.value = { width: '100%' }
      else
        imageStyle.value = { height: '100%' }
    }

    return {
      imageStyle,
      loaded,
      onLoad,
      gap,
      info,
      infoStyle,
      colors,
      dotsStyle,
      style,
      onImageSelect,
    }
  },
}
</script>

<style lang="stylus">
.frame
  background var(--theme-shadow)
  position relative
  background-repeat no-repeat
  background-position center
  background-size cover
  overflow hidden
  width 100%

  .image
    position absolute
    top 50%
    left 50%
    transform translate(-50%, -50%)

  .upload
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    opacity 0
    width 100%

  .icon
    position absolute
    top 50%
    left 50%
    font-size 5rem
    opacity 0.1
    transform translate(-50%, -50%)

  .dots
    position absolute
    left 0
    bottom 0
    right 0
    display grid
    grid-template-columns 1fr 1fr 1fr 1fr

    .dot
      border-radius 50%

  .info
    font-family 'Inconsolata', monospace
    padding 1rem
    margin 0
    opacity 0
    transition .2s ease-in

  &:hover
    .info
      opacity 1
</style>
