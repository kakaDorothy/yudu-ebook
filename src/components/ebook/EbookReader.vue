<template>
  <div class="ebook-reader">
   <div id="read"></div>
   <div class="ebook-reader-mask"
        @click="onMaskClick"
        @touchmove="move"
        @touchend="moveEnd"
   ></div>
  </div>
</template>

<script>
import { ebookMixin } from '../../utils/mixin'
import Epub from 'epubjs'
import {
  saveFontFamily, getFontFamily,
  saveFontSize, getFontSize,
  saveTheme, getTheme,
  getLocation
} from '../../utils/localStorage'
import { flatten } from '../../utils/book'
global.ePub = Epub
export default {
  mixins: [ebookMixin],
  methods: {
    move (e) {
      let offsetY = 0
      if (this.firstOffsetY) {
        offsetY = e.changedTouches[0].clientY - this.firstOffsetY
        this.setOffsetY(offsetY)
      } else {
        this.firstOffsetY = e.changedTouches[0].clientY
      }
      e.preventDefault()
      e.stopPropagation()
    },
    moveEnd (e) {
      this.setOffsetY(0)
      this.firstOffsetY = null
    },
    onMaskClick (e) {
      const offsetX = e.offsetX
      const width = window.innerWidth
      if (offsetX > 0 && offsetX < width * 0.3) {
        this.prevPage()
      } else if (offsetX > 0 && offsetX > width * 0.7) {
        this.nextPage()
      } else {
        this.toggleTitleAndMenu()
      }
    },
    prevPage () {
      if (this.rendition) {
        this.rendition.prev().then(() => {
          this.refreshLocation()
        })
        this.hideTitleAndMenu()
      }
    },
    nextPage () {
      if (this.rendition) {
        this.rendition.next().then(() => {
          this.refreshLocation()
        })
        this.hideTitleAndMenu()
      }
    },
    toggleTitleAndMenu () {
      if (this.menuVisible) {
        this.setSettingVisible(-1)
        this.setFontFamilyVisible(false)
      }
      this.setMenuVisible(!this.menuVisible)
    },
    // 封装fontSize离线存储方法
    initFontSize () {
      const fontSize = getFontSize(this.fileName)
      if (!fontSize) {
        saveFontSize(this.fileName, this.defaultFontSize)
      } else {
        this.rendition.themes.fontSize(fontSize)
        this.setDefaultFontSize(fontSize)
      }
    },
    initFontFamily () {
      const font = getFontFamily(this.fileName)
      if (!font) {
        saveFontFamily(this.fileName, this.defaultFontFamily)
      } else {
        this.rendition.themes.font(font)
        this.setDefaultFontFamily(font)
      }
    },
    initTheme () {
      let defaultTheme = getTheme(this.fileName)
      if (!defaultTheme) {
        defaultTheme = this.themeList[0].name
        saveTheme(this.fileName, defaultTheme)
      }
      this.setDefaultTheme(defaultTheme)
      this.themeList.forEach(theme => {
        this.rendition.themes.register(theme.name, theme.style)
      })
      this.rendition.themes.select(defaultTheme)
    },
    initRendition () {
      // 渲染的初始化过程
      this.rendition = this.book.renderTo('read', {
        width: innerWidth,
        height: innerHeight,
        // 做微信的兼容性配置
        method: 'default'
      })
      // 获取当前位置
      const location = getLocation(this.fileName)
      this.display(location, () => {
        this.initTheme()
        this.initFontSize()
        this.initFontFamily()
        this.initGlobalStyle()
      })
      // 阅读器渲染完成后，可以手动添加样式文件
      this.rendition.hooks.content.register(contents => {
        Promise.all([
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/daysOne.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/cabin.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/montserrat.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/tangerine.css`)
        ]).then(() => {
        })
      })
    },
    initGesture () {
      // 为iframe绑定事件
      this.rendition.on('touchstart', event => {
        // 获取一只手指点击屏幕的x轴位置
        this.touchStartX = event.changedTouches[0].clientX
        // 获取手指点击时间来判断是否是手指长按屏幕事件
        this.touchStartTime = event.timeStamp
      })
      this.rendition.on('touchend', event => {
        // 离开屏幕时获得x轴的偏移量
        const offsetX = event.changedTouches[0].clientX - this.touchStartX
        // 我们消耗的时间
        const time = event.timeStamp - this.touchStartTime
        // 判断滑动方向和方式
        // 划过时间需要小于500毫秒，偏移量大于40时我们进入上一页
        if (time < 500 && offsetX > 40) {
          this.prevPage()
        } else if (time < 500 && offsetX < -40) {
          // 切换到下一页
          this.nextPage()
        } else {
          // 显示标题和菜单栏
          this.toggleTitleAndMenu()
        }
        // 禁止默认事件和方法调用
        event.preventDefault()
        event.stopPropagation()
      })
    },
    // 目录面板的书籍封面
    parseBook () {
      this.book.loaded.cover.then(cover => {
        this.book.archive.createUrl(cover).then(url => {
          this.setCover(url)
        })
      })
      this.book.loaded.metadata.then(metadata => {
        this.setMetadata(metadata)
      })
      this.book.loaded.navigation.then(nav => {
        const navItem = flatten(nav.toc) // toc 是存放目录的数组
        /* let navigation = [
          {
            id: 1,
            subitems: [
              {
                id: 2,
                subitems: [
                  {
                    id: 3,
                    subitems: [],
                    parent: 2
                  },
                  {
                    id: 4,
                    subitems: [],
                    parent: 2
                  }
                ],
                parent: 1
              },
              {
                id: 5,
                subitems: [],
                parent: 1
              }
            ],
            parent: undefined
          },
          {
            id: 6,
            subitems: [],
            parent: undefined
          }
        ]
        navigation = flatten(navigation)

        navigation.forEach(item => {
          item.level = find(item)
        }) */
        function find (item, level = 0) {
          return !item.parent ? level : find(navItem.filter(parentItem => parentItem.id === item.parent)[0], ++level)
        }
        navItem.forEach(item => {
          item.level = find(item)
        })
        this.setNavigation(navItem)
      })
    },
    initEpub () {
      const url = process.env.VUE_APP_RES_URL + '/epub/' + this.fileName + '.epub'
      this.book = new Epub(url)
      this.setCurrentBook(this.book)
      this.initRendition()
      // this.initGesture()
      this.parseBook()
      // 实现分页功能，为计算阅读进度做准备
      this.book.ready.then(() => {
        return this.book.locations.generate(750 * (window.innerWidth / 375) *
          (getFontSize(this.fileName) / 16))
      }).then(locations => { // 异步调用
        this.setBookAvailable(true)
        this.refreshLocation()
      })
    }
  },
  mounted () {
    this.setFileName(
      this.$route.params.fileName.split('|').join('/'))
      .then(() => {
        this.initEpub()
      })
  }
}
</script>

<style lang="scss" rel="stylesheet" scoped>
  @import "../../assets/styles/global";
  .ebook-reader {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .ebook-reader-mask {
      position: absolute;
      z-index: 150;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
    }
  }
</style>
