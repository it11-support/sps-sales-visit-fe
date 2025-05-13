<script lang="ts" setup>
import { CustomerData } from '@/@core/typedefs';
import { SortItem } from '@/@core/types';
import { useConfigStore } from '@core/stores/config';
import { VForm } from 'vuetify/components/VForm';

const configStore = useConfigStore()

const userData = useCookie<any>('userData')
const roleOptions = ref([])
const form = ref<VForm>()
const salesPerson = useCookie<any>('userData')?.value?.sales_person ?? null
const password = ref('')
const confirm_password = ref('')
const errors = ref([])
const isPasswordVisible = ref(false)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const selectedRows = ref<CustomerData[]>([])
const sortOptions = ref<SortItem[]>([])
const searchQuery = ref('')




onMounted(async() => {
  try {
    configStore.overlay = true
    // Get roles from api
    const { data: rolesData } = await useApi<any>(createUrl('role'), {
      method: 'GET',
    });
    
    roleOptions.value = rolesData.value.data.map((role: any) => ({
      label: role.role[0].toUpperCase() + role.role.slice(1),
      value: role.id
    }))
    configStore.overlay = false    
  } catch (error) {
    configStore.overlay = false 
  } finally {
    configStore.overlay = false 
  }
})

const submitUserHandler = async () => {
  try {
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        console.log(errors)
        return
      }
    }
    configStore.overlay = true
    const res = await $api(`/user/update/${userData.value.id}`, {
      method: 'PUT',
       body: JSON.parse(JSON.stringify({
        ...userData.value,
        ...(password.value ? {new_password: password.value} : {}),
      })),
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    const { data } = res
    useCookie('userData').value = data
    configStore.overlay = false

    console.log(data, customers.value)
  } catch (error) {
    configStore.overlay = false
  } 
}
const { data: customerData, execute: fetchCustomers } = await useApi<any>(createUrl('customer', {
  query: {
    search: searchQuery,
    sales_person_id: salesPerson.SlpCode,
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions
  },
}))



const updateSelectedRows = (rows: CustomerData[]) => {
  selectedRows.value = rows.map((row: CustomerData) => ({ ...row }));
}

const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
}

const totalCustomer = computed(() => customerData.value.data.total)
const customers = computed((): CustomerData[] => customerData.value.data.data)

const headers = [
  { title: 'Customer', key: 'CardName'},
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' }, 
  { title: 'Phone 1', key: 'Phone1' },
  { title: 'Phone 2', key: 'Phone2' },
  { title: 'Fax', key: 'Fax' },
  { title: 'Email', key: 'E_Mail' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const isAdmin = () => {
  return configStore.isAdmin()
}
</script>


<template>
  <VRow>
    <VCol cols="12">
      <VCard title="User Profile">
        <VCardText>
          <VForm
            ref="form"
            @submit.prevent="submitUserHandler"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Name"
                  v-model="userData.name"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Username"
                  v-model="userData.username"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Email"
                  v-model="userData.email"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect                 
                  v-model="userData.role_id"
                  :items="roleOptions"
                  item-title="label"
                  item-value="value"
                  label="Role"
                  persistent-hint
                  single-line
                />
              </VCol>
              <VCol cols="12" md="6">
               <AppTextField
                  v-model="password"
                  label="Password"
                  placeholder="············"
                  :rules="password ? [requiredValidator, passwordValidator] : []"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
                </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="confirm_password"
                  label="Password Confirmation"
                  placeholder="············"
                  :rules="[confirmedValidator(confirm_password, password)]"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-3"
                >
                  Submit
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VRow v-if="salesPerson !== null">
    <VCol cols="12">
      <VCard title="Linked Sales Person">
        <VCardSubtitle class="text-h5 ml-2 mb-2">
          {{ salesPerson.SlpName }}
        </VCardSubtitle>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard title="Customers">
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
        </div>
      </VCardText>

      <VDivider />
        <VCardSubtitle class="text-h5 ml-2 mb-2">
          {{ customers.length }}
        </VCardSubtitle>
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
        <template #item.status="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            <VChip 
              :color="item.frozenFor === 'Y' ? 'error' : 'success'"
              label
              size="small"
            >
            {{ item.frozenFor === 'Y' ? 'Inactive' : 'Active' }}
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
        <template #item.E_Mail="{ item }">
          <div class="d-flex align-center gap-x-4">          
            <div class="d-flex flex-column">
                <a v-if="item.E_Mail" :href="`mailto:${item.E_Mail}`">
                  {{ item.E_Mail }}
                </a>
            </div>
          </div>
        </template>
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
                <!-- <div v-if="isAdmin()">
                  <VListItem @click="showDeleteModal(item.CardCode)">
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

        <!-- pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalCustomer"
          />
        </template>
      </VDataTableServer>
      </VCard>
    </VCol>
  </VRow>
</template>
