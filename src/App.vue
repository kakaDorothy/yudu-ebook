<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
/* 利用rem，使字體隨著屏幕大小而改变，同时设置字体大小上限 */
document.addEventListener('DOMContentLoaded', () => {
  const html = document.querySelector('html')
  let fontSize = window.innerWidth / 10
  // eslint-disable-next-line no-const-assign
  fontSize = fontSize > 50 ? 50 : fontSize
  html.style.fontSize = fontSize + 'px'
})
</script>

<style lang="scss" scoped>
  @import "./assets/styles/global.scss";
  #app {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #6d7278;
  }
</style>
