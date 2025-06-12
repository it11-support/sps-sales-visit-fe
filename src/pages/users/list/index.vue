<script setup lang="ts">
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import { handleUserBinding } from '@/utils/user/binding';
import UserDrawer from '@/views/pages/user/UserDrawer.vue';
import { useConfigStore } from '@core/stores/config';
import type { ISalesPerson, IUser, SortItem } from '@core/types';

const searchQuery = ref('')
const selectedRole = ref()
const debouncedQuery = ref('')
const selectedSalesPerson = ref()
const salesPersonOptions  = ref([])
const selectedUser = ref()
const salesPersonModal = ref({
  type : 'link',
  show: false
})

const isAddNewUserDrawerVisible = ref(false)
const isEditMode = ref(false)
let debouncedQueryTimeout: ReturnType<typeof setTimeout> | null = null


// Data table options
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const sortOptions = ref<SortItem[]>([])
const selectedRows = ref<IUser[]>([])
const isConfirmDialogVisible = ref(false)
const configStore = useConfigStore()
const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')

// Headers
const headers = [
  { title: 'User', key: 'name'},
  { title: 'Email', key: 'email' },
  { title: 'Username', key: 'username' },
  { title: 'Role', key: 'role' },
  { title: 'Sales Person', key: 'sales_person' , sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Add user
const storeUser = async (userData: IUser) => {
  configStore.overlay = true

  console.log(userData)
  try {
    const url = isEditMode.value ? `/user/update/${userData.id}` : '/user/register'
    await $api(url, {
      method: isEditMode.value ? 'PUT' : 'POST',
      body: userData,
    })
    // Refetch User
    fetchUsers()  
  } catch (error) {

  } finally {
    configStore.overlay = false
    isAddNewUserDrawerVisible.value = false
  }
}

// Update sort options
const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
}
// Delayed search
watch(searchQuery, (newVal) => {
  if (debouncedQueryTimeout) clearTimeout(debouncedQueryTimeout)

  debouncedQueryTimeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 700)
})

// Fetch sales persons
const { data: salesPersonsData, execute: fetchSalesPersons } = await useApi<any>(createUrl('sales',{
  query: {
    per_page: -1,
    page: 1,
  }
}))

// Update sales person options
watch(salesPersonModal, async(newVal) => {
  newVal.show && newVal.type === 'link' && await updateSalesPersonOptions()
}, { deep: true })

const updateSalesPersonOptions = async () => {
  await fetchSalesPersons()
  salesPersonOptions.value = salesPersonsData.value.data.data
    .filter((sales: ISalesPerson) => sales.user == null)
    .filter((sales: ISalesPerson) => sales.user?.role?.role !== 'admin')
    .map((sales: ISalesPerson) => ({
      label: sales.SlpName,
      value: sales.SlpCode
    }))
}

// Update selected rows
const updateSelectedRows = (rows: IUser[]) => {
  selectedRows.value = rows.map((row: IUser) => ({ ...row }));
}

// Link & unlink user to sales person api
const handleSalesPersonLink = async () => {
  await handleUserBinding({
    type: salesPersonModal.value.type,
    userId: selectedUser.value.id, 
    salesPersonId: selectedSalesPerson.value,
    callback: fetchUsers, 
    onFinish: () => {
      salesPersonModal.value = {...salesPersonModal.value, show: false}
      selectedUser.value = null
      selectedSalesPerson.value = null
    }
  })
}

// Show delete modal
const showDeleteModal = (item: IUser) => {
  selectedUser.value = item
  isConfirmDialogVisible.value = true
}

const deleteSelectedUsers = async () => {
  console.log(selectedUser.value)
}
// Open link menu
const handleClickLinkMenu = (item: IUser) => {
  if (item.sales_person) {
    salesPersonModal.value = {show: true, type: 'unlink'}
  } else {
    salesPersonModal.value = {show: true, type: 'link'}
  }
  selectedUser.value = item
}

