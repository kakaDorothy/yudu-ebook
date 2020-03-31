<template>
<div class="ebook-bookmark" ref="bookmark">
  <div class="ebook-bookmark-text-wrapper">
    <div class="ebook-bookmark-down-wrapper" ref="iconDown">
      <span class="icon-down"></span>
    </div>
    <div class="ebook-bookmark-text">{{text}}</div>
  </div>
  <div class="ebook-bookmark-icon-wrapper" :style="isFixed ? fixedStyle : {}">
    <bookmark :width="15" :height="35" :color="color" ref="bookmark"></bookmark>
  </div>
</div>
</template>

<script>
import Bookmark from '../common/Bookmark'
import { realPx } from '../../utils/utils'
import { ebookMixin } from '../../utils/mixin'
import { getBookmark, saveBookmark } from '../../utils/localStorage'

const BLUE = '#346cbc'
const WHITE = '#fff'
export default {
  mixins: [ebookMixin],
  components: {
    Bookmark
  },
  computed: {
    height () {
      return realPx(35)
    },
    threshold () {
      return realPx(55)
    },
    fixedStyle () {
      return {
        position: 'fixed',
        right: `${(window.innerWidth - this.$refs.bookmark.clientWidth) / 2}px`,
        top: 0
      }
    }
  },
  watch: {
    offsetY (v) {
      // 在书本分页或者菜单栏可见或者设置面板可见时，不能添加书签
      if (!this.bookAvailable || this.menuVisible || this.settingVisible >= 0) {
        return
      }
      if (v >= this.height && v <= this.threshold) {
        // 状态2：未到达临界状态
        this.beforeThreshold(v)
      } else if (v >= this.threshold) {
        // 状态3：超越临界状态
        this.afterThreshold(v)
      } else if (v > 0 && v < this.height) {
        // 状态1：未超过书签高度
        this.beforeHeight()
      } else if (v === 0) {
        // 状态4：归位
        this.restore()
      }
    },
    isBookmark (v) {
      this.isFixed = v
      if (v) {
        this.color = BLUE
      } else {
        this.color = WHITE
      }
    }
  },
  data () {
    return {
      text: '',
      color: WHITE,
      isFixed: false
    }
  },
  methods: {
    addBookmark () {
      this.bookmark = getBookmark(this.fileName)
      if (!this.bookmark) {
        this.bookmark = []
      }
      // 定位到书签部分地址
      const currentLocation = this.currentBook.rendition.currentLocation()
      // 取书签的前部分内容
      const cfibase = currentLocation.start.cfi.replace(/!.*/, '').replace('epubcfi(', '')
      const cfistart = currentLocation.start.cfi.replace(/.*!/, '').replace(/\)/, '')
      const cfiend = currentLocation.end.cfi.replace(/.*!/, '').replace(/\)/, '')
      const cfiRange = `epubcfi(${cfibase}!,${cfistart},${cfiend})`
      this.currentBook.getRange(cfiRange).then(range => {
        const text = range.toString().replace(/\s\s/g, '')
        this.bookmark.push({
          cfi: currentLocation.start.cfi,
          text: text
        })
        this.setIsBookmark(true)
        saveBookmark(this.fileName, this.bookmark)
      })
    },
    removeBookmark () {
      const currentLocation = this.currentBook.rendition.currentLocation()
      const cfi = currentLocation.start.cfi
      this.bookmark = getBookmark(this.fileName)
      if (this.bookmark) {
        saveBookmark(this.fileName, this.bookmark.filter(item => item.cfi !== cfi))
      }
      this.setIsBookmark(false)
    },
    restore () {
      setTimeout(() => {
        this.$refs.bookmark.style.top = `${-this.height}px`
        this.$refs.iconDown.style.transform = 'rotate(0deg)'
      }, 200)
      if (this.isFixed) {
        this.setIsBookmark(true)
        this.addBookmark()
      } else {
        this.setIsBookmark(false)
        this.removeBookmark()
      }
    },
    beforeHeight () {
      if (this.isBookmark) {
        // 显示删除书签文字
        this.text = this.$t('book.pulldownDeleteMark')
        // 书签颜色为蓝色
        this.color = BLUE
        this.isFixed = true
      } else {
        // 显示下拉添加书签文字
        this.text = this.$t('book.pulldownAddMark')
        // 书签颜色为白色
        this.color = WHITE
        this.isFixed = false
      }
    },
    beforeThreshold (v) {
      // 第二阶段展示吸顶效果
      this.$refs.bookmark.style.top = `${-v}px`
      this.beforeHeight()
      const iconDown = this.$refs.iconDown
      if (iconDown.style.transform === 'rotate(180deg)') {
        iconDown.style.transform = 'rotate(0deg)'
      }
    },
    afterThreshold (v) {
      // 第三阶段仍然要保持吸顶
      this.$refs.bookmark.style.top = `${-v}px`
      if (this.isBookmark) {
        // 显示释放删除书签文字
        this.text = this.$t('book.releaseDeleteMark')
        // 书签颜色为白色
        this.color = WHITE
        this.isFixed = false
      } else {
        this.text = this.$t('book.releaseAddMark')
        this.color = BLUE
        this.isFixed = true
      }
      // 定义2、3阶段的动画转换
      const iconDown = this.$refs.iconDown
      if (iconDown.style.transform === '' ||
        iconDown.style.transform === 'rotate(0deg)') {
        iconDown.style.transform = 'rotate(180deg)'
      }
    }
  }
}
</script>

<style lang="scss" rel="stylesheet" scoped>
  @import "../../assets/styles/global";
  .ebook-bookmark {
    position: absolute;
    top: px2rem(-35);
    left: 0;
    z-index: 200;
    width: 100%;
    height: px2rem(35);
    .ebook-bookmark-text-wrapper {
      position: absolute;
      right: px2rem(45);
      bottom: 0;
      display: flex;
      .ebook-bookmark-down-wrapper {
        font-size: px2rem(14);
        color: white;
        transition: all .2s linear;
        @include center;
      }
      .ebook-bookmark-text {
        font-size: px2rem(14);
        color: white;
      }
    }
    .ebook-bookmark-icon-wrapper {
      position: absolute;
      right: 0;
      bottom: 0;
      margin-right: px2rem(10);
    }
  }
</style>
