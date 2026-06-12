<script lang="ts" setup>
import { useConfigStore } from '@/@core/stores/config'
import { useSalesInvoiceStore } from '@/@core/stores/salesinvoice'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue'
import SalesInvoiceTable from '@/views/pages/customer/SalesInvoiceTable.vue'
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue'


const router = useRoute('customers-view-customerId-item-itemId' as any)
const groupBy = ref('DocNum')
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const page = ref(1)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const selectedRows = ref<ISalesInvoice[]>([])
const sortOptions = ref<SortItem[]>([{key: 'DocDate', order: 'desc'}])
const salesInvoiceStore = useSalesInvoiceStore()

const configStore = useConfigStore()

onMounted(async () => {
  salesInvoiceStore.updateQuery({
    id: router.params.customerId,
    invoiceId: router.params.invoiceId,
    per_page: itemsPerPage,
    page,
    sort_options: [[{ key: 'DocDate', order: 'desc' }]],
    start_date: startDate,
    end_date: endDate,
    group_by: groupBy
  })
  salesInvoiceStore.fetchSalesInvoices()
})

const { data: customerData, execute: fetchCustomer } = await useApi<any>(`customer/${router.params.customerId}`)


const customer = computed(() => customerData.value.data)

const headers = [
  { title: 'Invoice', value: 'DocNum', sortable: true },
  { title: 'Inv Date', value: 'DocDate', sortable: true },
  { title: 'Description', value: 'Dscription', sortable: true },
  { title: 'Item Code', value: 'ItemCode', sortable: true },
  { title: 'Volume (Kg)', value:'total_weight', sortable: true },
  { title: 'Price', value: 'PriceBefDisc', sortable: true },
  { title: 'Discount Line', value: 'DiscLine', sortable: true},
  { title: 'Discount Total', value: 'DiscTotal', sortable: true},
  { title: 'Total', value: 'TotalSales', sortable: true },
]


const computedHeaders = computed(() => {
  if (groupBy.value === 'ItemCode') {
    return headers.filter(header => header.value !== 'Dscription' && header.value !== 'ItemCode')
  }
  // return headers.filter(header => header.value !== 'DocNum')
  return headers.filter(header => header.value !== 'DocNum')

})

const salesInvoicesData = computed(() => salesInvoiceStore.salesInvoices)

const totalSales = computed(() => salesInvoiceStore.salesInvoices.total)

const updateOptions = (options: any) => {
  if (JSON.stringify(options.sortBy) !== JSON.stringify(sortOptions.value)) {
    sortOptions.value = [options.sortBy]
  } else {
    sortOptions.value = [{ "key": "DocDate", "order": "desc" }]
  }
}

const updateSelectedRows = (rows: ISalesInvoice[]) => {
  selectedRows.value = rows.map((row: ISalesInvoice) => ({ ...row }))
}

const handleRefresh = (stopLoading: () => void) => {
  salesInvoiceStore.fetchSalesInvoices().finally(() => {
    stopLoading();
  });
}
</script>

<template>
  <CustomerOverview :data="customer" :id="customer.id" />
  <SalesStatistic :id="customer.id" :companyId="customer.companyId"/>
  <VCol cols="12">
    <AppCardActions
      :loading="configStore.loading"
      action-refresh
      action-collapsed
      @refresh="handleRefresh"
      title="SALES INVOICES"
    >
      <SalesInvoiceTable 
        :sales-invoices-data="salesInvoicesData" 
        :customer-id="router.params.customerId"
        :headers="computedHeaders" 
        :items-length="totalSales" 
        :group-by="groupBy"
        v-model:loading="configStore.loading"
        :item-value="groupBy === 'DocNum' ? 'DocNum_ItemCode' : 'ItemCode_DocNum'" 
        v-model:page="page"
        v-model:items-per-page="itemsPerPage" 
        v-model:selected-rows="selectedRows"
        @update:options="updateOptions"
        @update:selected-rows="updateSelectedRows"
        :grouped="false" 
      />
    </AppCardActions>
  </VCol>
</template>
