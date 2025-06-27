<script setup lang="ts">
import { useConfigStore } from '@/@core/stores/config'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'
import SalesInvoiceTable from './SalesInvoiceTable.vue'

const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const debouncedQuery = ref('')
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([{key: 'DocDate', order: 'desc'}])
const groupBy = ref('DocNum')

let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const configStore = useConfigStore()
const selectedRows = ref<ISalesInvoice[]>([])
const collapsed = ref(false)

interface Props {
  id: string
}
const props = defineProps<Props>()

const headers = [
  { title: 'Invoice', value: 'DocNum', sortable: true },
  { title: 'Inv Date', value: 'DocDate', sortable: true },
  { title: 'Description', value: 'Dscription', sortable: true },
  { title: 'Item Code', value: 'ItemCode', sortable: true },
  { title: 'Volume (Kg)', value:'total_weight', sortable: true },
  { title: 'Price', value: 'PriceBefDisc', sortable: true },
  { title: 'Total', value: 'TotalSales', sortable: true },
]

const { data: salesInvoices, execute: fetchSalesInvoices } = await useApi<any>(createUrl(`invoice`, {
  query: {
    id: props.id,
    search: debouncedQuery,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions,
    start_date: startDate,
    end_date: endDate,
    group_by: groupBy
  }
}))

// Delayed search
watch(searchQuery, (newVal) => {
  if (debounceTimeout && searchQuery) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
    console.log('Search:', debouncedQuery.value)
  }, 400) // delay 400ms
})

const salesInvoicesData = computed((): ISalesInvoice[] => {
  return salesInvoices.value.data.data
})

const updateOptions = (options: any) => {
  if(options.sortBy.length < 1) {
     sortOptions.value = [{ "key": "DocDate", "order": "desc" }]
  
  } else {
    sortOptions.value = [options.sortBy]
  }
}

const handleRefresh = (stopLoading: () => void) => {
  fetchSalesInvoices().finally(() => {
    stopLoading();
  });
}

const updateSelectedRows = (rows: ISalesInvoice[]) => {
  selectedRows.value = rows.map((row: ISalesInvoice) => ({ ...row }));
}

const calculateTotalSales = (items: any): string => {
  const totalSales = items.reduce((sum: number, item: any) => sum + parseFloat(item.value.TotalSales), 0);
  return formatMoney(totalSales)
}

const totalSales = computed(() => salesInvoices.value.data.total)

const computedHeaders = computed(() => {
  if (groupBy.value === 'ItemCode') {
    return headers.filter(header => header.value !== 'ItemCode')
  }
  // return headers.filter(header => header.value !== 'DocNum')
  return headers.filter(header => header.value !== 'DocNum')
})

</script>

<template>
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
        :customer-id="id"
        :loading="configStore.loading"
        :headers="computedHeaders"
        :items-length="totalSales" 
        :group-by="groupBy" 
        :item-value="groupBy === 'DocNum' ? 'DocNum_ItemCode' : 'ItemCode_DocNum'" 
        v-model:page="page"
        v-model:items-per-page="itemsPerPage" 
        v-model:selected-rows="selectedRows" 
        :on-update-options="updateOptions"
        :on-update-selected-rows="updateSelectedRows" 
        :grouped="true" 
      />
    </AppCardActions>
   
  </VCol>
</template>
