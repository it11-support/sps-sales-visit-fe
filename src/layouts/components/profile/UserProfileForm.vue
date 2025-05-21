<script lang="ts" setup>
import { ICustomerData } from '@/@core/typedefs';
import { SortItem } from '@/@core/types';
import { useConfigStore } from '@core/stores/config';
import { VForm } from 'vuetify/components/VForm';

const configStore = useConfigStore()

const userData = useCookie<any>('userData')
const roleOptions = ref([])
const form = ref<VForm>()
const salesPerson = useCookie<any>('userData')?.value?.sales_person ?? null
const hasCustomer = useCookie<any>('userData')?.value?.hasCustomer ?? false
const password = ref('')
const confirm_password = ref('')
const errors = ref([])
const isPasswordVisible = ref(false)
const itemsPerPage = ref(DEFAULT_PER_PAGE)
const page = ref(1)
const selectedRows = ref<ICustomerData[]>([])
const sortOptions = ref<SortItem[]>([])
const searchQuery = ref('')
const selectedStatus = ref()
const selectedGroupName = ref()
const hideZeroInvoice = ref(false)
const selectedPaymentTerm = ref()
const selectedPriceList = ref()
const filterDormantCustomer = ref(false)
const dormantMonth = ref(null)

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

const { data: customerData, execute: fetchCustomers } = salesPerson?.SlpCode ? await useApi<any>(createUrl('customer', {
  query: {
    search: searchQuery,
    status: selectedStatus,
    sales_person_id: salesPerson.SlpCode,
    group_name: selectedGroupName,   
    per_page: itemsPerPage,
    page,
    sort_options: sortOptions,
    hideZeroInvoice,
    payment_term: selectedPaymentTerm,
    price_list: selectedPriceList,
    dormantMonth
  },
})) : { data: null, execute: null }



const updateSelectedRows = (rows: ICustomerData[]) => {
  selectedRows.value = rows.map((row: ICustomerData) => ({ ...row }));
}

const updateOptions = (options: any) => {
  sortOptions.value = [options.sortBy]
}

const totalCustomer = computed(() => customerData?.value.data.total)
const customers = computed((): ICustomerData[] => customerData?.value.data.data)

const headers = [
  { title: 'Actions', key: 'actions', sortable: false },
  { title: 'Customer', key: 'CardName'},
  { title: 'Group Name', key: 'GroupName' },
  { title: 'PIC', key: 'CntctPrsn' },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Address', key: 'Address', width: '50px' }, 
  { title: 'Phone', key: 'Phone' },
  { title: 'Number of Invoices', key: 'invoice_count' },
  { title: 'Payment Terms', key: 'PaymentTerm' },
  { title: 'Price List', key: 'PriceList' },
  // { title: 'Actions', key: 'actions', sortable: false },
]

const isAdmin = computed(() => userData.value.role.role === 'admin')
const status = [
  { title: 'Active', value: 'N' },
  { title: 'Inactive', value: 'Y' },
]
const {data: groupFilter} =  await useApi<any>(createUrl('customer/get-fitlers'), {}) 
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
      <VCard title="Linked Sales Person">
        <VCardSubtitle class="text-h5 ml-2 mb-2">
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
           <VCol
            cols="12"
            md="4"
            sm="4"
          >
            <AppSelect
              v-model="selectedGroupName"
              placeholder="Filter by group name"
              :items="groupNameOptions"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
                  
          <VCol
            cols="12"
            md="4"
            sm="4"
          >
            <AppSelect
              v-model="selectedStatus"
              placeholder="Filter by status"
              :items="status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
            sm="4"
          >
            <AppSelect
              v-model="selectedPaymentTerm"
              placeholder="Filter by Payment Term"
              :items="paymentTermOptions"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
            sm="4"
          >
            <AppSelect
              v-model="selectedPriceList"
              placeholder="Filter by Price List"
              :items="priceListOptions"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
        <VRow class="d-flex justify-start">
          <VCol
            cols="12"           
            sm="12"
          >
            <VRow class="d-flex justify-start">
              <VCol
                cols="12"
                lg="2"
                sm="12"
              >
                <VCheckbox
                  v-model="filterDormantCustomer"
                  label="Dormant Customer"              
                />
              </VCol>
              <VCol
                v-if="filterDormantCustomer"
                cols="12"
                lg="3"
                md="4"
                sm="12"                
              >
                <AppSelect
                  :items="dormantOptions"
                  v-model="dormantMonth"
                  placeholder="Filter by last transaction"          
                  clearable
                  clear-icon="tabler-x"
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
        <template #item.actions="{ item }">
          <a :href="`${'customers/view/' + item.CardCode }`">
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
         <template #item.invoice_count="{ item }">
          <div class="d-flex justify-content-between gap-x-4">
            {{ item.invoice_count }}
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
                  :disabled="!isAdmin"
                  label="Username"
                  v-model="userData.username"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  :disabled="!isAdmin"
                  label="Email"
                  v-model="userData.email"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  :disabled="!isAdmin"            
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
