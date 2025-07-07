<script setup lang="ts">
import { useCustomerStore } from '@/@core/stores/customer'
import { useSalesPersonStore } from '@/@core/stores/sales-person'

const customerStore = useCustomerStore()
const salesStore = useSalesPersonStore()
// 👉 Store
const searchQuery = ref('')
// const debouncedQuery = ref('')
const deleteModal = ref(false)
const deleteId = ref('')

const debouncedQuery = useDebounce(searchQuery, 400)

// Data table options
const selectedRows = customerStore.selectedRows
const filterDormantCustomer = ref(false)
// Delayed search
const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')
const isCoordinator = computed(() => user.value.role.role === 'coordinator')
const showFilter = ref(false)
const loadingSalesPerson = ref(true)
const loadingGroupName = ref(true)
const loadingPaymentOptions = ref(true)
const loadingPriceListOptions = ref(true)
const loadingCityOptions = ref(true)

watch(debouncedQuery, (val) => {
  customerStore.updateFilters({ search: val })
})

// Headers
const headers = [
  { title: 'Actions', key: 'actions', sortable: false },
  { title: 'Customer', key: 'CardName' },
  { title: 'Sales Person', key: 'SlpName' },
  { title: 'Group Name', key: 'GroupName' },
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' },
  { title: 'Phone', key: 'Phone' },
  { title: 'Total Sales', key: 'total_sales' },
  { title: 'Last Invoice Date', key: 'last_transaction_date' },
  { title: 'Number of Invoices', key: 'invoice_count' },
  { title: 'Payment Term', key: 'PaymentTerm' },
  { title: 'Price List', key: 'PriceList' },
  // { title: 'Actions', key: 'actions', sortable: false },
]


onMounted(() => {
  if(!isAdmin.value || !isCoordinator.value) {
    customerStore.updateFilters({sales_person_id: user.value.sales_person_id})
  }
  customerStore.fetchCustomers()  
  salesStore.updateQuery({ per_page: -1, page: 1 })
})

watch(showFilter, (newVal) => {
  if(newVal){
    salesStore.fetchSalesPersons()
    customerStore.fetchFilters()
  }
})

watch([salesStore, customerStore], ([sales, customer]) => {
  if(sales.salesPersonOptions.length > 0) loadingSalesPerson.value = false
  if(customer.groupNameOptions.length > 0) loadingGroupName.value = false
  if(customerStore.paymentTermOptions.length > 0) loadingPaymentOptions.value = false
  if(customerStore.priceListOptions.length > 0) loadingPriceListOptions.value = false
  if(customerStore.cityOptions.length > 0) loadingCityOptions.value = false
})
// 👉 search filters
const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]


// Last transaction
const dormantOptions = [
  { title: 'More than 1 month', value: 1 },
  { title: 'More than 2 months', value: 2 },
  { title: 'More than 3 months', value: 3 },
  { title: 'More than 6 months', value: 6 },
  { title: 'More than 12 months', value: 12 },
]

// Delete customer method
const deleteCustomer = async (id: string) => {
  await useApi<any>(createUrl(`customer/${id}`), {
    method: 'DELETE',
  })
  deleteModal.value = false

  // Remove deleted customer from selected rows
  const index = selectedRows.findIndex(row => row.CardCode === id)
  if (index !== -1) selectedRows.splice(index, 1)
  // Refetch customers
  customerStore.fetchCustomers()
}

