<template>
  <div ref="frame" class="frame" :style="style">
    <input
      v-if="!post.url"
      class="upload"
      type="file"
      accept="*/image"
      @change="onImageSelect"
    >
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { getDataUrls } from './utils.js'

export default {
  props: {
    width: { type: Number, default: 0 },
    post: { type: Object, default: () => ({ url: '' }) },
  },
  setup(props, ctx) {
    const style = ref({ height: '100px' })
    const frame = ref(null)

    onMounted(() => {
      watch(
        () => props.width,
        () => {
          setTimeout(() => {
            if (frame.value)
              style.value.height = `${frame.value.clientWidth}px`
          }, 1)
        },
        { immediate: true },
      )

      watch(
        () => props.post.url,
        () => {
          style.value.backgroundImage = `url(${props.post.url})`
        },
        { immediate: true },
      )
    })

    const onImageSelect = async(e) => {
      const urls = await getDataUrls(e.target.files)
      ctx.emit('upload', urls)
    }

    return { style, frame, onImageSelect }
  },
}
</script>

<style lang="stylus">
.frame
  background #0001
  position relative
  background-repeat no-repeat
  background-position center
  background-size cover
  overflow hidden

  .upload
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    opacity 0
</style>
