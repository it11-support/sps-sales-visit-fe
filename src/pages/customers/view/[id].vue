<script setup lang="ts">
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice';
import { SortItem } from '@/@core/types';
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';
import SalesInvoice from '@/views/pages/customer/SalesInvoice.vue';


const route = useRoute('customers-view-id')
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const startDate = ref(null)
const endDate = ref(null)
const { data: customerData } = await useApi<any>(`customer/${route.params.id}`)
const sortOptions = ref<SortItem[]>([])

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
    <CustomerOverview :data="customerData.data" />
    <SalesInvoice :id="route.params.id" />
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Customer with id  {{ route.params.id }} not found!
    </VAlert>
  </div>
  </section>
</template>
