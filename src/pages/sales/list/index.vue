<script setup lang="ts">
import { handleUserBinding } from '@/utils/user/binding'
import { useConfigStore } from '@core/stores/config'
import { ISalesPerson, IUser } from '@core/typedefs'
import { SortItem } from '@core/types'


const searchQuery = ref('')
const debouncedQuery = ref('')
let debouncedQueryTimeout: ReturnType<typeof setTimeout> | null = null

// Data table options
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([])
const selectedRows = ref<ISalesPerson[]>([])
const selectedItem = ref<ISalesPerson | null>()
const selectedUser = ref<IUser | null>()
const salesPersonModal = ref<{type : 'link' | 'unlink', show: boolean}>({
  type : 'link',
  show: false
})

const usersOptions = ref([])
const configStore = useConfigStore()

// Headers
const headers = [
  { title: 'Sales Person', key: 'SlpName', width: '50px' },
  { title: 'Actions', key: 'action', width: '50px', sortable: false },
]

// Update sort options
const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
}

watch(searchQuery, (newVal) => {
  if (debouncedQueryTimeout) clearTimeout(debouncedQueryTimeout)

  debouncedQueryTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 700)
})

watch(salesPersonModal, async(newVal) => {
  newVal.show && newVal.type === 'link' && await updateUsersOptions()
}, { deep: true })

const { data: salesPersonsData, execute: fetchSalesPersons } = await useApi<any>(createUrl('sales',{
  query: {
    search: debouncedQuery,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions
  }
}))

const updateSelectedRows = (rows: ISalesPerson[]) => {
  selectedRows.value = rows.map((row: ISalesPerson) => ({ ...row }));
}

const totalSalesPerson = computed(() => salesPersonsData.value.data.total)
const salesPersons = computed((): ISalesPerson[] => salesPersonsData.value.data.data)

const { data: usersData, execute: fetchUsers } = await useApi<any>(createUrl('user', {
  query: {
    page,
    per_page: -1,
    sort_options: sortOptions
  },
}))


const updateUsersOptions = async () => {
  await fetchUsers()
  usersOptions.value = usersData.value.data.data
    .filter((user: IUser) => user.sales_person == null)
    .filter((user: IUser) => user.role?.role !== 'admin')
    .map((user: IUser) => ({
      label: user.name,
      value: user.id
    }))
}
const handleShowSalesPersonModal = (item: ISalesPerson) => {
  salesPersonModal.value.show = true
  selectedItem.value = item
  if(item.user){
    salesPersonModal.value.type = 'unlink'  
  } else {
    salesPersonModal.value.type = 'link'
  }
}

const handleSalesPersonLink = async () => {
  await handleUserBinding({
    type: salesPersonModal.value.type,
    userId: selectedItem.value?.user?.id || selectedUser.value, 
    salesPersonId: selectedItem.value?.SlpCode,
    callback: fetchSalesPersons,
    onFinish: () => {
      salesPersonModal.value = {...salesPersonModal.value, show: false}
      selectedItem.value = null
      selectedUser.value = null
    }
  })
}

</script>

<template>
  <section>
    <VCard class="mb-6">       
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="me-3 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="PAGINATION_ITEMS"
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
          <!-- <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn> -->
        </div>
      </VCardText>
      <VDivider />
      <VDataTableServer
        :loading="configStore.loading && !salesPersonModal.show"
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="salesPersons"
        item-value="id"
        :items-length="totalSalesPerson"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        return-object
        @update:options="updateOptions"
        @update:model-value="updateSelectedRows"
        multi-sort
      >
        <template #item.SlpName="{ item }">
          <div class="d-flex align-center gap-x-4">
            <div class="text-sm">
              {{ item.SlpName }}
            </div>
            <VChip v-if="item.user" label size="small" color="success">{{ item.user.name }}</VChip>            
          </div>
        </template>
        <template #item.action="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VRow align-content="start" justify="start">
              <VCol cols="auto">
                <VBtn @click="handleShowSalesPersonModal(item)" :color="item.user? 'error' : 'success'" :icon="item.user? 'tabler-link-off' : 'tabler-link'" size="x-small"></VBtn>
              </VCol>
            </VRow>
          </div>
        </template> 

        <!-- <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalSalesPerson"
          />
        </template> -->
      </VDataTableServer>
    </VCard>
    <VDialog v-model="salesPersonModal.show" max-width="500">
      <VCard>
        <div v-if="salesPersonModal.type === 'link'">
          <VCardTitle> Link User to Sales Person </VCardTitle>
          <VCardText>
            <AppSelect
              :disabled="configStore.loading"
              :loading="configStore.loading"
              v-model="selectedUser"
              clearable
              clear-icon="tabler-x"
              item-title="label"
              item-value="value"
              :items="usersOptions"
              label="Users"
              retun-object
            />
          </VCardText>
        </div>
        <div v-else-if="salesPersonModal.type === 'unlink'">
          <VCardTitle> Unlink User from Sales Person </VCardTitle>
          <VCardText>
            Are you sure you want to unlink this user from the sales person?
          </VCardText>
        </div>
        <VCardActions>
          <VSpacer />
          <VBtn @click="salesPersonModal.show = false"> Cancel </VBtn>
          <VBtn 
            :prepend-icon="salesPersonModal.type === 'unlink' ? 'tabler-link-off' : 'tabler-link'" 
            :color="salesPersonModal.type === 'unlink' ? 'error' : 'success'" 
            @click="handleSalesPersonLink"
          > 
            {{ salesPersonModal.type === 'unlink' ? 'Unlink' : 'Link' }} 
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>
