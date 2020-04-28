<template>
  <div ref="frame" class="frame" :style="style">
    <slot>
      <input
        class="upload"
        type="file"
        multiple
        accept="*/image"
        @change="onImageSelect"
      >
      <div v-if="mode === 2" class="dots" :style="dotsStyle">
        <div v-for="c of colors.slice(1)" :key="c" class="dot" :style="{background:c}" />
      </div>
    </slot>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { getDataUrls, getColors } from './utils.js'

export default {
  props: {
    size: { type: Number, default: 0 },
    mode: { type: Number, default: 0 },
    post: { type: Object, default: () => ({ url: '' }) },
  },
  setup(props, ctx) {
    const gap = ref(8)

    const colors = computed(() => {
      if (props.post.url)
        return getColors(props.post.url, 5)
      return []
    })

    const style = computed(() => {
      const obj = {
        width: `${props.size}px`,
        height: `${props.size}px`,
      }
      if (props.post.url) {
        if (props.mode === 0)
          obj.backgroundImage = `url(${props.post.url})`

        else if (props.mode === 1 || props.mode === 2)
          obj.backgroundColor = colors.value[0]
      }
      return obj
    })

    const dotsStyle = computed(() => {
      return {
        height: `${(props.size - gap.value * 5) / 4}px`,
        gridGap: `${gap.value}px`,
        margin: `${gap.value}px`,
      }
    })

    const onImageSelect = async(e) => {
      const urls = await getDataUrls(e.target.files)
      ctx.emit('upload', urls)
    }

    return { gap, colors, dotsStyle, style, onImageSelect }
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
    height 30px
    grid-template-columns 1fr 1fr 1fr 1fr
    grid-gap 5px
    margin 5px
</style>
