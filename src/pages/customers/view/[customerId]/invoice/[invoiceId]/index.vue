<script lang="ts" setup>
import { useConfigStore } from '@/@core/stores/config'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'
import CustomerOverview from '@/views/pages/customer/CustomerOverview.vue'
import SalesInvoiceTable from '@/views/pages/customer/SalesInvoiceTable.vue'
import SalesStatistic from '@/views/pages/customer/SalesStatistic.vue'
import { title } from 'node:process'


const router = useRoute('customers-view-customerId-item-itemId' as any)
const groupBy = ref('DocNum')
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const page = ref(1)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const selectedRows = ref<ISalesInvoice[]>([])
const sortOptions = ref<SortItem[]>([{key: 'DocDate', order: 'desc'}])

const configStore = useConfigStore()
const { data: salesInvoices, execute:fetchSalesInvoices } = await useApi<any>(createUrl(`invoice`, {
  query: {
    id: router.params.customerId,
    invoiceId: router.params.invoiceId,
    per_page: itemsPerPage,
    page,
    sort_options: [[{ key: 'DocDate', order: 'desc' }]],
    start_date: startDate,
    end_date: endDate,
    // group_by: groupBy
  }
}))

const { data: customerData, execute: fetchCustomer } = await useApi<any>(`customer/${router.params.customerId}`)

const customer = computed(() => customerData.value.data)


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
    return headers.filter(header => header.value !== 'Dscription' && header.value !== 'ItemCode')
  }
  // return headers.filter(header => header.value !== 'DocNum')
  return headers.filter(header => header.value !== 'DocNum')

})

const salesInvoicesData = computed((): ISalesInvoice[] => {
  return salesInvoices.value.data.data
})

const totalSales = computed(() => salesInvoices.value.data.total)

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
  fetchSalesInvoices().finally(() => {
    stopLoading();
  });
}
</script>

<template>
  <CustomerOverview :data="customer" />
  <SalesStatistic :id="customer.CardCode" />
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
              <v-radio label="Invoice" value="DocNum"></v-radio>
              <v-radio label="Item" value="ItemCode" disabled></v-radio>
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
          <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
            Export
          </VBtn>
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
