<template>
  <div v-if="!locked" class="app" :class="{dark, shooting}">
    <div id="phone-case" :style="caseStyle">
      <div id="phone-case-inner">
        <div class="nav">
          <div v-if="width > 300" class="header">
            Foto<br><b>Rehearse</b>
          </div>
          <div v-show="!shooting" class="buttons">
            <button type="button" class="icon button" title="Take Screenshot" @click="shoot">
              <span class="iconify" data-icon="mdi-light:camera" />
            </button>

            <button v-if="isDesktop && !inPopup" type="button" class="icon button" title="Popup" @click="openPopup">
              <span class="iconify" data-icon="mdi-light:arrange-send-backward" />
            </button>

            <button type="button" class="icon button" title="New Post" @click="addFront">
              <span class="iconify" data-icon="mdi-light:plus-circle" />
            </button>

            <button type="button" class="icon button" :title="dark ? 'Light Mode' : 'Dark Mode'" @click="toggleDark">
              <div v-show="dark">
                <span class="iconify" data-icon="mdi-light:lightbulb-on" />
              </div>
              <div v-show="!dark">
                <span class="iconify" data-icon="mdi-light:lightbulb" />
              </div>
            </button>

            <button type="button" class="icon button" title="Toggle Gap" @click="toggleGap">
              <div v-show="gap">
                <span class="iconify" data-icon="mdi-light:border-all" />
              </div>
              <div v-show="!gap">
                <span class="iconify" data-icon="mdi-light:border-outside" />
              </div>
            </button>

            <button type="button" class="icon button" title="Switch mode" @click="switchMode">
              <div v-show="imageMode == 0">
                <span class="iconify" data-icon="mdi-light:picture" />
              </div>
              <div v-show="imageMode == 1">
                <span class="iconify" data-icon="mdi-light:flask-empty" />
              </div>
              <div v-show="imageMode == 2">
                <span class="iconify" data-icon="mdi-light:flask" />
              </div>
            </button>

            <button type="button" class="icon button" title="Switch Tabs" @click="switchTab">
              <span class="iconify" data-icon="mdi-light:shape-circle" />
              <span class="number">{{ tab+1 }}</span>
            </button>
          </div>
        </div>

        <div class="grid" :style="{ gridGap: `${gap}px` }">
          <post
            v-for="(post, idx) in posts"
            :key="idx"
            :post="post"
            :size="size"
            :mode="imageMode"
            :shooting="shooting"
            :draggable="true"
            @drop.native="e=>drop(idx, e)"
            @dragend.native="dragend"
            @dragover.native="allowDrop"
            @dragenter.native="allowDrop"
            @dragstart.native="e=>drag(idx, e)"
            @upload="urls=>handleUploaded(idx,urls)"
          />
          <post
            v-show="!shooting"
            :size="size"
            @click.native="add"
          >
            <div class="icon">
              <span class="iconify" data-icon="mdi-light:plus-circle" />
            </div>
          </post>
        </div>

        <div v-if="!shooting" class="footer">
          <div class="author">
            by
            <a href="https://www.instagram.com/antfu7">@antfu</a>
            for
            <a href="https://www.instagram.com/iiiiiiines__">@ines</a>
          </div>
          <div class="powered">
            powered by
            <a href="https://github.com/vuejs/vite">vite</a>
            ,
            <a href="https://github.com/antfu/vueuse">vueuse</a>
            and
            <a>♥️</a>
            ・
            source on <a href="https://github.com/antfu/foto-rehearse">Github</a>
          </div>
        </div>
      </div>
    </div>
    <div class="toast" :class="{ active: !!toast }">
      {{ toast }}
    </div>
    <div
      v-show="!shooting"
      class="trashbin"
      :class="{active:dragging}"
      :style="caseStyle"
      @drop.native="dropRemove"
      @dragenter.native="allowDrop"
      @dragover.native="allowDrop"
    >
      Drop here to Remove
    </div>
  </div>
</template>

<script>
/* eslint-disable no-self-assign */
import { computed, ref, watch, nextTick } from 'vue'
import { useWindowSize, loadPosts, savePosts, openDb, popup, useStorage, CONFIG_PREFIX, takeScreenshot } from './utils.js'
import Post from './Post.vue'

