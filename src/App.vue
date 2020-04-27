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

      <div class="tabs">
        <div class="tab" :class="{active: tab===0}" @click="tab=0">
          1
        </div>
        <div class="tab" :class="{active: tab===1}" @click="tab=1">
          2
        </div>
        <div class="tab" :class="{active: tab===2}" @click="tab=2">
          3
        </div>
      </div>

      <div class="grid">
        <post
          v-for="(post, idx) in posts"
          :key="post.id"
          :post="post"
          :width="width"
          :draggable="true"
          @drop.native="e=>drop(idx, e)"
          @dragover.native="allowDrop"
          @dragstart.native="e=>drag(idx, e)"
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
import { computed, ref, watch } from 'vue'
import { useWindowSize, loadPosts, savePosts, openDb } from './utils.js'
import Post from './Post.vue'

export default {
  components: {
    Post,
  },
  setup() {
    const { width, height } = useWindowSize()
    const tab = ref(0)
    const posts = ref([])
    let db

    openDb().then(async(i) => {
      db = i
      window.db = db
      posts.value = await loadPosts(db, tab.value)
    })

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

    const drop = (to, e) => {
      const from = +e.dataTransfer.getData('idx')
      posts.value.splice(to, 0, posts.value.splice(from, 1)[0])
    }
    const drag = (idx, e) => {
      e.dataTransfer.setData('idx', idx)
    }
    const allowDrop = (e) => {
      e.preventDefault()
    }

    watch(
      posts,
      () => {
        savePosts(db, posts.value, tab.value)
      }, {
        deep: true,
      },
    )

    watch(
      tab,
      async() => {
        posts.value = await loadPosts(db, tab.value)
      },
    )

    return {
      tab,
      width,
      height,
      caseStyle,
      posts,
      handleUploaded,
      drop,
      drag,
      allowDrop,
    }
  },
}
</script>

<style lang="stylus">
:root
  --theme-primary #d37070
  --post-width 100px
  --theme-foreground #0007
  --theme-background white

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

.tabs
  padding 1rem
  position absolute
  top 0
  right 0

  .tab
    padding 0.5rem
    display inline-block
    color var(--theme-primary)
    cursor pointer
    margin 0 0.1rem
    width 1rem
    height 1rem
    line-height 1rem
    text-align center

    &.active
      background var(--theme-primary)
      color var(--theme-background)
      font-weight normal

.phone-case
  background var(--theme-background)
  height 100vh
  margin 0 auto
  overflow-y auto
  overflow-x hidden
  scrollbar-width none
  position relative

  &::-webkit-scrollbar
    display block
    width 0px

  .profile
    padding 0.5rem 1rem
    margin-bottom 1rem

    .header
      font-size 1.5rem
      font-weight 100

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
