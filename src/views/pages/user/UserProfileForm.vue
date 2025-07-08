<script lang="ts" setup>
import { useUserStore } from '@/@core/stores';
import { useCustomerStore } from '@/@core/stores/customer';
import { useRoleStore } from '@/@core/stores/role';
import { useConfigStore } from '@core/stores/config';
import { VForm } from 'vuetify/components/VForm';
import avatar1 from '@images/avatars/user-default.png'

const configStore = useConfigStore()
const customerStore = useCustomerStore()
const userStore = useUserStore()

const userData = useCookie<any>('userData')
const form = ref<VForm>()
const salesPerson = useCookie<any>('userData')?.value?.sales_person ?? null
const hasCustomer = useCookie<any>('userData')?.value?.hasCustomer ?? false
const password = ref('')
const confirm_password = ref('')
const errors = ref([])
const isPasswordVisible = ref(false)
const searchQuery = ref('')
const filterDormantCustomer = ref(false)
const debouncedQuery = useDebounce(searchQuery, 400)
const roleStore = useRoleStore()

const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')

watch(debouncedQuery, (val) => {
  customerStore.updateFilters({ search: val })
})

onMounted(async() => {
  await customerStore.initialize(salesPerson?.SlpCode)
  roleStore.fetchRoles()
})

const submitUserHandler = async () => {
  try {
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        return
      }
    }
    configStore.overlay = true
    const res = await $api(`/user/update/${userData.value.id}`, {
      method: 'PUT',
      body: JSON.parse(JSON.stringify({
        ...userData.value,
        ...(password.value ? { new_password: password.value } : {}),
      })),
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    const { data } = res
    useCookie('userData').value = data
    configStore.overlay = false

  } catch (error) {
    configStore.overlay = false
  }
}

const headers = [
  { title: 'Actions', key: 'actions', sortable: false },
  { title: 'Customer', key: 'CardName' },
  { title: 'Group Name', key: 'GroupName' },
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' },
  { title: 'Phone', key: 'Phone' },
  { title: 'Number of Invoices', key: 'invoice_count' },
  { title: 'Last Invoice Date', key: 'last_transaction_date' },
  { title: 'Payment Terms', key: 'PaymentTerm' },
  { title: 'Price List', key: 'PriceList' },
  // { title: 'Actions', key: 'actions', sortable: false },
]

const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]
const { data: groupFilter } = await useApi<any>(createUrl(`customer/get-fitlers/${salesPerson?.SlpCode}`), {})
const groupNameOptions = computed(() => groupFilter.value.data.groupName.map((group: any) => ({
  value: group.GroupName,
  title: group.GroupName
})))

const paymentTermOptions = computed(() => groupFilter.value.data.paymentTerm.map((term: any) => ({
  value: term.PaymentTerm,
  title: term.PaymentTerm
})))

const priceListOptions = computed(() => groupFilter.value.data.priceList.map((list: any) => ({
  value: list.PriceList,
  title: list.PriceList
})))

// City
const cityOptions = computed(() => groupFilter.value.data.cities
  .filter((city: any) => city.City !== null)
  .map((city: any) => ({
    value: city.City,
    title: city.City
  })))
// Last transaction
const dormantOptions = [
  { title: 'More than 1 month', value: 1 },
  { title: 'More than 2 months', value: 2 },
  { title: 'More than 3 months', value: 3 },
  { title: 'More than 6 months', value: 6 },
  { title: 'More than 12 months', value: 12 },
]

</script>

