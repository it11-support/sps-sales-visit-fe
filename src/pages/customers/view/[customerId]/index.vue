<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ISalesInvoice } from '@/@core/typedefs/salesinvoice';
import { SortItem } from '@/@core/types';
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';
import SalesInvoice from '@/views/pages/customer/SalesInvoice.vue';


const route = useRoute('customers-view-customerId')
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const startDate = ref(null)
const endDate = ref(null)


const { data: customerData, execute } = await useApi<any>(createUrl(`customer/${route.params.customerId}`))

console.log(customerData)
const sortOptions = ref<SortItem[]>([])

const id = route.params.customerId as string
console.log(customerData)
// Delayed search
watch(searchQuery, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
    console.log('Search:', debouncedQuery.value)
  }, 400) // delay 400ms
})

console.log(startDate.value)
console.log(endDate.value)
const selectedRows = ref<ISalesInvoice[]>([])

const updateSelectedRows = (rows: ISalesInvoice[]) => {
  selectedRows.value = rows.map((row: ISalesInvoice) => ({ ...row }));
}

const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
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
