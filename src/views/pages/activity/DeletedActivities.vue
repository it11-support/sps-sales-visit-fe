<script lang="ts" setup>
import { Filters, useActivityStore } from '@/@core/stores';
import { IActivity } from '@/@core/typedefs';
import { getLocalStoreKey } from './functions';

const activityStore = useActivityStore()
const user = useCookie<any>('userData')
const isAdmin = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'admin'
  } else {
    return false
  }
})

const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 400)
// const loadingSalesPersonsOptions = ref(true)
const showScheduleForm = ref(false)
const showRestoreModal = ref(false)
const showDeleteModal = ref(false)
const selectedActivity = ref({} as IActivity | null)

const localKey = getLocalStoreKey(user.value.id)
const savedFilters = localStorage.getItem(localKey)
const parsedFilters = savedFilters
  ? JSON.parse(savedFilters)
  : {}


const showFilters = ref(savedFilters ? JSON.parse(savedFilters).showFilters : false)
const { 
  filters,
  activities,
  updateFilters,
  pagination,
  mutate,
  loadingList,
  salesPersonOptions,
  isSalesPersonLoading,
  customerOptions
} = useActivities(
  localKey,
  parsedFilters as Partial<Filters>, 
  {deleted: true}
)

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

// activityStore.$reset()

const loadActivity = async () => {
  if(user.value && !isAdmin.value) {
    activityStore.filters.assigned_to = user.value.id
  }
  activityStore.filters.deleted = true
  await activityStore.initialize()
}

onMounted(loadActivity)

/* ================= WATCH ================= */


watch(debouncedQuery, val => {
  updateFilters({ search: val })
})

watch(showFilters, (val) => {
  const parsed = JSON.parse(
    localStorage.getItem(localKey) || '{}',
  )

  parsed.showFilters = val

  localStorage.setItem(localKey, JSON.stringify(parsed))

  if (!val) {
    updateFilters({
      search: "",
      sales_person_id: null,
      customer_id: null,
      per_page: 10,
      page: 1,
      sort_options: [],
      status: null,
      start_date: "",
      end_date: "",
    })
  }
})

/* ================= STATUS BADGE ================= */
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

const form = ref({
  id: null as number | null,
  scheduled_date: null as Date | null,
  notes: '',
})


const handleRestore = async(id: number) => {
  await activityStore.restoreActivity(id).then(() => {
    showRestoreModal.value = false
  })
  await mutate()
}

const handleDelete = async(id: number) => {
  await activityStore.deleteActivity(id, true).then(() => {
    showDeleteModal.value = false
  })
  await mutate()
}

const handelUpdateActivity = async () => {
  await activityStore.updateActivity(form.value)
  await nextTick()
  showScheduleForm.value = false
} 

