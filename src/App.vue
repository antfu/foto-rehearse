<template>
  <div class="app" :class="{dark}">
    <div id="phone-case" :style="caseStyle">
      <div class="nav">
        <div v-if="width > 300" class="header">
          Instagram<br><b>Rehearse</b>
        </div>
        <div class="buttons">
          <div v-if="isDesktop" class="icon button" @click="openPopup">
            <span class="iconify" data-icon="mdi-light:arrange-send-backward" />
          </div>

          <div class="icon button" @click="addFront">
            <span class="iconify" data-icon="mdi-light:plus-circle" />
          </div>

          <div class="icon button" @click="dark = !dark">
            <div v-show="dark">
              <span class="iconify" data-icon="mdi-light:lightbulb-on" />
            </div>
            <div v-show="!dark">
              <span class="iconify" data-icon="mdi-light:lightbulb" />
            </div>
          </div>

          <div class="icon button" @click="gap = gap ? 0 : 3">
            <span class="iconify" data-icon="mdi-light:border-outside" />
          </div>

          <div class="icon button" @click="imageMode = (imageMode +1) % 2">
            <div v-show="imageMode == 0">
              <span class="iconify" data-icon="mdi-light:picture" />
            </div>
            <div v-show="imageMode == 1">
              <span class="iconify" data-icon="mdi-light:flask" />
            </div>
          </div>

          <div class="icon button" @click="tab = (tab + 1) % 3">
            <span class="iconify" data-icon="mdi-light:shape-circle" />
            <span class="number">{{ tab+1 }}</span>
          </div>
        </div>
      </div>

      <div class="grid" :style="{ gridGap: `${gap}px` }">
        <post
          v-for="(post, idx) in posts"
          :key="idx"
          :post="post"
          :size="size"
          :mode="imageMode"
          :draggable="true"
          @drop.native="e=>drop(idx, e)"
          @dragend.native="dragend"
          @dragover.native="allowDrop"
          @dragenter.native="allowDrop"
          @dragstart.native="e=>drag(idx, e)"
          @upload="urls=>handleUploaded(idx,urls)"
        />
        <post :size="size" @click.native="add">
          <div class="icon">
            <span class="iconify" data-icon="mdi-light:plus-circle" />
          </div>
        </post>
      </div>

      <div class="footer">
        <div class="author">
          by
          <a href="https://github.com/antfu"> Anthony Fu</a>
        </div>
        <div class="powered">
          Powered by
          <a href="https://github.com/vuejs/vite">vite</a>
          ,
          <a href="https://github.com/antfu/vueuse">vueuse</a>
          and
          <a>♥️</a>
        </div>
      </div>
    </div>
    <div
      class="trashbin"
      :class="{active:dragging}"
      :style="caseStyle"
      @drop.native="dropRemove"
      @dragenter.native="allowDrop"
      @dragover.native="allowDrop"
    >
      Remove
    </div>
  </div>
</template>

<script>
/* eslint-disable no-self-assign */
import { computed, ref, watch } from 'vue'
import { useWindowSize, loadPosts, savePosts, openDb, popup } from './utils.js'
import Post from './Post.vue'

