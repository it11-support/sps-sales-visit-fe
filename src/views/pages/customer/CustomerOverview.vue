<script lang="ts" setup>
import AppDateTimePicker from '@/@core/components/app-form-elements/AppDateTimePicker.vue';
import { useActivityStore, useCustomerStore } from '@/@core/stores';
import type { ICustomerData } from '@core/types';
import dayjs from 'dayjs';
import LinkSalesPersonModal from '../user/LinkSalesPersonModal.vue';
import CustomerItemList from './CustomerItemList.vue';
const props = defineProps<{ data: ICustomerData, onFinish?: () => Promise<void> }>()
const { data } = toRefs(props)
const { onFinish } = props

const userData = useCookie<any>('userData')
const showScheduleForm = ref(false)
const addBbsCustomer = ref(false)
const addSpsCustomer = ref(false)

const date = ref(new Date())
const notes = ref('')
const selectedType = ref(null)
const selectedBBSCustomer = ref<number | null>(null)
const selectedSPSCustomer = ref<number | null>(null)
const showLinkSalesPersonModal = ref(false)
const salesPersonId = data.value.sales_person?.SlpCode
const isLoading = ref(false)
const appCardOpen = ref(false)
const activityStore = useActivityStore()
const customerStore = useCustomerStore()
const showAddSlpCode = ref(false)
const linkSalesPersonLoading = ref(false)

const formData = ref<any>({
  assigned_by: userData.value.id,
  assigned_to: data.value.sales_person?.id ?? 0,
  bbs_customer_id: data.value.CompanyId === COMPANIES.SPS ? null : data.value.id,
  sps_customer_id: data.value.CompanyId === COMPANIES.BBS ? null : data.value.id,
  scheduled_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  activity_type_id: 0,
  notes: '',
  status: 'assigned',
})


const salesPersonName = data.value.sales_person ? data.value.sales_person.SlpName : '-'

const items = [
  { title: 'Customer Name', value: data.value.CardName, icon: 'tabler-buildings' },
  { title: 'Group Name', value: data.value.GroupName, icon: 'tabler-users-group' },
  { title: 'Address', value: `${data.value.Address} ${data.value.ZipCode ?? ''} , ${data.value.City ?? ''}`, icon: 'tabler-map' },
  { title: 'City', value: `${data.value.City}`, icon: 'tabler-map' },
  { title: 'Phone', value: `${data.value.Phone1}`, icon: 'tabler-phone' },
  { title: 'Cellular', value: `${data.value.Cellular ?? '-'}`, icon: 'tabler-device-mobile' },
  { title: 'Join Date', value: `${data.value.JoinDate ? formatDate(data.value.JoinDate) : '-'}`, icon: 'tabler-calendar' },
  { title: 'Contact Person', value: `${data.value.CntctPrsn ?? '-'}`, icon: 'tabler-message-user' },
  { title: 'Sales Person', value: `${salesPersonName}`, icon: 'tabler-user' },
]

onMounted(async () => {
  await activityStore.fetchActivityTypes()
  const company = data.value.CompanyId === COMPANIES.SPS ? COMPANIES.BBS : COMPANIES.SPS
  const salesPersonId = data.value.sales_person?.id ?? null
  await customerStore.fetchCustomerOptions(company, salesPersonId!)
})

watch(showScheduleForm, (val) => {
  if(val){
    formData.value.assigned_to = data.value.sales_person?.user?.[0]?.id ?? null
  }
})

const title = computed(() => `${data.value.CardName.toUpperCase()} (${data.value.CompanyId})`)

const slps = computed(() => data.value.sales_person?.user?.[0].sales_person  ?? [])

const handleShowScheduleForm = () => {
  if(data.value.sales_person?.user == null) {
    showLinkSalesPersonModal.value = true
  } else {
    showScheduleForm.value = !showScheduleForm.value
  }  
}

const handleOnFinsih = async() => {
  if (onFinish) {
    try {
      await onFinish()
      showScheduleForm.value = true
    } catch (error) {
      console.error(error)
    } finally {
      showLinkSalesPersonModal.value = false
    }
  }
}
const formatSelectedDate = (val: string) => {
  const date = new Date(val)
  const formattedDate = dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  formData.value.scheduled_date = formattedDate
}

const updateSelectedType = (val: number) => {
 formData.value.activity_type_id = val
}


const updateSelectedCustomer = (val: number, companyId: string) => {
  const selected = customerStore.customerOptions.find(x => x.value === val)

  if (!selected) return

  showAddSlpCode.value = selected.SlpCode === -1

  if (companyId === COMPANIES.SPS) {
    selectedSPSCustomer.value = val
    formData.value.sps_customer_id = val
  } else if (companyId === COMPANIES.BBS) {
    selectedBBSCustomer.value = val
    formData.value.bbs_customer_id = val
  }
}


