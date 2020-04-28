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
    </slot>
  </div>
</template>

<script>
import { computed } from 'vue'
import { getDataUrls } from './utils.js'

export default {
  props: {
    size: { type: Number, default: 0 },
    post: { type: Object, default: () => ({ url: '' }) },
  },
  setup(props, ctx) {
    const style = computed(() => ({
      width: `${props.size}px`,
      height: `${props.size}px`,
      backgroundImage: `url(${props.post.url})`,
    }))

    const onImageSelect = async(e) => {
      const urls = await getDataUrls(e.target.files)
      ctx.emit('upload', urls)
    }

    return { style, onImageSelect }
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
</style>
