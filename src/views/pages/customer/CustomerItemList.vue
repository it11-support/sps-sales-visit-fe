<script setup lang="ts">
const props = defineProps<{ data: {title:string, value:string, icon?: string, isEmail?: boolean} }>()
const {title, value, icon, isEmail} = props.data
</script>

<template>
  <VListItem>
    <span class="d-flex align-center">
      <VIcon v-if="icon"
        :icon="icon || 'tabler-list-check'"
        size="24"
        class="me-2"
      />
      <div class="text-body-1 font-weight-medium me-2">{{ title }}: </div>
      <div v-if="isEmail"> 
        <a :href="`mailto:${value}`" target="_blank" class="text-primary font-weight-medium">{{ value }}</a>
      </div>
      <div v-else class="text-medium-emphasis">{{ value }}</div>
    </span>
  </VListItem>
</template>
