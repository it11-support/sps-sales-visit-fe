<script setup lang="ts">
import { Filters, useCustomerStore } from '@/@core/stores/customer'
import { useSalesPersonStore } from '@/@core/stores/sales-person'
import { ISalesPerson } from '@/@core/typedefs'

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
const isSpv = computed(() => user.value.role.role === 'spv')
const showFilter = ref(false)
const loadingSalesPerson = ref(true)
const loadingGroupName = ref(true)
const loadingPaymentOptions = ref(true)
const loadingPriceListOptions = ref(true)
const loadingCityOptions = ref(true)

const filters = ref<Partial<Filters>>({
  sales_person_id: [],
  group_name: null,
  payment_term: null,
  city: null
})

watch(debouncedQuery, (val) => {
  customerStore.updateFilters({ search: val })
})

// Headers
const headers = [
  { title: 'Actions', key: 'actions', sortable: false },
  { title: 'Company', key: 'CompanyId' },
  { title: 'Customer', key: 'CardName' },
  { title: 'Sales Person', key: 'SlpName' },
  { title: 'Group Name', key: 'GroupName' },
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' },
  { title: 'Phone', key: 'Phone1' },
  { title: 'Total Sales', key: 'total_sales' },
  { title: 'Last Invoice Date', key: 'last_transaction_date' },
  { title: 'Number of Invoices', key: 'invoice_count' },
  { title: 'Payment Term', key: 'PaymentTerm' },
  { title: 'Price List', key: 'PriceList' },
  // { title: 'Actions', key: 'actions', sortable: false },
]

customerStore.$reset()
salesStore.$reset()

onMounted(async() => {
  if(isAdmin.value) {
    await customerStore.initialize()
  } else if(isSpv.value) {
    await customerStore.initialize(undefined, user.value.team_id)
  } else {
    const ids = user.value.sales_person
      .filter((sp: ISalesPerson) => selectedCompanies.value.includes(sp.CompanyId))
      .map((sp: ISalesPerson) => sp.SlpCode)

    await customerStore.initialize(ids)
  }
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

const updateSelected = (val: string) => {
  const selectedCompanies = customerStore.filters.companyIds ?? []

  let newValue: string[]

  if (selectedCompanies.includes(val)) {
    // hapus val
    newValue = selectedCompanies.filter(item => item !== val)
  } else {
    // tambah val
    newValue = [...selectedCompanies, val]
  }

  customerStore.updateFilters({ companyIds: newValue })
}

const selectedCompanies = computed<string[]>({
  get() {
    return customerStore.filters.companyIds ?? []
  },
  set(val) {
    const current = customerStore.filters.companyIds ?? []
    if (JSON.stringify(current) === JSON.stringify(val)) return
    customerStore.updateFilters({ companyIds: val.length ? val : undefined })
  }
})

watch(
  filters,
  (newVal) => {
    const isNotAdmin = !isAdmin.value && !isSpv.value
    const finalSalesPersonIds = isNotAdmin
      ? user.value.sales_person
          .filter((sp: ISalesPerson) =>
            selectedCompanies.value.includes(sp.CompanyId)
          )
          .map((sp: ISalesPerson) => Number(sp.SlpCode))
      : Array.isArray(newVal.sales_person_id)
        ? newVal.sales_person_id.map(Number)
        : newVal.sales_person_id
          ? [Number(newVal.sales_person_id)]
          : []
    
    customerStore.updateFilters({
      ...newVal,
      sales_person_id: finalSalesPersonIds,
    })
  },
  { deep: true, immediate: true }
)
watch(selectedCompanies, 
  (val, val1) => {
    if(val.length !== val1.length) {
      filters.value = {
        ...filters.value,
        sales_person_id: [],
        group_name: null,
        payment_term: null,
        city: null
      }
    }
  },
  { deep: true }
)
</script>

<template>
  <section>
    <VBreadcrumbs
      class="px-0 pb-2 pt-0 help-center-breadcrumbs"
      :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Customers', to: { name: 'customers-list' }}]"
      >
      <template v-slot:prepend>
        <v-icon icon='tabler-home' size="small"></v-icon>
      </template>
    </VBreadcrumbs>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VRow class="d-flex align-center">
          <VCol cols="12" class="d-flex flex-wrap align-center">
            <!-- Show Filters -->
            <VCheckbox 
              v-model="showFilter" 
              label="Show Filters"
              hide-details
              class="mr-6"             
            />
            <!-- Company -->
            <label class="mr-4 pl-4">Company: </label>
            <div class="d-flex flex-wrap">
              <VCheckbox
                v-model="selectedCompanies"
                :label="COMPANIES.SPS"
                :value="COMPANIES.SPS"
                hide-details          
                class="mr-4"                
              />
              <VCheckbox
                v-model="selectedCompanies"
                :label="COMPANIES.BBS"
                :value="COMPANIES.BBS"
                hide-details               
              />
            </div>
          </VCol>
        </VRow>
      </VCardItem>
      <VCardText v-if="showFilter">
        <VRow>
          <!-- 👉 Select Role -->
          <VCol cols="12" sm="4" v-if="isAdmin || isSpv">
            <AppCombobox 
              v-model="filters.sales_person_id"          
              placeholder="Filter by sales person" 
              :items="salesStore.salesPersonOptions.filter(item => item.user !== null).filter(item => selectedCompanies.includes(item.type))"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingSalesPerson"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppCombobox 
              v-model="filters.group_name"
              placeholder="Filter by group name" 
              :items="customerStore.groupNameOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingGroupName"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
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
            <AppCombobox
              v-model="filters.payment_term"
              placeholder="Filter by Payment Term"
              :items="customerStore.paymentTermOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingPaymentOptions"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
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
            <AppCombobox
              v-model="filters.city"
              placeholder="Filter by City / Area"
              :items="customerStore.cityOptions" 
              clearable 
              clear-icon="tabler-x" 
              :loading="loadingCityOptions"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
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
          <a :href="`${'view/' + item.id}`">
            <VIcon small class="mr-1">tabler-eye</VIcon>
            View
          </a>
        </template>
        <template #item.CompanyId="{ item }">
          <div class="d-flex align-center gap-x-4">
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.CompanyId }}
              </div>
            </div>
          </div>
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
