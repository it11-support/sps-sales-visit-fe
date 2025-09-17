<script lang="ts" setup>
import AppDateTimePicker from '@/@core/components/app-form-elements/AppDateTimePicker.vue';
import { useActivityStore } from '@/@core/stores';
import type { ICustomerData } from '@core/types';
import dayjs from 'dayjs';
import LinkSalesPersonModal from '../user/LinkSalesPersonModal.vue';
import CustomerItemList from './CustomerItemList.vue';
const props = defineProps<{ data: ICustomerData, onFinish?: () => Promise<void> }>()
const { data } = toRefs(props)
const { onFinish } = props

const userData = useCookie<any>('userData')
const showScheduleForm = ref(false)
const date = ref(new Date())
const notes = ref('')
const selectedType = ref(null)
const showLinkSalesPersonModal = ref(false)
const salesPersonId = data.value.sales_person?.SlpCode
const isLoading = ref(false)
const isSticky = ref(false)
const stickyRef = ref<HTMLElement | null>(null)
const activityStore = useActivityStore()
const formData = ref({
  assigned_by: userData.value.id,
  assigned_to: data.value.sales_person?.user?.[0].id ?? null,
  customer_id: data.value.CardCode,
  scheduled_date: '',
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
})

watch(showScheduleForm, (val) => {
  if(val){
    formData.value.assigned_to = data.value.sales_person?.user?.[0].id ?? null
  }
})

const title = computed(() => `${data.value.CardName.toUpperCase()}`)

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
onMounted(() => {
  window.addEventListener('scroll', checkSticky)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkSticky)
})

const checkSticky = () => {
  if (!stickyRef.value) return
  const top = stickyRef.value.getBoundingClientRect().top
  isSticky.value = top <= 62
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
  <div class="sticky-card-actions v-col v-col-12" ref="stickyRef">
    <AppCardActions
      :title=title
      action-collapsed
      :collapsed="isSticky"
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
              <VRow class="d-flex justify-end">
                <VCol cols="12" lg="3" md="6" sm="12" class="d-flex justify-end">
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
                  >Sales Person</label>
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
                  >Customer</label>
                </VCol>

                <VCol
                  cols="12"
                  md="9"
                >
                 {{ `${data.CardName} (${data.CardCode})` }}
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
                      dateFormat: 'F j, Y', 
                      minDate: new Date(),
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
                  >Activity Type</label>
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
  z-index: 20;
  inset-block-start: 58px;
}
</style>