watch(() => addBbsCustomer.value, (val) => {
  if (!val) {
    selectedBBSCustomer.value = null
    formData.value.bbs_customer_id = null
  }
})

watch(() => addSpsCustomer.value, (val) => {
  if (!val) {
    selectedSPSCustomer.value = null
    formData.value.sps_customer_id = null
  }
})

const updateNotes = (val: string) => {
  formData.value.notes = val
}


const handleSubmit = async () => {
  isLoading.value = true
  await $api(`activity`, {
    method: 'POST',
    body: {
      ...formData.value
    },
  }).finally(() => {
    isLoading.value = false
    showScheduleForm.value = false
  })
}

const onCollapsed = (collapsed: boolean) => {
  appCardOpen.value = !collapsed
}

const handleLinkSalesPersonToCustomer = async () => {

  try {
    linkSalesPersonLoading.value = true
    const customerId = addBbsCustomer.value
      ? selectedBBSCustomer.value
      : selectedSPSCustomer.value

    const slpId = addBbsCustomer.value
      ? slps.value.find(sp => sp.CompanyId === COMPANIES.BBS)?.id
      : slps.value.find(sp => sp.CompanyId === COMPANIES.SPS)?.id

    const payload = {
      sales_person_id: slpId,
      customer_id: Number(customerId),
    }

    await $api('customer/link-sales-person', {
      method: 'POST',
      body: payload,
    }).then(() => {
      linkSalesPersonLoading.value = false
    })

    showAddSlpCode.value = false
  } catch (error) {
    showAddSlpCode.value = false
    console.error(error)
  }
}

</script>

