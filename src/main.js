import Vue from 'vue'
import App from './App.vue'
import index from './router'
import store from './store'
import './assets/styles/icon.css'
import './assets/styles/global.scss'
import i18n from './lang'

Vue.config.productionTip = false

new Vue({
  router: index,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
