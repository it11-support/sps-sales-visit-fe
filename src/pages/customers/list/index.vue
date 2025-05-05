<script setup lang="ts">
import { useConfigStore } from '@/@core/stores/config'
import type { CustomerData, SortItem } from '@core/types'

// 👉 Store
const searchQuery = ref('')
const selectedSalesPerson = ref()
const selectedPlan = ref()
const selectedStatus = ref()
const debouncedQuery = ref('')
let debounceTimeout: ReturnType<typeof setTimeout> | null = null


// Data table options
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([])
const selectedRows = ref<CustomerData[]>([])
const configStore = useConfigStore()


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
const updateSelectedRows = (rows: CustomerData[]) => {
  selectedRows.value = rows.map((row: CustomerData) => ({ ...row }));
}

// Headers
const headers = [
  { title: 'Customer', key: 'CardName'},
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Address', key: 'Address', width: '50px' }, 
  { title: 'Phone 1', key: 'Phone1' },
  { title: 'Phone 2', key: 'Phone2' },
  { title: 'Fax', key: 'Fax' },
  { title: 'Email', key: 'E_Mail' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// 👉 Fetching users
const { data: customerData, execute: fetchCustomers } = await useApi<any>(createUrl('customer', {
  query: {
    search: debouncedQuery,
    status: selectedStatus,
    plan: selectedPlan,
    sales_person_id: selectedSalesPerson,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions
  },
}))

const { data: salesPersonsData } = await useApi<any>(createUrl('sales'), {})

const salesPersons = computed(() => salesPersonsData.value.data.map((salesPerson: any) => ({
  value: salesPerson.SlpCode,
  title: salesPerson.SlpName
})))


const totalCustomer = computed(() => customerData.value.data.total)

const customers = computed((): CustomerData[] => customerData.value.data.data)


// 👉 search filters
const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]

// const isAddNewUserDrawerVisible = ref(false)

// 👉 Add new user
// const addNewUser = async (userData: UserProperties) => {
//   await $api('/apps/users', {
//     method: 'POST',
//     body: userData,
//   })

//   // Refetch User
//   fetchUsers()
// }



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
          <!-- 👉 Select Status -->
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
        <div class="me-3 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 6.25rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
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

          <!-- 👉 Add user button -->
          <!-- <VBtn
            prepend-icon="tabler-plus"
            @click="isAddNewUserDrawerVisible = true"
          >
            Add New User
          </VBtn> -->
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
        <template #item.CardName="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.CardName }}
              </div>
            </div>
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
        <template #item.E_Mail="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
                <a v-if="item.E_Mail" :href="`mailto:${item.E_Mail}`">
                  {{ item.E_Mail }}
                </a>
            </div>
          </div>
        </template>


        <!-- 👉 Role -->
        <!-- <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VIcon
              :size="22"
              :icon="resolveUserRoleVariant(item.role).icon"
              :color="resolveUserRoleVariant(item.role).color"
            />

            <div class="text-capitalize text-high-emphasis text-body-1">
              {{ item.role }}
            </div>
          </div>
        </template> -->

        <!-- Plan -->
        <!-- <template #item.plan="{ item }">
          <div class="text-body-1 text-high-emphasis text-capitalize">
            {{ item.currentPlan }}
          </div>
        </template> -->

        <!-- Status -->
        <!-- <template #item.status="{ item }">
          <VChip
            :color="resolveUserStatusVariant(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template> -->

        <!-- Actions -->
        <template #item.actions="{ item }">
          <VBtn           
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem :to="{ name: 'customers-view-id', params: { id: item.CardCode } }">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>

                  <VListItemTitle>View</VListItemTitle>
                </VListItem>
                <div v-if="isAdmin()">
                  <VListItem link >
                    <template #prepend>
                      <VIcon icon="tabler-pencil" />
                    </template>
                    <VListItemTitle>Edit</VListItemTitle>
                  </VListItem>

                  <VListItem @click="">
                    <template #prepend>
                      <VIcon icon="tabler-trash" />
                    </template>
                    <VListItemTitle>Delete</VListItemTitle>
                  </VListItem>
              </div>
              </VList>
            </VMenu>
          </VBtn>
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
    <!-- 👉 Add New User -->
    <!-- <AddNewUserDrawer
      v-model:is-drawer-open="isAddNewUserDrawerVisible"
      @user-data="addNewUser"
    /> -->
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