<template>
  <VCol cols="12" class="pb-0">
   <VBreadcrumbs
      class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
      :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Customers', to: { name: 'customers-list' }, class: 'text-primary'}, {title: 'Customer Overview'}]"
      >
      <template v-slot:prepend>
        <v-icon icon='tabler-home' size="small"></v-icon>
      </template>
    </VBreadcrumbs>
  </VCol>
  <div class="sticky-card-actions v-col v-col-12">
    <AppCardActions
      :title=title
      action-collapsed
      :collapsed="!appCardOpen"
      @collapsed="onCollapsed"
    >
      <VCardText>       
        <VRow class="d-flex justify-start">
          <VCol cols="12" lg="3" md="6" sm="12">
            <span class="d-flex gap-2 pb-4">
              <VChip :color="data.NonActive === 'Y' ? 'error' : 'success'" label size="small">
                {{ data.NonActive === 'Y' ? 'Inactive' : 'Active' }}
              </VChip>
            </span>
          </VCol>
        </VRow> 
        <VList class="card-list text-medium-emphasis">
          <CustomerItemList v-for="item in items" :key="item.title" :data="item" />
        </VList>
        <VRow class="d-flex justify-start">
          <VCol cols="12">
            <VDivider class="my-4" />
              <VRow class="d-flex justify-start">
                <VCol cols="12" lg="3" md="6" sm="12" class="d-flex justify-start">
                  <VBtn color="warning" @click="handleShowScheduleForm">
                    Create Activity <VIcon end icon="tabler-calendar-check" />
                  </VBtn>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
      </VCardText>
    </AppCardActions>
  </div>
  <VCol cols="12" v-if="!appCardOpen">
    <VRow class="d-flex justify-start">
      <VCol cols="12" lg="3" md="6" sm="12">
        <VBtn color="warning" @click="handleShowScheduleForm">
          Create Activity <VIcon end icon="tabler-calendar-check" />
        </VBtn>
      </VCol>
    </VRow>
  </VCol>
  <VDialog
    v-model="showScheduleForm"
    width="500"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="showScheduleForm = !showScheduleForm" />

    <!-- Dialog Content -->
    <VCard class="px-3 py-3">
      <VCardTitle>
        Create Activity
      </VCardTitle>
      <VCardSubtitle>
        Schedule a new activity for this customer
      </VCardSubtitle>
      <VCardText>
        <VForm @submit.prevent="handleSubmit">
          <VRow>
            <VCol cols="12">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                      class="v-label text-body-2 text-high-emphasis"
                      for="mobile"
                  >
                    Sales Person
                  </label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                 {{ data.sales_person ? data.sales_person.SlpName : '-' }}
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mobile"
                  >
                    Customer
                  </label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                 {{ `${data.CardName} (${data.CardCode})` }}
                </VCol>
              </VRow>
            </VCol>
            <VCol v-if="data.CompanyId === COMPANIES.SPS" cols="12" class="px-1">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="9"
                >
                  <VCheckbox
                    label="BBS Customer"
                    v-model="addBbsCustomer"
                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol v-else cols="12" class="px-1">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="9"
                >
                  <VCheckbox
                    label="SPS Customer"
                    v-model="addSpsCustomer"
                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12" v-if="addBbsCustomer">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mobile"
                  >
                    BBS Customer
                  </label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                <AppAutocomplete
                  autocomplete="off"
                  @update:model-value="(e: number) => updateSelectedCustomer(e, COMPANIES.BBS)"
                  v-model="selectedBBSCustomer"
                  :items="customerStore.customerOptions"
                  placeholder="Select BBS Customer"
                  clearable
                  clear-icon="tabler-x"
                />
                </VCol>
              </VRow>
            </VCol>

            <VCol cols="12" v-if="addSpsCustomer">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mobile"
                  >
                    SPS Customer
                  </label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                <AppAutocomplete
                  autocomplete="off"
                  @update:model-value="(e: number) => updateSelectedCustomer(e, COMPANIES.SPS)"
                  v-model="selectedSPSCustomer"
                  :items="customerStore.customerOptions"
                  placeholder="Select SPS Customer"
                  clearable
                  clear-icon="tabler-x"
                />
                </VCol>
              </VRow>
            </VCol>

            <VCol cols="12">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mobile"
                  >Date</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <AppDateTimePicker
                    @update:model-value="formatSelectedDate"
                    v-model="date"
                    placeholder="Select Date"
                    :config="{ 
                      dateFormat: 'Y-m-d',
                      minDate: 'today',                     
                    }"
                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12">
              <VRow no-gutters>
                <!-- 👉 Mobile -->
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mobile"
                  >
                    Activity Type
                  </label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                  <AppSelect
                    v-model="selectedType"           
                    placeholder="Select Activity Type"
                    :items="activityStore.activityTypes"
                    clearable
                    clear-icon="tabler-x"
                    @update:model-value="updateSelectedType"
                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12">
              <VRow no-gutters>
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="password"
                  >Notes</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <AppTextField
                    id="notes"
                    v-model="notes"
                    autocomplete="on"                    
                    placeholder="Additional notes"
                    persistent-placeholder
                    @update:model-value="updateNotes"
                  />
                </VCol>
              </VRow>
            </VCol>
            <!-- 👉 submit and reset button -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol
                  cols="12"
                  md="3"
                />
                <VCol
                  cols="12"
                  md="9"
                >
                  <VBtn
                    :loading="isLoading"
                    :disabled="isLoading"
                    type="submit"
                    class="me-4"
                  >
                    Submit
                    <!-- <VIcon
                      end
                      icon="tabler-cloud-upload"
                    /> -->
                  </VBtn>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
  <VDialog v-model="showAddSlpCode" width="400">
    <VCard>
      <VCardTitle>Link Sales Person</VCardTitle>
      <VCardText>
      This Customer has no Sales Person. Do you want to link to this sales person [{{ salesPersonName }}] ?
      </VCardText>

      <VCardActions class="justify-end">
        <VRow no-gutters>
          <VCol
            cols="12"
            md="9"
          >
            <VBtn
              :loading="linkSalesPersonLoading"
              :disabled="linkSalesPersonLoading"
              type="button"
              class="me-4"
              color="success"
              @click="handleLinkSalesPersonToCustomer"
            >
              Yes
            </VBtn>
            <VBtn              
              type="button"
              class="me-4"
              color="danger"
              @click="showAddSlpCode = false"
            >
              Cancel      
            </VBtn>
          </VCol>
        </VRow>
      </VCardActions>
    </VCard>
  </VDialog>

  <LinkSalesPersonModal 
    :show="showLinkSalesPersonModal"
    :sales-person-id="salesPersonId"
    :type="'link'"
    :onFinish="handleOnFinsih"
    @update:show="(val: boolean) => showLinkSalesPersonModal = val" 
  />

</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;

  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card-list > * {
  flex-basis: 48%;
  margin-block-end: 10px;
}

@media (max-width: 768px) {
  .card-list > * {
    flex-basis: 100%;
  }
}

.sticky-card-actions {
  position: sticky;
  z-index: 2;
  padding-block-end: 5px;
}

/* stylelint-disable-next-line selector-pseudo-class-no-unknown */
.sticky-card-actions :deep(.v-card-item) {
  padding-block: 10px !important;
}

</style>
