<script lang="ts" setup>
import { Filters, useActivityStore, useAuthStore } from '@/@core/stores';

const activityStore = useActivityStore()
const authStore = useAuthStore()
const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')
const isSpv = computed(() => user.value.role.role === 'spv')

const searchQuery = ref('')
const salesPersonId = computed(() => user.value.sales_person.filter((sp: any) => sp.CompanyId ==='SPS'))
const debouncedQuery = useDebounce(searchQuery, 400)
const router = useRouter()
const showFilters = ref(false)
const loadingSalesPersonsOptions = ref(true)

const filters = ref<Partial<Filters>>({
  sales_person_id: null,
  customer_id: null,
  status: null
})

const STATUS = {
  ASSIGNED: 'assigned',
  ONGOING: 'ongoing',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  MISSED: 'misssed',
  DRAFT: 'draft'
}

const headers = computed(() => {
  const headers = [
    { title: 'Actions', key: 'actions', sortable: false },
    { title: 'Schedule', key: 'scheduled_date', sortable: true },
    { title: 'Assignee', key: 'assigned_to', sortable: true },
    { title: 'Customer', key: 'customer', sortable: true },
    { title: 'Type', key: 'activity', sortable: true },
    { title: 'Note', key: 'notes', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
  ]
  return headers
})

activityStore.$reset()

onMounted(async () => {
  if (isAdmin.value) {
    await activityStore.initialize()
  } else if(isSpv.value) {
    await activityStore.initialize(undefined, user.value.team_id)
  } else {
    await activityStore.initialize(salesPersonId.value.id)
  } 
})

watch(showFilters, (val) => {
  if (val) {
    activityStore.fetchSalesPersonOptions()
  }
})

watch(activityStore, (val) => {
  if(val.salesPersonsOptions.length > 0) loadingSalesPersonsOptions.value = false
})

watch(debouncedQuery, (val) => {
  activityStore.updateFilters({ search: val })
})

watch(
  filters,
  (newVal) => {
    activityStore.updateFilters({ ...newVal})
  },
  { deep: true }
)
const getStatus = (status: string) => {
    switch (status) {
      case STATUS.ASSIGNED:
        return {color: 'warning', content: 'Assigned'}
      case STATUS.ONGOING:
        return {color: 'primary', content: 'Ongoing'}
      case STATUS.SUBMITTED:
        return {color: 'success', content: 'Submitted'}
      case STATUS.COMPLETED:
        return {color: 'success', content: 'Completed'}
      case STATUS.CANCELLED:
        return {color: 'error', content: 'Cancelled'}
      case STATUS.MISSED:
        return {color: 'error', content: 'Missed'}
      case STATUS.DRAFT:
        return {color: 'warning', content: 'Draft'}
    }
}


const handleClickViewReport = (id: number) => {
  router.push({ path: createUrl(`/activity/${id}/view-report`).value })
}

const handleClickEdit = (id: number) => {
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}

const handleCheckIn = async(id: number) => {
  await activityStore.updateActivityStatus(id, STATUS.ONGOING)
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}
</script>

<template>
  <VBreadcrumbs
    class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
    :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Activities'}]"
    >
    <template v-slot:prepend>
      <v-icon icon='tabler-home' size="small"></v-icon>
    </template>
  </VBreadcrumbs>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCheckbox v-model="showFilters" label="Show Filters"></VCheckbox>
    </VCardItem>
    <VCardText v-if="showFilters">
      <VRow>
        <VCol 
          v-if="isAdmin"
          cols="12"
          sm="4"
        >
          <AppCombobox 
            v-model="filters.sales_person_id"
            :disabled="loadingSalesPersonsOptions"
            :loading="loadingSalesPersonsOptions"          
            placeholder="Filter by sales person" 
            :items="activityStore.salesPersonsOptions" 
            clearable 
            clear-icon="tabler-x"
            :return-object="false"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </VCol>
        <VCol 
          v-if="isAdmin"
          cols="12"
          sm="4"
        >
          <AppCombobox 
            v-model="filters.customer_id"
            placeholder="Filter by Customer" 
            :items="activityStore.customerOptions"
            clearable 
            clear-icon="tabler-x"
            :return-object="false"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </VCol>
        <VCol cols="12" sm="4">
          <AppCombobox 
            v-model="filters.status"
            :disabled="activityStore.loading"
            placeholder="Filter by status" 
            :items="[
              { title: 'Assigned', value: 'assigned' },
              { title: 'On Going', value: 'ongoing' },
              { title: 'Submitted', value: 'submitted' },
              { title: 'Completed', value: 'completed' },
              { title: 'Cancelled', value: 'cancelled' },
              { title: 'Draft', value: 'draft' },
              { title: 'Overdue', value: 'misssed' },
            ]"
            clearable 
            clear-icon="tabler-x"
            :return-object="false"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />          
        </VCol>
        <VCol cols="12" sm="4">
          <AppDateTimePicker
            v-model="activityStore.filters.start_date"
            placeholder="Select start date"
            clearable
            clear-icon="tabler-x"
            @update:model-value="val => val && activityStore.updateFilters({ start_date: val })"           
          />
        </VCol>
         <VCol cols="12" sm="4">
          <AppDateTimePicker            
            v-model="activityStore.filters.end_date"
            placeholder="Select end date"
            clearable
            clear-icon="tabler-x"
            @update:model-value="val => val && activityStore.updateFilters({ end_date: val })"
          />
        </VCol>
      </VRow>
    </VCardText>
    <VDivider />
    
    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <AppSelect
          :model-value="activityStore.filters.per_page" 
          :items="PAGINATION_ITEMS" style="inline-size: 6.25rem;"
          @update:model-value="activityStore.setPerpage(parseInt($event, 10))" 
        />
      </div>
      <VSpacer />
        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <div style="inline-size: 15.625rem;">
            <AppTextField v-model="searchQuery" placeholder="Search ..." clearable clear-icon="tabler-x" />
          </div>
          <!-- <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
            Export
          </VBtn> -->
        </div>
    </VCardText>
    <VDivider />
    <VDataTableServer 
      :loading="activityStore.loadingList" 
      v-model:items-per-page="activityStore.filters.per_page"
      v-model:model-value="activityStore.selectedRows"
      v-model:page="activityStore.filters.page"
      :items="activityStore.activities"
      :items-length="activityStore.pagination.total"
      :headers="headers" class="text-no-wrap" 
      return-object
      :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
      @update:options="activityStore.updateSortOptions" 
      @update:model-value="activityStore.setSelectedRows"
      multi-sort
    >
      <template #item.actions="{ item }">        
        <div class="d-flex justify-center gap-x-4" v-if="item.status === STATUS.ASSIGNED && !isAdmin">     
          <VBtn 
            v-if="item.assigned_to.id === user.id"
            :key="item.id" 
            :loading="activityStore.loadingId === item.id" 
            @click="handleCheckIn(item.id)" 
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-play"
          >
            Start
          </VBtn>
        </div>
         <div class="d-flex justify-between gap-x-4" v-else-if="item.status === STATUS.COMPLETED">
          <VBtn 
            :key="item.id" 
            :loading="activityStore.loadingId === item.id" 
            @click="handleClickViewReport(item.id)" 
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-notes"
            >
            View
          </VBtn>         
        </div>
        <div class="d-flex justify-between gap-x-4" v-else-if="item.status === STATUS.DRAFT || item.status === STATUS.ONGOING && !isAdmin">
          <VBtn
            v-if="!isAdmin && item.assigned_to.id === user.id"
            :key="item.id" 
            :loading="activityStore.loadingId === item.id" 
            @click="handleClickEdit(item.id)"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-edit"
            >
            Edit
          </VBtn>
        </div>
      </template>
      <template #item.scheduled_date="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              {{ formatDate(item.scheduled_date) }}
            </div>
          </div>
        </div>
      </template>
      <template #item.assigned_to="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              {{ item.assigned_to.name }}
            </div>
          </div>
        </div>
      </template>
      <template #item.customer="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm" v-for="customer in item.customers" :key="customer.id">
              {{ `${customer.CardName} - ${customer.CompanyId}`   }}
            </div>
          </div>
        </div>
      </template>
      <template #item.activity="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              {{ item.activity.name }}
            </div>
          </div>
        </div>
      </template>
      <template #item.status="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              <VBadge 
                :color="getStatus(item.status)?.color"
                size="small"                
                :content="getStatus(item.status)?.content" 
              />
            </div>
          </div>
        </div>
      </template>      
    </VDataTableServer>
  </VCard>  
</template>