</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCheckbox v-model="showFilter" label="Show Filters"></VCheckbox>
      </VCardItem>
      <VCardText v-if="showFilter">
        <VRow>
          <!-- 👉 Select Role -->
          <VCol cols="12" sm="4" v-if="isAdmin || isCoordinator">
            <AppSelect 
              v-model="customerStore.filters.sales_person_id"
              @update:model-value="customerStore.updateFilters({ sales_person_id: $event })"
              placeholder="Filter by sales person" 
              :items="salesStore.salesPersonOptions.filter(item => item.user !== null)"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingSalesPerson"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppSelect 
              v-model="customerStore.filters.group_name"
              @update:model-value="customerStore.updateFilters({ group_name: $event })"
              placeholder="Filter by group name"
              :items="customerStore.groupNameOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingGroupName"
            />
          </VCol>

          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="customerStore.filters.status"
              @update:model-value="customerStore.updateFilters({ status: $event })" 
              placeholder="Filter by status"
              :items="status" 
              clearable 
              clear-icon="tabler-x" 
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="customerStore.filters.payment_term"
              @update:model-value="customerStore.updateFilters({ payment_term: $event })"
              placeholder="Filter by Payment Term"
              :items="customerStore.paymentTermOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingPaymentOptions"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="customerStore.filters.price_list"
              @update:model-value="customerStore.updateFilters({ price_list: $event })"
              placeholder="Filter by Price List" 
              :items="customerStore.priceListOptions" 
              clearable 
              clear-icon="tabler-x" 
              :loading="loadingPriceListOptions"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="customerStore.filters.city"
              @update:model-value="customerStore.updateFilters({ city: $event })"
              placeholder="Filter by City / Area"
              :items="customerStore.cityOptions" 
              clearable 
              clear-icon="tabler-x" 
              :loading="loadingCityOptions"
            />
          </VCol>
        </VRow>
        <VRow class="d-flex justify-start">
          <VCol cols="12" sm="12">
            <VRow class="d-flex justify-start">
              <VCol cols="12" lg="2" sm="12">
                <VCheckbox v-model="filterDormantCustomer" label="Dormant Customer" @update:model-value="customerStore.updateFilters({
                  dormantMonth: filterDormantCustomer && customerStore.filters.dormantMonth
                    ? customerStore.filters.dormantMonth
                    : undefined
                })" />
              </VCol>
              <VCol v-if="filterDormantCustomer" cols="12" lg="3" sm="12">
                <AppSelect :items="dormantOptions" v-model="customerStore.filters.dormantMonth"
                  @update:model-value="customerStore.updateFilters({ dormantMonth: $event })"
                  placeholder="Filter by last transaction" clearable clear-icon="tabler-x" />
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex flex-wrap gap-4">
        <!-- Wrapper untuk AppSelect dan Checkbox -->
        <div class="d-flex gap-3 flex-column flex-sm-row me-4">
          <AppSelect
            :model-value="customerStore.filters.per_page"
            :items="PAGINATION_ITEMS"
            style="inline-size: 6.25rem;"
            @update:model-value="customerStore.setPerpage(parseInt($event, 10))"
          />
          <VCheckbox
            label="Hide Zero Invoice"
            v-model="customerStore.filters.hideZeroInvoice"
            @update:model-value="customerStore.updateFilters({ hideZeroInvoice: $event as boolean })"
          />
        </div>

        <VSpacer />

        <!-- Search field -->
        <div class="app-user-search-filter d-flex align-center gap-4 flex-column flex-sm-row">
          <div style="inline-size: 15.625rem;">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search ..."
              clearable
              clear-icon="tabler-x"
            />
          </div>
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        :loading="customerStore.loadingList"
        v-model:items-per-page="customerStore.filters.per_page"
        v-model:model-value="customerStore.selectedRows"
        v-model:page="customerStore.filters.page"
        :items="customerStore.customers"
        item-value="CardCode"
        :items-length="customerStore.pagination.total"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        return-object
        @update:options="customerStore.updateSortOptions"
        @update:model-value="customerStore.setSelectedRows"
        multi-sort
      >
        <template #item.actions="{ item }">
          <a :href="`${'view/' + item.CardCode}`">
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
        <template #item.SlpName="{ item }">
          <div class="d-flex align-center gap-x-4">
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.sales_person?.SlpName }}
              </div>
            </div>
          </div>
        </template>
        <template #item.status="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            <VChip :color="item.NonActive === 'Y' ? 'error' : 'success'" label size="small">
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
            {{ item.invoice_count ?? '-' }}
          </div>
        </template>
        <template #item.total_sales="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            {{ item.total_sales ? formatMoney(item.total_sales) : '' }}
          </div>
        </template>
        <template #item.last_transaction_date="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            {{ item.last_transaction_date ? formatDate(item.last_transaction_date) : '' }}
          </div>
        </template>
        <!-- pagination -->
        <!-- <template #bottom>
          <TablePagination v-model:page="customerStore.pagination.current_page"
            v-model:items-per-page="customerStore.pagination.per_page"
            v-model:total-items="customerStore.pagination.total" @update:page="customerStore.setPage($event)" />
        </template> -->
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
