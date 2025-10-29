<script lang="ts" setup>
import { useConfigStore } from '@/@core/stores/config'
import { useSalesInvoiceStore } from '@/@core/stores/salesinvoice'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue'
import SalesInvoiceTable from '@/views/pages/customer/SalesInvoiceTable.vue'
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue'


const router = useRoute('customers-view-customerId-item-itemId' as any)
const groupBy = ref('ItemCode')
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const page = ref(1)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const selectedRows = ref<ISalesInvoice[]>([])
const sortOptions = ref<SortItem[]>([])
const salesInvoiceStore = useSalesInvoiceStore()

const configStore = useConfigStore()

onMounted(async () => {
  salesInvoiceStore.updateQuery({
    id: router.params.customerId,
    itemId: router.params.itemId,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions,
    start_date: startDate,
    end_date: endDate,
    // group_by: groupBy
  })
  salesInvoiceStore.fetchSalesInvoices()
})


const { data: customerData, execute: fetchCustomer } = await useApi<any>(createUrl(`customer/${router.params.customerId}`))
const { data: momSummaryData, execute: fetchMoMSummary} = await useApi<any>(createUrl(`customer/sales-summary-monthly/${router.params.customerId}`))

const customer = computed(() => {
  return customerData.value.data
})

const summaries = computed(() => {
  return momSummaryData.value.data
})

console.log('summaries', summaries.value)
const headers = [
  { title: 'Invoice', value: 'DocNum', sortable: true },
  { title: 'Inv Date', value: 'DocDate', sortable: true },
  { title: 'Description', value: 'Dscription', sortable: true },
  { title: 'Item Code', value: 'ItemCode', sortable: true },
  { title: 'Volume (Kg)', value:'total_weight', sortable: true },
  { title: 'Price', value: 'PriceBefDisc', sortable: true },
  { title: 'Total', value: 'TotalSales', sortable: true },
]


const computedHeaders = computed(() => {
  if (groupBy.value === 'ItemCode') {
    return headers.filter(header => header.value !== 'ItemCode')
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
  selectedRows.value = rows.map((row: ISalesInvoice) => ({ ...row }));
}

const handleRefresh = (stopLoading: () => void) => {
  salesInvoiceStore.fetchSalesInvoices().finally(() => {
    stopLoading()
  });
}

</script>

<template>
  <CustomerOverview :data="customer" />
  <SalesStatistic :id="router.params.customerId" :companyId="customer.companyId" />
  <VCol cols="12">
    <AppCardActions
      :loading="configStore.loading"
      action-refresh
      action-collapsed
      @refresh="handleRefresh"
      title="SALES INVOICES"
    >
      <VCardText class="d-flex flex-wrap gap-4">
        <VRow>
          <VCol cols="12" lg="12" md="12">
            <v-radio-group inline v-model="groupBy">
              <v-radio label="Invoice" value="DocNum" disabled></v-radio>
              <v-radio label="Item" value="ItemCode"></v-radio>
            </v-radio-group>
          </VCol>
        </VRow>
        <VSpacer />
        <div class="me-3 d-flex gap-3">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="startDate" label="Start Date" type="date" placeholder="Select Start Date"
                :max="endDate"></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="endDate" label="End Date" type="date" placeholder="Select End Date"
                :min="startDate"></v-text-field>
            </v-col>
          </v-row>
        </div>

        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <div style="inline-size: 12.625rem;">
            <AppTextField v-model="searchQuery" placeholder="Search ..." clearable clear-icon="tabler-x" />
          </div>

          <!-- 👉 Export button -->
          <!-- <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
            Export
          </VBtn> -->
        </div>
      </VCardText>

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
        v-model:on-update-options="updateOptions" 
        v-model:on-update-selected-rows="updateSelectedRows"
        :grouped="false" 
      />
    </AppCardActions>
  </VCol>
</template>
