<script setup lang="ts">
import { useConfigStore } from '@/@core/stores/config'
import { useSalesInvoiceStore } from '@/@core/stores/salesinvoice'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'
import { computed, ref, watch } from 'vue'
import SalesInvoiceTable from './SalesInvoiceTable.vue'

interface Props { id: string }
const props = defineProps<Props>()

const salesInvoiceStore = useSalesInvoiceStore()
const configStore = useConfigStore()

// Query params
const page = ref(1)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const sortOptions = ref<SortItem[]>([{ key: 'DocDate', order: 'desc' }])
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const debouncedQuery = ref('')
const groupBy = ref('DocNum')
const selectedRows = ref<ISalesInvoice[]>([])

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

// Debounce search
watch(searchQuery, (val) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = val
    page.value = 1
  }, 400)
})

// Reset page to 1 on filter changes
watch([startDate, endDate, groupBy], () => {
  page.value = 1
})

// Single source of truth for fetch
const fetchSalesInvoices = async() => {
  salesInvoiceStore.updateQuery({
    id: props.id,
    page: page.value,
    per_page: itemsPerPage.value,
    sort_options: sortOptions.value,
    start_date: startDate.value,
    end_date: endDate.value,
    search: debouncedQuery.value,
    group_by: groupBy.value
  })
  salesInvoiceStore.fetchSalesInvoices()
}

// Watch all params that affect the API
watch(
  [sortOptions, startDate, endDate, debouncedQuery, page, itemsPerPage, groupBy],
  fetchSalesInvoices,
  { deep: true, immediate: true } // immediate = fetch on mount
)

// Computed
const salesInvoicesData = computed(() => salesInvoiceStore.salesInvoices)
const totalSales = computed(() => salesInvoiceStore.salesInvoices.total)
const headers = [
  { title: 'Invoice', value: 'DocNum' },
  { title: 'Inv Date', value: 'DocDate' },
  { title: 'Description', value: 'Dscription' },
  { title: 'Item Code', value: 'ItemCode' },
  { title: 'Volume (Kg)', value: 'total_weight' },
  { title: 'Price', value: 'PriceBefDisc' },
  { title: 'Discount Line', value: 'DiscLine' },
  { title: 'Discount Total', value: 'DiscTotal' },
  { title: 'Total', value: 'TotalSales' },
]
const computedHeaders = computed(() =>
  groupBy.value === 'ItemCode' ? headers.filter(h => h.value !== 'ItemCode') : headers.filter(h => h.value !== 'DocNum')
)

// Handlers
const updateOptions = (options: any) => {
  const newSortOptions = options.sortBy.length > 0 ? [options.sortBy] : [{ key: 'DocDate', order: 'desc' }]
  if (JSON.stringify(sortOptions.value) !== JSON.stringify(newSortOptions)) {
    sortOptions.value = newSortOptions
  }
}
const updateSelectedRows = (rows: ISalesInvoice[]) => {
  selectedRows.value = rows.map(r => ({ ...r }))
}
const handleRefresh = (stopLoading: () => void) => {
  fetchSalesInvoices()
  .finally(() => stopLoading())
}
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
        <div class="me-4 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="PAGINATION_ITEMS"
            style="inline-size: 6.25rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
          
        </div>
        <VSpacer />

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
        :customer-id="props.id"
        :loading="configStore.loading"
        :headers="computedHeaders"
        :items-length="totalSales"
        :group-by="groupBy"
        :item-value="groupBy === 'DocNum' ? 'DocNum_ItemCode' : 'ItemCode_DocNum'"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        v-model:selected-rows="selectedRows"
        :onUpdateOptions="updateOptions"
        :on-update-selected-rows="updateSelectedRows"
        :grouped="true"
      />
    </AppCardActions>
  </VCol>
</template>