const TOAST_TIMEOUT = 2500

export default {
  components: {
    Post,
  },
  setup() {
    const tab = useStorage(`${CONFIG_PREFIX}-tab`, 0)
    const gap = useStorage(`${CONFIG_PREFIX}-gap`, 3)
    const dark = useStorage(`${CONFIG_PREFIX}-dark`, false)

    const { width, height } = useWindowSize()
    const posts = ref([])
    const dragging = ref(false)
    const shooting = ref(false)
    const locked = ref(false)
    const toast = ref('')
    const imageMode = ref(0) // 0: photo, 1: thief, 2: pattele
    let db
    let toastTimer

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
      return Math.min(
        width.value,
        isDesktop.value
          ? height.value * PHONE_RATIO - 5
          : width.value,
      )
    })
    const size = computed(() => {
      return (caseWidth.value - gap.value * 2) / 3
    })
    const caseStyle = computed(() => ({
      width: `${caseWidth.value}px`,
    }))
    const handleUploaded = (index, urls) => {
      for (let i = 0; i < urls.length; i++) {
        // append to tail
        if (!posts.value[i + index])
          posts.value.push({ url: urls[i] })
        // insert into middle
        else if (posts.value[i + index].url)
          posts.value.splice(i + index, 0, { url: urls[i] })
        // replace empty
        else
          posts.value[i + index].url = urls[i]
      }
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
    const openPopup = async() => {
      locked.value = true
      toast.value = 'Poped'
      await popup(location.href, 'foto-rehearse', caseWidth.value, height.value)
      location.reload()
    }
    const shoot = () => {
      shooting.value = true
      toast.value = 'Taking Screenshot'
      nextTick(() => {
        takeScreenshot()
        shooting.value = false
      })
    }
    const toggleDark = () => {
      dark.value = !dark.value
      toast.value = dark.value ? 'Dark mode' : 'Light mode'
    }
    const toggleGap = () => {
      gap.value = gap.value ? 0 : 3
      toast.value = gap.value ? 'Gap on' : 'Gap off'
    }
    const switchMode = () => {
      imageMode.value = (imageMode.value + 1) % 3
      toast.value = ['Image mode', 'Color mode', 'Pattle mode'][imageMode.value]
    }
    const switchTab = () => {
      tab.value = (tab.value + 1) % 3
      toast.value = `Tab ${tab.value + 1}`
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

    watch(
      toast,
      () => {
        if (toast.value) {
          clearTimeout(toastTimer)
          toastTimer = setTimeout(() => {
            toast.value = ''
          }, TOAST_TIMEOUT)
        }
      },
    )

    return {
      inPopup: window.name === 'foto-rehearse',
      shoot,
      height,
      width,
      gap,
      toast,
      dark,
      dragging,
      tab,
      size,
      locked,
      shooting,
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
      toggleDark,
      toggleGap,
      switchMode,
      switchTab,
    }
  },
}
</script>

<style lang="stylus">
:root
  --theme-primary #d37070
  --post-width 100px
  --theme-foreground #000d
  --theme-foreground-fade #0006
  --theme-background white
  --theme-shadow #00000008

html, body, .app
  user-select none
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
    --theme-foreground-fade #fff8
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
  background none
  border none
  outline none
  border-radius 2px
  text-align center
  line-height 1.4rem
  color inherit

  &:hover
    background var(--theme-shadow)

  .number
    position absolute
    left 50%
    top 50%
    text-align center
    transform translate(-50%, -50%) translateX(-1px)
    font-size 0.8rem
    user-select none

#phone-case-inner
  background var(--theme-background)

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
    color var(--theme-foreground-fade)

    .powered
      font-size 0.8rem

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

.toast
  position fixed
  bottom 20vh
  left 50%
  transform translate(-50%, 100%)
  padding 0.7rem 1rem
  min-width 200px
  text-align center
  transition .2s ease-in-out
  pointer-events none
  opacity 0
  font-size 1.1rem
  color var(--theme-foregroud)

  &.active
    opacity 1

  &::before
    content ''
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    opacity 0.7
    z-index -1
    border-radius 0.3rem
    background var(--theme-background)

  &::after
    content ''
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    z-index -1
    border-radius 0.3rem
    border 1px solid var(--theme-background)
</style>
