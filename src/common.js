import axios from 'axios'
export default {
  methods: {

    getStorageItem (key) {
      if (!window.localStorage || !key) return undefined
      return window.localStorage.getItem(key)
    },

    setStorageItem (key, value) {
      if (window.localStorage && key) window.localStorage.setItem(key, value)
    },

    async ajax (param) {
      this.showLoading()
      const axiosResult = axios({
        method: 'GET',
        ...param
      })
      axiosResult.finally((obj) => {
        this.hideLoading()
      })
      return axiosResult
    },

    showLoading () {
      window.document.activeElement && window.document.activeElement.blur()
      this.$store.commit('setLoading', true)
    },

    hideLoading () {
      this.$store.commit('setLoading', false)
    },

    async validateFocus (args) {
      if (!args) console.error('validateFocus error')
      let list = args
      if (!(args instanceof Array)) {
        list = Object.keys(args).map((arg) => args[arg])
      }
      let invalidRef
      for await (const arg of list) {
        const unitResult = await arg.validate()
        if (!unitResult && !invalidRef) {
          invalidRef = arg
        }
      }

      // focus
      if (invalidRef) {
        const elm = invalidRef.$vnode && invalidRef.$vnode.elm
        if (elm) elm.querySelector('.error') && elm.querySelector('.error').focus()
      }

      return !invalidRef
    }

  }
}
