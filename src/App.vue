<template>
  <div class="app">
    <div class="phone-case" :style="caseStyle">
      <div class="profile">
        <div class="header">
          Instagram<b>Rehearser</b>
        </div>
        <div class="author">
          by
          <a href="https://github.com/antfu"> Anthony Fu</a>
        </div>
      </div>

      <div class="grid">
        <post
          v-for="(post, idx) in posts"
          :key="post.id"
          :post="post"
          :width="width"
          @upload="urls=>handleUploaded(idx,urls)"
        />
      </div>

      <div class="footer">
        Powered by
        <a href="https://github.com/vuejs/vite">vite</a>
        ,
        <a href="https://github.com/antfu/vueuse">vueuse</a>
        and
        <a>♥️</a>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-self-assign */

import { computed, ref } from 'vue'
import { useWindowSize } from './utils.js'
import Post from './Post.vue'

export default {
  components: {
    Post,
  },
  setup() {
    const { width, height } = useWindowSize()
    const posts = ref(
      Array(15)
        .fill(null)
        .map((_, idx) => ({ url: '', id: idx })),
    )

    const PHONE_RATIO = 0.55
    const caseStyle = computed(() => ({
      width: width.value / height.value > PHONE_RATIO
        ? `${height.value * PHONE_RATIO}px`
        : '100vw',
    }))

    const handleUploaded = (index, urls) => {
      for (let i = 0; i < urls.length; i++)
        posts.value[i + index].url = urls[i]

      posts.value = posts.value
    }

    return { width, caseStyle, posts, handleUploaded }
  },
}
</script>

<style lang="stylus">
:root
  --theme-primary #d37070
  --post-width 100px

html, body, .app
  margin 0
  height 100vh
  width 100vw
  background grey
  font-family 'Manrope',-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif
  font-weight 100

a
  text-decoration none
  color var(--theme-primary)

.phone-case
  background white
  height 100vh
  margin 0 auto
  overflow-y auto
  overflow-x hidden
  scrollbar-width none

  &::-webkit-scrollbar
    display block
    width 0px

  .profile
    padding 0.5rem 1rem
    margin-bottom 1rem

    .header
      font-size 1.5rem

    .author
      font-size 0.9rem
      opacity 0.8

  .footer
    padding 1rem
    font-size 0.9rem
    color #0008

  .grid
    display grid
    grid-template-columns 1fr 1fr 1fr
    grid-gap 3px
</style>
