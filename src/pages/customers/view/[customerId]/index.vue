<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ISalesInvoice } from '@/@core/typedefs/salesinvoice';
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';
import SalesInvoice from '@/views/pages/customer/SalesInvoice.vue';
import { useCustomerStore } from '@/@core/stores';
import { ICustomerData } from '@/@core/typedefs';


const route = useRoute('customers-view-customerId')
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const customerStore = useCustomerStore()

const id = route.params.customerId as string
let customer = ref<ICustomerData | null>(null)
const fetchCustomer = async () => {
  await customerStore.fetchCustomerById(id)
}

onMounted(async() => {
  await fetchCustomer()
  customer.value = customerStore.customer
})

// Delayed search
watch(searchQuery, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 400) // delay 400ms
})

</script>

<template>
  <section>
  <VRow v-if="customer">    
    <CustomerOverview :data="customer" :onFinish="fetchCustomer"/>
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
