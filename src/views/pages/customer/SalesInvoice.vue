
<script setup lang="ts">
import { useConfigStore } from '@/@core/stores/config'
import { ISalesInvoice } from '@/@core/typedefs/salesinvoice'
import { SortItem } from '@/@core/types'

const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const debouncedQuery = ref('')
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([])
const groupBy = ref('DocNum')

let debounceTimeout: ReturnType<typeof setTimeout> | null = null
const configStore = useConfigStore()
const selectedRows = ref<ISalesInvoice[]>([])

interface Props {
  id: string
}
const props = defineProps<Props>()

const headers = [
  { title: 'Invoice', value: 'DocNum', sortable: true },
  { title: 'Inv Date', value: 'DocDate' , sortable: true },
  { title: 'Description', value: 'Dscription', sortable: true },
  { title: 'Item Code', value: 'ItemCode' , sortable: true },
  { title: 'Qty (Kg)', value: 'QtyKg', sortable: true },
  { title: 'Unit', value: 'unitMsr', sortable: true },
  { title: 'Price', value: 'PriceBefDisc', sortable: true },
  { title: 'Total', value: 'TotalSales' },
]

const { data: salesInvoices } = await useApi<any>(createUrl(`invoice`, {
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
  console.log(JSON.stringify(options.sortBy))
  console.log(JSON.stringify(sortOptions.value))
  if(JSON.stringify(options.sortBy) !== JSON.stringify(sortOptions.value)) {
    sortOptions.value = [options.sortBy]
  } else {
    sortOptions.value = [{"key": "DocDate", "order": "desc"}]
  }
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
  if(groupBy.value === 'ItemCode') {
    return headers.filter(header => header.value !== 'Dscription' && header.value !== 'ItemCode')
  }
  // return headers.filter(header => header.value !== 'DocNum')
  return headers.filter(header => header.value !== 'DocNum')
  
})
</script>

<template>
  <VCol
      cols="12"
    >
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle class="text-lg text-disabled">SALES INVOICES</VCardTitle>
      </VCardItem>     
      <VCardText class="d-flex flex-wrap gap-4"> 
        <VRow>
          <VCol
            cols="12"
            lg="12"
            md="12"
          >
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
              <v-text-field
                v-model="startDate"
                label="Start Date"
                type="date"
                placeholder="Select Start Date"
                :max = "endDate"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="endDate"
                label="End Date"
                type="date"
                placeholder="Select End Date"
                :min="startDate"
              ></v-text-field>
            </v-col>
          </v-row>
        </div>
       
        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">         
          <!-- 👉 Search  -->
          <div style="inline-size: 12.625rem;">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search ..."
              clearable
              clear-icon="tabler-x"
            />
          </div>

          <!-- 👉 Export button -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn>
        </div>
      </VCardText>

      <VDivider />
      <VDataTableServer
        :items="salesInvoicesData"
        :items-length="totalSales"
        :headers="computedHeaders"
        :loading="configStore.loading"
        :item-value="groupBy === 'DocNum' ? 'DocNum_ItemCode' : 'ItemCode_DocNum'"
        :group-by="[groupBy === 'DocNum' ? { key: 'DocNum' } : { key: 'Dscription' }]"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        return-object
        class="text-no-wrap"
        :select-strategy="'all'"
        multi-sort
        @update:options="updateOptions"
        @update:model-value="updateSelectedRows"
      >
        <template #group-header="{ item, isGroupOpen, toggleGroup }">
          <tr @click="toggleGroup(item)" style="cursor: pointer;" class="v-data-table__tr">
            <td colspan="1" class="font-weight-bold text-primary">
              <VIcon :icon="isGroupOpen(item) ? 'tabler-chevron-down' : 'tabler-chevron-right'" /> 
              {{ item.value }} ({{ item.items.length }})
            </td>
            <td v-if="groupBy === 'ItemCode'" :colspan="1"  class="text-left">
             {{  }}
            </td>
            <td :colspan="groupBy === 'DocNum' ? 6 : 4"  class="text-left">
              {{ formatDate(item.items[0].value.DocDate, { day: '2-digit', month: 'short', year: 'numeric'})  }}
            </td>
            <td class="text-left font-weight-bold text-primary">
              {{ calculateTotalSales(item.items) }}
            </td>
          </tr>

          <!-- Add Total Sales row below group -->
        
        </template>
  
        <template #item.ItemCode="{ item }">
          <a :href="`${props.id}/item/${item.ItemCode}`">{{ item.ItemCode }}</a>
        </template>
        <template #item.DocNum="{ item }">
          <a :href="`${props.id}/invoice/${item.DocNum}`">{{ item.DocNum }}</a>
        </template>
        <template #item.DocDate="{ item }">
          {{ formatDate(item.DocDate, { day: '2-digit', month: 'short', year: 'numeric'})  }}
        </template>
        <template #item.QtyKg="{ item }">
          {{ Number(item.QtyKg).toFixed(2) }}
        </template>
        <template #item.PriceBefDisc="{ item }">
          {{ formatMoney(item.PriceBefDisc) }}
        </template>
        <template #item.TotalSales="{ item }">
          {{ formatMoney(item.TotalSales) }}
        </template>
      </VDataTableServer>
    </VCard>
  </VCol>
</template>