</script>
<template>
  <VBreadcrumbs
    class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
    :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Deleted Activities'}]"
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
          :disabled="isSalesPersonLoading"
          :loading="isSalesPersonLoading"          
          placeholder="Filter by sales person" 
          :items="salesPersonOptions" 
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
            :items="customerOptions"
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
            v-model="filters.start_date"
            placeholder="Select start date"
            clearable
            clear-icon="tabler-x"
            @update:model-value="val => val && updateFilters({ start_date: val })"           
          />
        </VCol>
         <VCol cols="12" sm="4">
          <AppDateTimePicker            
            v-model="filters.end_date"
            placeholder="Select end date"
            clearable
            clear-icon="tabler-x"
            @update:model-value="val => val && updateFilters({ end_date: val })"
          />
        </VCol>
      </VRow>
    </VCardText>
    <VDivider />
    
    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <AppSelect
          :model-value="filters.per_page"
          :items="PAGINATION_ITEMS" style="inline-size: 6.25rem;"
          @update:model-value="updateFilters({ per_page: parseInt($event, 10), page: 1 })" 
        />
      </div>
      <VSpacer />
        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <div style="inline-size: 15.625rem;">
            <AppTextField v-model="filters.search" placeholder="Search ..." clearable clear-icon="tabler-x" />
          </div>
          <!-- <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
            Export
          </VBtn> -->
        </div>
    </VCardText>
    <VDivider />
    <VDataTableServer 
      :loading="loadingList" 
      v-model:items-per-page="filters.per_page"
      v-model:model-value="activityStore.selectedRows"
      v-model:page="filters.page"
      :items="activities"
      :items-length="pagination.total"
      :headers="headers" class="text-no-wrap" 
      return-object
      :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
      @update:options="updateFilters({ sort_options: $event.sortBy })" 
      @update:model-value="activityStore.setSelectedRows"
      multi-sort
    >
      <template #item.actions="{ item }">
      <div class="d-flex justify-center gap-x-2">

         <VBtn
          v-if="isAdmin || item.assigned_to.id === user.id"
          :key="`restore-${item.id}`"
          :loading="activityStore.loadingId === item.id"
          @click="() => { showDeleteModal = true; selectedActivity = item }"
          size="small"
          variant="tonal"
          color="error"
          prepend-icon="tabler-trash"
        >
          Delete Permanently
        </VBtn>

        <!-- ✅ DELETE: selalu tampil jika admin -->
        <VBtn
          v-if="isAdmin || item.assigned_to.id === user.id"
          :key="`restore-${item.id}`"
          :loading="activityStore.loadingId === item.id"
          @click="() => { showRestoreModal = true; selectedActivity = item }"
          size="small"
          variant="tonal"
          color="success"
          prepend-icon="tabler-restore"
        >
          Restore
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
 <VDialog v-model="showScheduleForm" width="450">

  <DialogCloseBtn @click="showScheduleForm = false" />

  <VCard class="pa-4">

    <VCardTitle>Edit Schedule</VCardTitle>

    <VCardText>

      <VForm @submit.prevent="handelUpdateActivity">

        <VRow>
          <!-- DATE -->
          <VCol cols="12">
            <AppDateTimePicker
              v-model="form.scheduled_date"
              label="Visit Date"
              clearable
            />
          </VCol>
          <!-- NOTES -->
          <VCol cols="12">
            <AppTextarea
              v-model="form.notes"
              label="Notes"
              rows="3"
            />
          </VCol>
          <!-- BUTTON -->
          <VCol cols="12" class="text-right">
            <VBtn
              color="primary"
              type="submit"
              :loading="activityStore.loadingId === form.id"
            >
              Save
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</VDialog>

 <VDialog v-model="showRestoreModal" width="450">

  <DialogCloseBtn @click="() => {showRestoreModal = false; selectedActivity = null}" />

  <VCard class="pa-4">

    <VCardTitle>Restore Activity</VCardTitle>

    <VCardText>
      <p>Are you sure you want to restore this activity?</p>
    </VCardText>

   <VCardActions>
    <VBtn color="error" @click="showRestoreModal = false"><VIcon icon="tabler-x" class="mr-2"/>Cancel</VBtn>
    <VBtn color="success" v-if="selectedActivity != null" @click="handleRestore(selectedActivity?.id)" ><VIcon icon="tabler-restore" class="mr-2"/> Restore</VBtn>
    <VSpacer />
  </VCardActions>
  </VCard>
</VDialog>

<VDialog v-model="showDeleteModal" width="450">

  <DialogCloseBtn @click="() => {showDeleteModal = false; selectedActivity = null}" />

  <VCard class="pa-4">

    <VCardTitle>Permanently Delete</VCardTitle>

    <VCardText>
      <p>Are you sure you want to delete this activity?</p>
    </VCardText>

   <VCardActions>
    <VBtn color="error" @click="showDeleteModal = false"><VIcon icon="tabler-x" class="mr-2"/>Cancel</VBtn>
    <VBtn color="warning" v-if="selectedActivity != null" @click="handleDelete(selectedActivity?.id)" ><VIcon icon="tabler-trash" class="mr-2"/> Delete</VBtn>
    <VSpacer />
  </VCardActions>
  </VCard>
</VDialog>

</template>
