<script setup lang="ts">
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useCustomerStore, useStatisticStore } from '@/@core/stores';
import { useSalesInvoiceStore } from '@/@core/stores/salesinvoice';
import { ICustomerData } from '@/@core/typedefs';
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue';
import SalesInvoice from '@/views/pages/customer/SalesInvoice.vue';
import dayjs from 'dayjs';


const route = useRoute('customers-view-customer-id')
const searchQuery = ref('')
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const customerStore = useCustomerStore()
const statStore = useStatisticStore()
const salesInvoiceStore = useSalesInvoiceStore()
const id = route.params.customerId as string
let customer = ref<ICustomerData | null>(null)
const fetchCustomer = async () => {
  await customerStore.fetchCustomerById(id)
}

const fetchRecentSalesInvoices = async () => {
  salesInvoiceStore.updateQuery({
    id,
    page: 1,
    per_page: 100,
    start_date: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    group_by: 'ItemCode',
  })
  await salesInvoiceStore.fetchSalesInvoices()
}

const activeItems = computed(() => {
  const rows = salesInvoiceStore.salesInvoices.data ?? []
  const grouped = new Map<string, any>()
  rows.forEach((row: any) => {
    const code = String(row.ItemCode ?? row.item_code ?? '')
    if (!code) return
    const item = grouped.get(code) ?? {
      code,
      product: row.Dscription ?? row.description ?? code,
      lastPurchase: row.DocDate ?? row.doc_date,
      totalRevenue: 0,
      quantity: 0,
      unit: row.SalesUOM ?? row.unit ?? 'Kg',
    }
    item.totalRevenue += Number(row.TotalSales ?? row.total_sales ?? row.Total ?? 0)
    item.quantity += Number(row.total_weight ?? row.value?.total_weight ?? row.QtyKg ?? row.qty_kg ?? row.Quantity ?? row.quantity ?? row.Qty ?? row.volume ?? 0)
    if (row.DocDate && (!item.lastPurchase || dayjs(row.DocDate).isAfter(dayjs(item.lastPurchase)))) item.lastPurchase = row.DocDate
    grouped.set(code, item)
  })
  return [...grouped.values()]
})

onMounted(async () => {
  await fetchCustomer()
  await fetchRecentSalesInvoices()
  await statStore.fetchMoMSummary(id)
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
      <CustomerOverview :data="customer" :onFinish="fetchCustomer" />
      <VCol cols="12">
        <VCard>
          <VCardItem>
            <VCardTitle>ACTIVE ITEMS</VCardTitle>
            <VCardSubtitle>Items purchased in the last 14 days</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable v-if="activeItems.length" density="comfortable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Last purchase</th>
                  <th>Total revenue</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in activeItems" :key="item.code">
                  <td>{{ item.product }} ({{ item.code }})</td>
                  <td>{{ item.lastPurchase ? formatDate(item.lastPurchase) : '-' }}</td>
                  <td>{{ formatMoney(item.totalRevenue) }}</td>
                  <td>{{ item.quantity }}{{ item.unit ? ` ${item.unit}` : '' }}</td>
                </tr>
              </tbody>
            </VTable>
            <span v-else class="text-medium-emphasis">No items purchased in the last 14 days.</span>
          </VCardText>
        </VCard>
      </VCol>
      <SalesStatistic :id="id" :companyId="customer?.CompanyId" />
      <SalesInvoice :id="id" />
    </VRow>
  </section>
</template>