export default {
  components: {
    Post,
  },
  setup() {
    const { width, height } = useWindowSize()
    const tab = ref(0)
    const posts = ref([])
    const gap = ref(3)
    const dragging = ref(false)
    const dark = ref(false)
    const imageMode = ref(0) // 0: photo, 1: thief
    let db

    openDb().then(async(i) => {
      db = i
      window.db = db
      posts.value = await loadPosts(db, tab.value)
    })

    const PHONE_RATIO = 0.55
    const isDesktop = computed(() => {
      return width.value > 500 && width.value / height.value > PHONE_RATIO
    })
    const caseWidth = computed(() => {
      return isDesktop.value ? height.value * PHONE_RATIO - 5 : width.value
    })
    const size = computed(() => {
      return (caseWidth.value - gap.value * 2) / 3
    })
    const caseStyle = computed(() => ({
      width: `${caseWidth.value}px`,
    }))
    const handleUploaded = (index, urls) => {
      for (let i = 0; i < urls.length; i++)
        posts.value[i + index].url = urls[i]
    }
    const drop = (to, e) => {
      dragging.value = false
      const from = +e.dataTransfer.getData('idx')
      posts.value.splice(to, 0, posts.value.splice(from, 1)[0])
    }
    const dropRemove = (e) => {
      dragging.value = false
      const from = +e.dataTransfer.getData('idx')
      posts.value.splice(from, 1)
    }
    const drag = (idx, e) => {
      dragging.value = true
      e.dataTransfer.setData('idx', idx)
      try {
        window.navigator.vibrate(100)
      }
      catch {}
    }
    const dragend = () => {
      dragging.value = false
    }
    const allowDrop = (e) => {
      e.preventDefault()
      return false
    }
    const add = () => {
      posts.value.push({ url: '' })
    }
    const addFront = () => {
      posts.value.unshift({ url: '' })
    }
    const openPopup = () => {
      popup(location.href, 'igre', caseWidth.value, height.value, true)
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
      height,
      width,
      gap,
      dark,
      dragging,
      tab,
      size,
      isDesktop,
      caseStyle,
      caseWidth,
      dragend,
      posts,
      openPopup,
      handleUploaded,
      drop,
      drag,
      allowDrop,
      dropRemove,
      add,
      addFront,
      imageMode,
    }
  },
}
</script>

<style lang="stylus">
:root
  --theme-primary #d37070
  --post-width 100px
  --theme-foreground #000d
  --theme-background white
  --theme-shadow #0001

html, body, .app
  margin 0
  height 100vh
  width 100vw
  background #222
  font-family 'Manrope',-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif
  font-weight 100

.app
  color var(--theme-foreground)

  &.dark
    --theme-foreground white
    --theme-background black
    --theme-shadow #ffffff18

a
  text-decoration none
  color var(--theme-primary)

.tabs
  padding 0.5rem 1rem

  .tab
    padding 0.5rem
    display inline-block
    color var(--theme-primary)
    cursor pointer
    margin 0 0.1rem
    width 0.8rem
    height 0.8rem
    line-height 0.8rem
    text-align center

    &.active
      background var(--theme-primary)
      color var(--theme-background)
      font-weight normal

.icon.button
  display inline-block
  font-size 1.4rem
  cursor pointer
  padding 0.3rem
  position relative

  &:hover
    background #8881

  .number
    position absolute
    left 50%
    top 50%
    text-align center
    transform translate(-50%, -50%) translateX(-0.5px)
    font-size 0.8rem
    user-select none

#phone-case
  background var(--theme-background)
  height 100vh
  overflow-y auto
  overflow-x hidden
  scrollbar-width none
  position relative
  left 50%
  transform translateX(-50%)

  &::-webkit-scrollbar
    display block
    width 0px

  .nav
    margin-bottom 0.3rem
    display grid
    grid-template-columns max-content auto

    & > *
      margin auto 0

    .header
      padding 1.3rem
      font-size 1.3rem
      font-weight 100
      line-height 1.3rem

    .buttons
      padding 1rem 0

      &:first-child
        padding 1rem

  .footer
    padding 1rem
    font-size 0.9rem
    color var(--theme-foreground)

    .powered
      font-size 0.8rem
      opacity 0.8

  .grid
    display grid
    grid-template-columns 1fr 1fr 1fr

.trashbin
  position fixed
  bottom 0
  left 50%
  right 0
  padding 1rem 0
  background #bd3a3a
  color white
  transition .2s ease-in
  transform translate(-50%, 100%)
  text-align center
  opacity 1

  &.active
    transform translate(-50%, 0)
</style>
