<script lang="ts" setup>
import { ref, watch } from 'vue'
import { VTextField } from 'vuetify/components'

const props = defineProps<{
  modelValue: number
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const inputValue = ref('')

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

const parseCurrency = (value: string): number => {
  const numeric = parseInt(value.replace(/[^\d]/g, ''), 10)
  return isNaN(numeric) ? 0 : numeric
}

watch(
  () => props.modelValue,
  (val) => {
    inputValue.value = val ? formatter.format(val) : ''
  },
  { immediate: true }
)

const onInput = (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return
  const val = event.target.value

  inputValue.value = val
  const parsed = parseCurrency(val)
  emit('update:modelValue', parsed)
}

const onBlur = () => {
  // Format saat blur
  const parsed = parseCurrency(inputValue.value)
  inputValue.value = parsed ? formatter.format(parsed) : ''
}
</script>

<template>
  <VTextField
    :label="label"
    :placeholder="placeholder"
    :model-value="inputValue"
    @input="onInput"
    @blur="onBlur"
    type="text"
  />
</template>
