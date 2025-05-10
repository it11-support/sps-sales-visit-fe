<script setup lang="ts">
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';

const route = useRoute('customers-view-id')

const { data: customerData } = await useApi<any>(`customer/${route.params.id}`)
</script>

<template>
  <VRow v-if="customerData">    
    <VCol
      cols="12"
    >
      <CustomerOverview :data="customerData.data" />
    </VCol>
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Customer with id  {{ route.params.id }} not found!
    </VAlert>
  </div>
</template>
