<script setup lang="ts">
import { useUserStore } from '@/@core/stores';
import { useRoleStore } from '@/@core/stores/role';
import { useSalesPersonStore } from '@/@core/stores/sales-person';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import { handleUserBinding } from '@/utils/user/binding';
import UserDrawer from '@/views/pages/user/UserDrawer.vue';
import { useConfigStore } from '@core/stores/config';
import type { IUser } from '@core/types';

const searchQuery = ref('')
const selectedSalesPerson = ref()
const salesPersonModal = ref({
  type : 'link',
  show: false
})
const loadingRoles = ref(true)
let debouncedQueryTimeout: ReturnType<typeof setTimeout> | null = null

// Data table options
const isConfirmDialogVisible = ref(false)
const configStore = useConfigStore()
const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')
const isSpv = computed(() => user.value.role.role === 'spv')
const showFilter = ref(false)
const userStore = useUserStore()
const roleStore = useRoleStore()
const salesPersonStore = useSalesPersonStore()
// Headers
const headers = [
  { title: 'User', key: 'name'},
  { title: 'Email', key: 'email' },
  { title: 'Username', key: 'username' },
  { title: 'Role', key: 'role' },
  { title: 'Team', key: 'team' },
  { title: 'Sales Person', key: 'sales_person' , sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

onMounted(async() => {
  salesPersonStore.updateSalesPersonOptions()
  await userStore.initialize(user.value.team_id)
})

watch(() => user.value, async(newVal) => {
  if(newVal){
    await userStore.initialize(newVal.team_id)
  }
},{immediate: true})

// Delayed search
watch(searchQuery, (newVal) => {
  if (debouncedQueryTimeout) clearTimeout(debouncedQueryTimeout)

  debouncedQueryTimeout = setTimeout(() => {
    userStore.updateQuery({ search: newVal })
  }, 700)
})

watch(showFilter, (newVal) => {
  if(newVal){
    roleStore.fetchRoles()
  }
})

watch(userStore, (newVal) => {
  if(newVal.isAddNewUserDrawerVisible){
    roleStore.fetchRoles()
    salesPersonStore.updateSalesPersonOptions()
    salesPersonStore.fetchTeamOptions()
  }
})

watch(roleStore, (newVal) => {
  if(newVal.roleOptions.length > 0) loadingRoles.value = false
})

// Update sales person options
watch(salesPersonModal, async(newVal) => {
  newVal.show && newVal.type === 'link' && await salesPersonStore.updateSalesPersonOptions()
}, { deep: true })


// Link & unlink user to sales person api
const handleSalesPersonLink = async () => {
  await handleUserBinding({
    type: salesPersonModal.value.type,
    userId: userStore.selectedUser.id, 
    salesPersonId: selectedSalesPerson.value,
    callback: userStore.fetchUsers, 
    onFinish: () => {
      salesPersonModal.value = {...salesPersonModal.value, show: false}
      userStore.setSelectedUser({username: '', role: undefined, id: 0, name: '', email: ''})
      selectedSalesPerson.value = null
    }
  })
}


const deleteSelectedUsers = async () => {
  console.log(userStore.selectedUser)
}
// Open link menu
const handleClickLinkMenu = (item: IUser) => {
  console.log(item)
  if (item.sales_person) {
    salesPersonModal.value = {show: true, type: 'unlink'}
  } else {
    salesPersonModal.value = {show: true, type: 'link'}
  }
  userStore.setSelectedUser(item)
}

// Change selected item value and open drawer
const handleSelectItem = (item?: IUser) => {
  console.log(item)
  if (item) {
    userStore.setSelectedUser({ ...item })
    userStore.setEditMode(true)
  } else {
    userStore.setSelectedUser({ username: '', role: undefined, id: 0, name: '', email: '' })
    userStore.setEditMode(false)
  }
  userStore.setAddNewUserDrawerVisible(true)
}
</script>

<template>
  <section>
  <VBreadcrumbs
    class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
    :items="[
      {
        title: 'Home',
        to: '/',
        class: 'text-primary' 
      },
      { 
        title: 'User List',  
      },
    ]"
    >
    <template v-slot:prepend>
      <v-icon icon='tabler-home' size="small"></v-icon>
    </template>
  </VBreadcrumbs>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCheckbox v-model="showFilter" label="Show Filters"></VCheckbox>
      </VCardItem>
      <VCardText v-if="showFilter">
        <VRow>
          <VCol
            cols="12"
            sm="4"
          >
          <AppSelect
            :loading="loadingRoles"
            v-model="userStore.query.role"
            @update:model-value="userStore.updateQuery({ role: $event, page: 1 })"
            clearable
            clear-icon="tabler-x"
            :items="roleStore.roleOptions"
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
            :model-value="userStore.query.per_page"
            :items="PAGINATION_ITEMS"
            style="inline-size: 6.25rem;"
            @update:model-value="userStore.setPerpage(parseInt($event, 10))"
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
        v-model:items-per-page="userStore.pagination.per_page"
        v-model:model-value="userStore.selectedRows"
        v-model:page="userStore.query.page"
        :items="userStore.users"
        item-value="id"
        :items-length="userStore.pagination.total"
        :headers="headers"
        class="text-no-wrap"
        show-select
        :select-strategy="'all'"
        return-object
        @update:options="userStore.updateSortOptions"
        @update:model-value="userStore.setSelectedRows"
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
        <template #item.team="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
              <div class="text-sm">
                {{ item.team?.name  }}
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
            v-if="isAdmin || isSpv"
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <!-- <VListItem >
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>
                  <VListItemTitle>View</VListItemTitle>
                </VListItem> -->
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
                <!-- <div>
                  <VListItem v-if="item.role?.role !== 'admin'" @click="showDeleteModal(item)">
                    <template #prepend>
                      <VIcon icon="tabler-trash" />
                    </template>
                    <VListItemTitle>Delete</VListItemTitle>
                  </VListItem>
                </div> -->
              </VList>
            </VMenu>
          </VBtn>
        </template>
        <!-- <template #bottom>
          <TablePagination
            v-model:page="userStore.query.page"
            :items-per-page="userStore.query.per_page"
            :total-items="userStore.pagination.total"
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
              v-model="selectedSalesPerson"
              clearable
              clear-icon="tabler-x"
              item-title="title"
              item-value="value"
              :items="salesPersonStore.salesPersonOptions.filter((item) => item.user === null)"
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
      :user="userStore.selectedUser"
      :is-edit-mode="userStore.isEditMode"
      v-model:is-drawer-open="userStore.isAddNewUserDrawerVisible"
      :role-options="roleStore.roleOptions"
      :sales-persons-options="salesPersonStore.filteredSalesPersonOptions"
      @user-data="userStore.storeUser"
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
