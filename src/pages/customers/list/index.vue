<script setup lang="ts">
import { useSalesPersonStore } from '@/@core/stores/sales-person'
import { ISalesPerson } from '@/@core/typedefs'

const salesStore = useSalesPersonStore()
// 👉 Store
const searchQuery = ref('')
// const debouncedQuery = ref('')
const deleteModal = ref(false)
const deleteId = ref('')

const debouncedQuery = useDebounce(searchQuery, 400)

// Data table options

const filterDormantCustomer = ref(false)
// Delayed search
const user = useCookie<any>('userData')
const isAdmin = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'admin'
  } else {
    return false
  }
})
const isSpv = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'spv'
  } else {
    return false
  }
})
const showFilter = ref(false)
const loadingSalesPerson = ref(true)
const loadingGroupName = ref(true)
const loadingPaymentOptions = ref(true)
const loadingPriceListOptions = ref(true)
const loadingCityOptions = ref(true)

const {
  filters,
  updateFilters,
  customers,
  isReady,
  pagination,
  loadingList,
  groupNameOptions,
  paymentTermOptions,
  priceListOptions,
  cityOptions,
  mutateCustomers,
  loadingFilters,
  selectedRows,
   setSelectedRows
} = useCustomers()

watch(debouncedQuery, (val) => {
  updateFilters({ search: val, page: 1 })
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

// customerStore.$reset()
salesStore.$reset()

onMounted(() => {
  const ids = !isAdmin.value
    ? user.value.sales_person
        .filter((sp: ISalesPerson) =>
          selectedCompanies.value.includes(sp.CompanyId),
        )
        .map((sp: ISalesPerson) => sp.id)
    : []

  updateFilters({
    sales_person_id: isAdmin.value ? [] : ids,
    team_id: isSpv.value
      ? user.value.team_id
      : undefined,
  })

  isReady.value = true

  salesStore.updateQuery({
    per_page: -1,
    page: 1,
  })
})

watch(showFilter, (newVal) => {
  if(newVal){
    salesStore.fetchSalesPersons()
    mutateCustomers()
  }
})

watch([salesStore], ([sales]) => {
  if(sales.salesPersonOptions.length > 0) loadingSalesPerson.value = false
  if(groupNameOptions.value.length > 0) loadingGroupName.value = false
  if(paymentTermOptions.value.length > 0) loadingPaymentOptions.value = false
  if(priceListOptions.value.length > 0) loadingPriceListOptions.value = false
  if(cityOptions.value.length > 0) loadingCityOptions.value = false
})
// 👉 search filters
const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]

const filteredSalesPersonOptions = computed(() => {
  const seen = new Set<number>();
  return salesStore.salesPersonOptions
    .filter(item => item.user.length > 0)
    .filter(item => selectedCompanies.value.includes(item.type))
    .filter(item => {
      if (seen.has(Number(item.value))) return false;
      seen.add(Number(item.value));
      return true;
    });
});



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
 selectedRows.value = selectedRows.value.filter(
  row => row.CardCode !== id,
)
  // Refetch customers
  mutateCustomers()
}

const selectedCompanies = computed<string[]>({
  get() {
    return filters.companyIds ?? []
  },
  set(val) {
    const current = filters.companyIds ?? []
    if (JSON.stringify(current) === JSON.stringify(val)) return
    updateFilters({ companyIds: val.length ? val : undefined, page: 1 })
  }
})

watch(
  [
    filters,
    selectedCompanies,
  ],
  () => {
    const isNotAdmin =
      !isAdmin.value && !isSpv.value

    if (!isNotAdmin)
      return

    const finalSalesPersonIds =
      user.value.sales_person
        .filter((sp: ISalesPerson) =>
          selectedCompanies.value.includes(
            sp.CompanyId,
          ),
        )
        .map((sp: ISalesPerson) =>
          Number(sp.id),
        )

    // guard biar tidak update terus
    const currentIds =
      filters.sales_person_id.map(Number)

    const isSame =
      JSON.stringify(currentIds)
      === JSON.stringify(finalSalesPersonIds)

    if (isSame)
      return

    filters.sales_person_id =
      finalSalesPersonIds
  },
  {
    deep: true,
    immediate: true,
  },
)
watch(selectedCompanies, 
  (val, val1) => {
    if (val.length !== val1.length) {
      Object.assign(filters, {
        ...filters,
        sales_person_id: [],
        group_name: null,
        payment_term: null,
        city: null
      })
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
              multiple
              v-model="filters.sales_person_id"          
              placeholder="Filter by sales person" 
              :items="filteredSalesPersonOptions"
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
              :items="groupNameOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingFilters"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
          </VCol>

          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="filters.status"
              @update:model-value="updateFilters({ status: $event })" 
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
              :items="paymentTermOptions"
              clearable
              clear-icon="tabler-x" 
              :loading="loadingFilters"
              :return-object="false"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppSelect
              v-model="filters.price_list"
              @update:model-value="updateFilters({ price_list: $event })"
              placeholder="Filter by Price List" 
              :items="priceListOptions" 
              clearable 
              clear-icon="tabler-x" 
              :loading="loadingFilters"
            />
          </VCol>
          <VCol cols="12" md="4" sm="4">
            <AppCombobox
              v-model="filters.city"
              placeholder="Filter by City / Area"
              :items="cityOptions" 
              clearable 
              clear-icon="tabler-x" 
              :loading="loadingFilters"
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
                <VCheckbox v-model="filterDormantCustomer" label="Dormant Customer" @update:model-value="updateFilters({
                  dormantMonth: filterDormantCustomer && filters.dormantMonth
                    ? filters.dormantMonth
                    : undefined
                })" />
              </VCol>
              <VCol v-if="filterDormantCustomer" cols="12" lg="3" sm="12">
                <AppSelect :items="dormantOptions" v-model="filters.dormantMonth"
                  @update:model-value="updateFilters({ dormantMonth: $event })"
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
            :model-value="filters.per_page"
            :items="PAGINATION_ITEMS"
            style="inline-size: 6.25rem;"
            @update:model-value="updateFilters({per_page:parseInt($event, 10)})"
          />
          <VCheckbox
            label="Hide Zero Invoice"
            v-model="filters.hideZeroInvoice"
            @update:model-value="updateFilters({ hideZeroInvoice: $event as boolean })"
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
        :loading="loadingList"
        v-model:items-per-page="filters.per_page"
         v-model:page="filters.page"
        v-model:model-value="selectedRows"        
        :items="customers"
        item-value="CardCode"
        :items-length="pagination.total"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
        return-object
        @update:options="updateFilters({ sort_options: $event.sortBy })"
        @update:model-value="setSelectedRows"
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
                {{ item.SlpName }}
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
