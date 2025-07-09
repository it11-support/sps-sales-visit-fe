<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ISalesInvoice } from '@/@core/typedefs/salesinvoice';
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';
import SalesInvoice from '@/views/pages/customer/SalesInvoice.vue';


const route = useRoute('customers-view-customerId')
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null


const { data: customerData, execute } = await useApi<any>(createUrl(`customer/${route.params.customerId}`))

const id = route.params.customerId as string

// Delayed search
watch(searchQuery, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 400) // delay 400ms
})

const selectedRows = ref<ISalesInvoice[]>([])

const updateSelectedRows = (rows: ISalesInvoice[]) => {
  selectedRows.value = rows.map((row: ISalesInvoice) => ({ ...row }));
}

</script>

<template>
  <section>
  <VRow v-if="customerData">    
    <CustomerOverview :data="customerData.data" :onFinish="execute"/>
    <SalesStatistic :id="id" />
    <SalesInvoice :id="id" />
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Customer with id  {{ id }} not found!
    </VAlert>
  </div>
  </section>
</template>
