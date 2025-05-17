<script setup lang="ts">
import { useConfigStore } from '@core/stores/config'
import type { ICustomerData, SortItem } from '@core/types'

// 👉 Store
const searchQuery = ref('')
const selectedSalesPerson = ref(useCookie<any>('userData')?.value?.sales_person?.SlpCode ?? null)
const selectedStatus = ref()
const debouncedQuery = ref('')
const deleteModal = ref(false)
const deleteId = ref('')
const selectedGroupName = ref()
let debounceTimeout: ReturnType<typeof setTimeout> | null = null


// Data table options
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([])
const selectedRows = ref<ICustomerData[]>([])
const configStore = useConfigStore()
const hideZeroInvoice = ref(false)

// Delayed search
watch(searchQuery, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
    console.log('Search:', debouncedQuery.value)
  }, 400) // delay 400ms
})

const isAdmin = () => {
  return configStore.isAdmin()
}
// Update data table options
// Multiple sort
const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
}

// Update selected rows
const updateSelectedRows = (rows: ICustomerData[]) => {
  selectedRows.value = rows.map((row: ICustomerData) => ({ ...row }));
}

// Headers
const headers = [
  { title: 'Actions', key: 'actions', sortable: false },
  { title: 'Customer', key: 'CardName'},
  { title: 'Group Name', key: 'GroupName' },
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' }, 
  { title: 'Phone', key: 'Phone' },
  { title: 'Number of Invoices', key: 'invoice_count' },
  { title: 'Payment Terms', key: 'PaymentTerms' },
  { title: 'Price List', key: 'PriceList' },
  // { title: 'Actions', key: 'actions', sortable: false },
]

// 👉 Fetching customers
const { data: customerData, execute: fetchCustomers } = await useApi<any>(createUrl('customer', {
  query: {
    search: debouncedQuery,
    status: selectedStatus,
    group_name: selectedGroupName,   
    sales_person_id: selectedSalesPerson,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions,
    hideZeroInvoice
  },
}))

const { data: salesPersonsData } = await useApi<any>(createUrl('sales', {
  query: {
    per_page: -1,
    page: 1
  }
}), {})

const {data: groupList} =  await useApi<any>(createUrl('customer/group-list'), {}) 

const groupNameOptions = computed(() => groupList.value.data.map((group: any) => ({
  value: group.GroupName,
  title: group.GroupName
})))

// Sales persons for filter
const salesPersons = computed(() => salesPersonsData.value.data.data.map((salesPerson: any) => ({
  value: salesPerson.SlpCode,
  title: salesPerson.SlpName
})))

const totalCustomer = computed(() => customerData.value.data.total)

const customers = computed((): ICustomerData[] => customerData.value.data.data)

console.log(customers.value)
// 👉 search filters
const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]

const showDeleteModal = (id: string) => {
  deleteModal.value = true
  deleteId.value = id
}


// Delete customer method
const deleteCustomer = async(id: string) => {
  await useApi<any>(createUrl(`customer/${id}`), {
    method: 'DELETE',
  })
  deleteModal.value = false

  // Remove deleted customer from selected rows
  const index = selectedRows.value.findIndex(row => row.CardCode === id)
  if (index !== -1)
    selectedRows.value.splice(index, 1)

  // Refetch customers
  fetchCustomers()
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>
      <VCardText>
        <VRow>
          <!-- 👉 Select Role -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedSalesPerson"
              placeholder="Select Sales Person"
              :items="salesPersons"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
           <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedGroupName"
              placeholder="Select Group Name"
              :items="groupNameOptions"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedStatus"
              placeholder="Select Status"
              :items="status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>          
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4">
        <div class="me-4 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="PAGINATION_ITEMS"
            style="inline-size: 6.25rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
          <VCheckbox
            label="Hide Zero Invoice"
            v-model="hideZeroInvoice"             
          />
        </div>
        <VSpacer />

        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <div style="inline-size: 15.625rem;">
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

      <!-- SECTION datatable -->
      <VDataTableServer
        :loading="configStore.loading"
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="customers"
        item-value="CardCode"
        :items-length="totalCustomer"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        return-object
        @update:options="updateOptions"
        @update:model-value="updateSelectedRows"
        multi-sort
      >
        <!-- User -->
        <template #item.actions="{ item }">
          <a :href="`${'view/' + item.CardCode }`">
            <VIcon small class="mr-1">tabler-eye</VIcon> 
            View
        </a>
        </template>
        <template #item.CardName="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.CardName }}
              </div>
            </div>
          </div>
        </template>
        <template #item.status="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            <VChip 
              :color="item.NonActive === 'Y' ? 'error' : 'success'"
              label
              size="small"
            >
            {{ item.NonActive === 'Y' ? 'Inactive' : 'Active' }}
            </VChip>
          </div>
        </template>
        <template #item.CntctPrsn="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.CntctPrsn }}
              </div>
            </div>
          </div>
        </template>
        <template #item.Address="{ item }">
          <div class="trim-text-wrapper">
            <div class="trim-text">
              {{ item.Address }}
            </div>
          </div>
        </template>
        <template #item.invoice_count="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            {{ item.invoice_count }}
          </div>
        </template>
        <!-- pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalCustomer"
          />
        </template>
      </VDataTableServer>
      <!-- SECTION -->
    </VCard>
    <VDialog v-model="deleteModal" max-width="300">
      <VCard>
        <VCardTitle> Delete Confirmation </VCardTitle>
        <VCardText> Are you sure you want to delete this customer? </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn @click="deleteModal = false"> Cancel </VBtn>
          <VBtn color="error" @click="deleteCustomer(deleteId)"> Delete </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>


<style scoped lang="scss">
.trim-text-wrapper {
  overflow: hidden;
  inline-size: 200px;
  max-inline-size: 200px;
  white-space: normal;

  .trim-text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
  }
}

</style>