// 👉 Fetching users
const { data: usersData, execute: fetchUsers } = await useApi<any>(createUrl('user', {
  query: {
    search: debouncedQuery,
    role: selectedRole,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions
  },
}))

// Fetch roles
const { data: rolesData } = await useApi<any>(createUrl('role'), {})

// Roles for filter
const roleOptions = rolesData.value.data.map((role: any) => ({
  role: role.role[0].toUpperCase() + role.role.slice(1),
  id: role.id
}))

const totalUser = computed(() => usersData.value.data.total)
const users = computed((): IUser[] => usersData.value.data.data)

// Change selected item value and open drawer
const handleSelectItem = (item?: IUser) => {
  if (item) {
    selectedUser.value = { ...item }
    isEditMode.value = true
  } else {
    selectedUser.value = null
    isEditMode.value = false
  }
  isAddNewUserDrawerVisible.value = true
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
          <VCol
            cols="12"
            sm="4"
          >
          <AppSelect
            v-model="selectedRole"
            clearable
            clear-icon="tabler-x"
            :items="roleOptions"
            item-title="role"
            item-value="id"
            label="Role"
            persistent-hint
            single-line
          />
          </VCol>  
        </VRow>
      </VCardText>
      <VDivider />
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
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn>

          <VBtn
            prepend-icon="tabler-plus"
            @click="handleSelectItem()"
          >
            Add New User
          </VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VDataTableServer
        :loading="configStore.loading && !salesPersonModal.show"
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="users"
        item-value="id"
        :items-length="totalUser"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        return-object
        @update:options="updateOptions"
        @update:model-value="updateSelectedRows"
        multi-sort
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.role?.role  }}
              </div>
            </div>
          </div>
        </template>
        <template #item.sales_person="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">               
                <VChip v-if ="item.role?.role !== 'admin' && item.sales_person" label size="small" color="success">{{ item.sales_person.SlpName }}</VChip>
                <VChip v-else-if="item.role?.role !== 'admin' && !item.sales_person" label size="small" color="error">Not Linked</VChip>
              </div>
            </div>
          </div>
        </template>
        <template #item.actions="{ item }">
          <VBtn
            v-if="isAdmin"
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem >
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>
                  <VListItemTitle>View</VListItemTitle>
                </VListItem>
                <VListItem @click="handleSelectItem(item)">
                  <template #prepend>
                    <VIcon icon="tabler-edit" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
                </VListItem>
                <template v-if="item.role?.role !== 'admin'">
                  <VListItem @click="handleClickLinkMenu(item)">
                    <template #prepend >
                      <VIcon :icon="!item.sales_person ? 'tabler-link' : 'tabler-link-off'" />
                    </template>
                    <VListItemTitle>{{ !item.sales_person ? 'Link Sales Person' : 'Unlink Sales Person' }}</VListItemTitle>
                  </VListItem>
                </template>                
                <div>
                  <VListItem v-if="item.role?.role !== 'admin'" @click="showDeleteModal(item)">
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
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUser"
          />
        </template>
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
              v-model="selectedSalesPerson"
              clearable
              clear-icon="tabler-x"
              item-title="label"
              item-value="value"
              :items="salesPersonOptions"          
              label="Sales Person"
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
    <UserDrawer
      :user="selectedUser"
      :is-edit-mode="isEditMode"
      v-model:is-drawer-open="isAddNewUserDrawerVisible"
      @user-data="storeUser"
    />
    <ConfirmDialog
      v-model:is-dialog-visible="isConfirmDialogVisible"
      cancel-title="Cancelled"
      confirm-title="User Deleted!"
      confirm-msg="User deleted successfully."
      confirmation-question="Are you sure to delete this user?"
      cancel-msg="Delete user cancelled!!"
      v-on:confirm="deleteSelectedUsers"
    />
  </section> 
</template>
