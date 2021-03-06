<template>
  <ValidationProvider
    :rules="thisValidate"
    :name="name"
  >
    <div
      slot-scope="{ errors }"
      class="error_msg_wrap"
      @mouseover="mouseover"
      @mouseleave="mouseleave"
    >
      <masked-input
        v-show="notShow===undefined"
        :ref="name"
        v-model="thisValue"
        :placeholder="placeholder"
        :mask="thisMask"
        :guide="guide"
        :type="type"
        :class="{
          error: errors && errors[0],
          tc: ['hh:mm', 'hh:mm:ss'].includes(mask),
          tr: (mask=='number' && allowLeadingZeroes===undefined),
        }"
        :maxlength="maxlength"
        :disabled="disabled"
        :autofocus="autofocus"
        v-on="$listeners"
        @input="input"
        @blur="blur"
      />
      <span
        v-if="errors && errors[0]"
        class="error_msg"
        :style="showError"
      >
        {{ errors[0] }}
      </span>
    </div>
  </ValidationProvider>
</template>

<script>
import MaskedInput, { conformToMask } from 'vue-text-mask'
import createNumberMask from 'text-mask-addons/dist/createNumberMask'
import { ValidationProvider } from 'vee-validate'
export default {
  // inject: ['$validator'],
  components: { MaskedInput, ValidationProvider },
  props: {
    placeholder: { type: String, default: undefined },
    type: { type: String, default: 'text' },
    name: { type: String, default: undefined },
    model: { type: String, default: undefined },
    validate: { type: String, default: undefined },
    value: { type: undefined, default: undefined },
    maxlength: { type: undefined, default: 200 },
    mask: { type: undefined, default: undefined },
    disabled: { type: undefined, default: undefined },
    mobile: { type: undefined, default: undefined },
    notShow: { type: undefined, default: undefined },
    autofocus: { type: undefined, default: undefined },
    // nubmer 일 경우, 0부터 시작해도 되는지
    allowLeadingZeroes: { type: undefined, default: undefined },
    // nubmer 일 경우, 천단위 구분자
    thousandsSeparatorSymbol: { type: undefined, default: undefined },
    // nubmer 일 경우, 소수점 자리수
    decimalLimit: { type: undefined, default: undefined },
    // blur시, 대문자 치환여부
    upperCase: { type: undefined, default: undefined }
  },
  data () {
    return {
      thisValidate: undefined,
      thisValue: undefined,
      thisMask: false,
      guide: false,
      showError: { display: this.mobile === undefined ? 'none' : 'block' }
    }
  },
  /* 처음 init시, formatting 된 값으로 setting 되도록 watch 함수 추가 */
  watch: {
    value: function () {
      const mask = this.mask
      if (!mask || !this.thisMask) {
        this.thisValue = this.valueNullChk(this.value)
      } else {
        this.thisValue = conformToMask(
          this.valueNullChk(this.value),
          this.thisMask,
          { guide: this.guide }
        ).conformedValue
      }
      this.getParentPassVal(this.thisValue)
    },
    mask: function () {
      this.makeMask(this.mask)
      this.getParentPassVal(this.thisValue)
    },
    validate: function () {
      this.thisValidate = this.validate
    }
  },
  created () {
    this.thisValidate = this.validate
    this.makeMask(this.mask)

    // 초기 focus 잡히는것 방지
    // this.$refs[this.name].blur()
  },
  mounted () {
    const mask = this.mask
    if (!mask) {
      this.thisValue = this.valueNullChk(this.value)
    } else {
      this.thisValue = conformToMask(
        this.valueNullChk(this.value),
        this.thisMask,
        { guide: this.guide }
      ).conformedValue
    }
  },
  methods: {
    valueNullChk (value) {
      let returnValue = ''
      if (value !== null && value !== undefined) {
        returnValue = String(value)
      }
      return returnValue
    },

    makeMask (mask) {
      if (!mask) {
        this.thisMask = false
      } else if (typeof mask === 'string') {
        if (mask === 'phone') {
          this.thisMask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]
        } else if (mask === 'number') {
          this.thisMask = createNumberMask({
            integerLimit: 10,
            allowDecimal: this.decimalLimit !== undefined,
            decimalLimit: this.decimalLimit || 0,
            prefix: '',
            suffix: '',
            allowLeadingZeroes: this.allowLeadingZeroes !== undefined,
            thousandsSeparatorSymbol: this.thousandsSeparatorSymbol === undefined ? ',' : (this.thousandsSeparatorSymbol || '')
          })
        } else if (mask === 'zipcode') { // 우편번호
          this.thisMask = (rawValue) => {
            return this.valueNullChk(rawValue).replace(/[^0-9\\-]/g, '').split('').map((char) => {
              return /[0-9\\-]/
            })
          }
        } else if (mask === 'numberAlpha') { // 국가코드
          this.thisMask = (rawValue) => {
            return this.valueNullChk(rawValue).replace(/[^0-9a-zA-Z]/g, '').split('').map((char) => {
              return /[0-9a-zA-Z]/
            })
          }
        } else if (mask === 'resno') { // 주민번호
          this.thisMask = (rawValue) => {
            return this.valueNullChk(rawValue).replace(/[^0-9]/g, '').split('').reduce((entry, char, index) => {
              if (index === 6) entry.push('-')
              entry.push(/[0-9]/)
              return entry
            }, [])
          }
        } else if (mask === 'hh:mm') { // hh:mm
          this.thisMask = [/[0-9]/, /[0-9]/, ':', /[0-9]/, /[0-9]/]
        } else if (mask === 'hh:mm:ss') { // hh:mm:ss
          this.thisMask = [/[0-9]/, /[0-9]/, ':', /[0-9]/, /[0-9]/, ':', /[0-9]/, /[0-9]/]
        }
      }
    },
    input (value) {
      if (typeof event === 'undefined' || !event || !event.target) return

      // number mask일때, 0인 값 안바뀌는현상 수정
      let thisValue = event.target.value
      if (this.mask === 'number' && event.data && !isNaN(event.data) && thisValue === '0') {
        thisValue = event.data
      }
      this.thisValue = this.valueNullChk(thisValue)
      this.getParentPassVal(this.thisValue)
      // this.errors && this.$validator.validate(this.name)
    },
    blur (event) {
      let value = this.valueNullChk(event.target.value).trim()
      if (this.upperCase !== undefined) value = value.toUpperCase()
      if (this.mask === 'hh:mm') {
        const setVal = value.replace(/[^0-9]/g, '')
        const set1 = String(Math.min(Number(setVal.substring(0, 2)), 23)).padStart(2, '0')
        const set2 = String(Math.min(Number(setVal.substring(2)), 59)).padStart(2, '0')
        value = `${set1}:${set2}`
      } else if (this.mask === 'hh:mm:ss') {
        const setVal = value.replace(/[^0-9]/g, '')
        const set1 = String(Math.min(Number(setVal.substring(0, 2)), 23)).padStart(2, '0')
        const set2 = String(Math.min(Number(setVal.substring(2, 4)), 59)).padStart(2, '0')
        const set3 = String(Math.min(Number(setVal.substring(4)), 59)).padStart(2, '0')
        value = `${set1}:${set2}:${set3}`
      }
      this.thisValue = value
      this.getParentPassVal(value)
    },
    getParentPassVal (targetValue) {
      let parentPassValue = targetValue
      const mask = this.mask
      if (mask === 'phone') {
        parentPassValue = targetValue.replace(/[^0-9]/g, '')
      } else if (mask === 'number') {
        parentPassValue = targetValue.replace(/[^0-9\\.]/g, '')
      } else if (mask === 'resno') {
        parentPassValue = targetValue.replace(/[^0-9]/g, '')
      } else if (mask === 'hh:mm') {
        parentPassValue = targetValue.replace(/[^0-9]/g, '')
      } else if (mask === 'hh:mm:ss') {
        parentPassValue = targetValue.replace(/[^0-9]/g, '')
      }
      this.$emit('input', parentPassValue)
    },

    mouseover (event) {
      this.showError = { display: 'block' }
    },
    mouseleave (event) {
      this.showError = { display: this.mobile === undefined ? 'none' : 'block' }
    }
  }
}
</script>
<style scoped>
.error{color: #f24035;}
strong.error{color: #ee1f29;}
.error_msg_wrap{position:relative;display:block;}
.error_msg_wrap .error_msg{position: absolute; top:100%; left:0; margin-top:-1px; background: rgba(255,0,0,1); color: rgba(255,255,255,1); font-size: 11px; padding: 4px 6px 5px; z-index: 999999; border-radius: 0; text-align: left;}
input.error{border-color: rgba(255,0,0,1) !important;}
</style>