<template>
  <VRow v-if="salesPerson !== null">
    <VCol cols="12">
      <VBreadcrumbs
        class="px-0 pb-2 pt-0 help-center-breadcrumbs"
        :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Profile', class: 'text-primary' }]"
      >
      <template v-slot:prepend>
        <v-icon icon='tabler-home' size="small"></v-icon>
      </template>
      </VBreadcrumbs>
      <VCard title="Linked Sales Person">
        <VCardSubtitle class="text-h5 ml-2 mb-4">
          <VAvatar size="30" :image="avatar1"></VAvatar>
          {{ salesPerson.SlpName }}
        </VCardSubtitle>
      </VCard>
    </VCol>
  </VRow>
  <VRow v-if="hasCustomer">
    <VCol cols="12">
      <VCard title="Customers">
        <VCardText>
          <VRow>
            <!-- 👉 Select Role -->
            <VCol cols="12" md="4" sm="4">
              <AppSelect 
                v-model="customerStore.filters.group_name" 
                @update:model-value="customerStore.updateFilters({ group_name: $event })"
                placeholder="Filter by group name" 
                :items="groupNameOptions"
                clearable clear-icon="tabler-x" 
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
                placeholder="Filter by Payment Term"
                @update:model-value="customerStore.updateFilters({ payment_term: $event })"
                :items="paymentTermOptions"
                clearable clear-icon="tabler-x" 
              />
            </VCol>
            <VCol cols="12" md="4" sm="4">
              <AppSelect 
                v-model="customerStore.filters.price_list"
                @update:model-value="customerStore.updateFilters({ price_list: $event })"
                placeholder="Filter by Price List" 
                :items="priceListOptions"
                clearable clear-icon="tabler-x" 
              />
            </VCol>
            <VCol cols="12" md="4" sm="4">
              <AppSelect v-model="customerStore.filters.city"
                @update:model-value="customerStore.updateFilters({ city: $event })"
                placeholder="Filter by City / Area" 
                :items="cityOptions" clearable
                clear-icon="tabler-x" 
              />
            </VCol>
          </VRow>
          <VRow class="d-flex justify-start">
            <VCol cols="12" sm="12">
              <VRow class="d-flex justify-start">
                <VCol cols="12" lg="2" sm="12">
                  <VCheckbox v-model="filterDormantCustomer" label="Dormant Customer" />
                </VCol>
                <VCol v-if="filterDormantCustomer" cols="12" lg="3" md="4" sm="12">
                  <AppSelect 
                    :items="dormantOptions"
                    v-model="customerStore.filters.dormantMonth"
                    @update:model-value="customerStore.updateFilters({ dormantMonth: $event })"
                    placeholder="Filter by last transaction"
                    clearable clear-icon="tabler-x" 
                  />
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardText class="d-flex flex-wrap gap-4">
          <div class="me-3 d-flex gap-3">
            <AppSelect 
              :model-value="customerStore.filters.per_page" 
              :items="PAGINATION_ITEMS" style="inline-size: 6.25rem;"
              @update:model-value="customerStore.setPerpage(parseInt($event, 10))" 
            />
            <VCheckbox 
              label="Hide Zero Invoice" 
              v-model="customerStore.filters.hideZeroInvoice" 
              @update:model-value="customerStore.updateFilters({ hideZeroInvoice: $event as boolean })"
            />
          </div>
          <VSpacer />

          <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
            <!-- 👉 Search  -->
            <div style="inline-size: 15.625rem;">
              <AppTextField v-model="searchQuery" placeholder="Search ..." clearable clear-icon="tabler-x" />
            </div>

            <!-- 👉 Export button -->
            <!-- <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
              Export
            </VBtn> -->
          </div>
        </VCardText>
        <VDivider />
        <VDataTableServer 
          :loading="customerStore.loadingList" 
          v-model:items-per-page="customerStore.filters.per_page"
          v-model:model-value="customerStore.selectedRows"
          v-model:page="customerStore.filters.page"
          :items="customerStore.customers" 
          item-value="CardCode"
          :items-length="customerStore.pagination.total"
          :headers="headers" class="text-no-wrap" 
          show-select 
          :select-strategy="'all'"
          return-object 
          @update:options="customerStore.updateSortOptions" 
          @update:model-value="customerStore.setSelectedRows"
          multi-sort>
          <template #item.actions="{ item }">
            <a :href="`${'customers/view/' + item.CardCode}`">
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
              <VChip :color="item.NonActive === 'Y' ? 'error' : 'success'" label size="small">
                {{ item.NonActive === 'Y' ? 'Inactive' : 'Active' }}
              </VChip>
            </div>
          </template>
          <template #item.invoice_count="{ item }">
            <div class="d-flex justify-content-between gap-x-4">
              {{ item.invoice_count }}
            </div>
          </template>
          <template #item.last_transaction_date="{ item }">
            <div class="d-flex justify-content-between gap-x-4">
              {{ item.last_transaction_date ? formatDate(item.last_transaction_date) : '' }}
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

          <!-- pagination -->
          <!-- <template #bottom>
            <TablePagination v-model:page="customerStore.filters.page" :items-per-page="customerStore.filters.per_page" :total-items="customerStore.pagination.total" />
          </template> -->
        </VDataTableServer>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard title="User Profile">
        <VCardText>
          <VForm ref="form" @submit.prevent="submitUserHandler">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField label="Name" v-model="userData.name" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField :disabled="!isAdmin" label="Username" v-model="userData.username" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField :disabled="!isAdmin" label="Email" v-model="userData.email" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect :disabled="!isAdmin" v-model="userData.role_id" :items="roleStore.roleOptions" item-title="role"
                  item-value="id" label="Role" persistent-hint single-line />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField v-model="password" label="Password" placeholder="············"
                  :rules="password ? [requiredValidator, passwordValidator] : []"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField v-model="confirm_password" label="Password Confirmation" placeholder="············"
                  :rules="[confirmedValidator(confirm_password, password)]"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>
              <VCol cols="12">
                <VBtn type="submit" class="me-3">
                  Submit
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
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
