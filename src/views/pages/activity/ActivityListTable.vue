<script lang="ts" setup>
import { Filters, useActivityStore, useAuthStore, useCustomerStore } from '@/@core/stores';
import { IActivity } from '@/@core/typedefs';
import dayjs from 'dayjs';
import { getLocalStoreKey, updateFilter } from './functions';

const activityStore = useActivityStore()
const customerStore = useCustomerStore()
const authStore = useAuthStore()
const user = useCookie<any>('userData')
const roleName = computed(() => user.value?.role?.role)
const userTeamId = computed(() => user.value?.team_id ? Number(user.value.team_id) : undefined)
const isAdmin = computed(() => {
  if(roleName.value){
    return roleName.value === 'admin'
  } else {
    return false
  }
})
const isSpv = computed(() => {
  if(roleName.value){
    return roleName.value === 'spv'
  } else {
    return false
  }
})
const canFilterSalesPerson = computed(() => isAdmin.value || !!activityTeamScopeId.value)
const activityTeamScopeId = computed(() => {
  return userTeamId.value
})

const searchQuery = ref('')
const salesPersonId = computed(() => user.value?.sales_person?.filter((sp: any) => sp.CompanyId ==='SPS')[0])
const debouncedQuery = useDebounce(searchQuery, 400)
const router = useRouter()
const showFilters = ref(false)
const loadingSalesPersonsOptions = ref(true)
const showScheduleForm = ref(false)
const showDeleteModal = ref(false)
const activityToDelete = ref({} as IActivity | null)
const useSPS = ref(false)
const useBBS = ref(false)
const loadingEditableUntilId = ref<number | null>(null)
const viewMenuItems = [
  { title: 'Open', value: 'open', link: true, prependIcon: 'tabler-eye' },
  { title: 'Open in New Tab', value: 'open_new_tab', link: true, prependIcon: 'tabler-external-link' }
]

const showWarningDialog = ref(false)

const selectedSPS = computed<number | null>({
  get() {
    return form.value.customers.find(id =>
      customerStore.customerOptions.some(
        o => o.companyId === 'SPS' && o.value === id
      )
    ) ?? null
  },

  set(val) {
    // hapus SPS lama
    form.value.customers = form.value.customers.filter(id =>
      !customerStore.customerOptions.some(
        o => o.companyId === 'SPS' && o.value === id
      )
    )

    // tambah baru
    if (val !== null) {
      form.value.customers.push(val)
    }
  },
})

const selectedBBS = computed<number | null>({
  get() {
    return form.value.customers.find(id =>
      customerStore.customerOptions.some(
        o => o.companyId === 'BBS' && o.value === id
      )
    ) ?? null
  },

  set(val) {
    form.value.customers = form.value.customers.filter(id =>
      !customerStore.customerOptions.some(
        o => o.companyId === 'BBS' && o.value === id
      )
    )

    if (val !== null) {
      form.value.customers.push(val)
    }
  },
})

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
    { title: 'Editable', key: 'editable', sortable: false },
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

const tableHeaders = computed(() => {
  if (isAdmin.value) return headers.value
  return headers.value.filter(item => item.key !== 'editable')
})

const localKey = getLocalStoreKey(user.value.id)

activityStore.$reset()

const loadActivity = async () => {

  const savedFilters = localStorage.getItem(localKey)
  if (savedFilters) {
    const parsedFilters = JSON.parse(savedFilters)
    activityStore.filters = {
      ...activityStore.filters,
      ...parsedFilters
    }
    showFilters.value = parsedFilters.showFilters
    searchQuery.value = parsedFilters.search
    filters.value = {
      ...filters.value,
      sales_person_id: parsedFilters.sales_person_id,
      customer_id: parsedFilters.customer_id,
      status: parsedFilters.status
    }

  }

  const shouldScopeToOwnActivities = !isAdmin.value && !activityTeamScopeId.value
  const scopeFilters: Partial<Filters> = {
    team_id: activityTeamScopeId.value,
    assigned_to: shouldScopeToOwnActivities ? user.value.id : undefined,
  }

  if (!canFilterSalesPerson.value) {
    filters.value.sales_person_id = null
    scopeFilters.sales_person_id = null
    updateFilter(localKey, { sales_person_id: null })
  }

  await activityStore.updateFilters(scopeFilters, false)

  await activityStore.fetchSalesPersonOptions(canFilterSalesPerson.value ? activityTeamScopeId.value : undefined)
  loadingSalesPersonsOptions.value = false
  if (
    canFilterSalesPerson.value
    && filters.value.sales_person_id
    && !activityStore.salesPersonsOptions.some(option => Number(option.value) === Number(filters.value.sales_person_id))
  ) {
    filters.value.sales_person_id = null
    activityStore.filters.sales_person_id = null
    updateFilter(localKey, { sales_person_id: null })
  }
  await activityStore.initialize(undefined, activityTeamScopeId.value)
  await activityStore.fetchActivityTypes()
}

onMounted(loadActivity)

watch(filters.value, val => {
  if (val)
    customerStore.fetchCustomerOptions(null, val.sales_person_id?.toString())
})

watch(
  () => activityStore.filters, 
  (val) => {
    updateFilter(localKey, val)
  }, {deep: true}
)


watch(
  () => showFilters.value, 
  (val) => {
    if(!val){
       filters.value = {
         sales_person_id: null,
         customer_id: null,
         status: null
       }
       searchQuery.value = ''
       updateFilter(localKey, {sales_person_id: null, customer_id: null, status: null, search: ''})
    }
    updateFilter(localKey, {showFilters: val})
  }, {deep: true}
)

watch(useSPS, (val) => {
  if (!val) {
    selectedSPS.value = null
  }
})

watch(useBBS, (val) => {
  if (!val) {
    selectedBBS.value = null
  }
})

/* ================= WATCH ================= */
watch(activityStore, val => {
  if (val.salesPersonsOptions.length > 0)
    loadingSalesPersonsOptions.value = false
})

watch(debouncedQuery, val => {
  activityStore.updateFilters({ search: val })
})

watch(
  filters,
  newVal => {
    activityStore.updateFilters({ ...newVal })
  },
  { deep: true }
)

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
  customers: [] as number[],
  activity_type_id: null as number | null,
  notes: '',
})

const disableSPS = computed(() => {
  return useSPS.value && !useBBS.value
})

const disableBBS = computed(() => {
  return useBBS.value && !useSPS.value
})


const setFormValue = (data: IActivity) => {
  let date: Date | null = null

  if (data.scheduled_date) {
    const d = new Date(data.scheduled_date)

    if (!isNaN(d.getTime())) {
      date = d
    }
  }

  // Cari customer aman
  const sps = data.customers?.find(
    (c: any) => c.CompanyId === 'SPS'
  )

  const bbs = data.customers?.find(
    (c: any) => c.CompanyId === 'BBS'
  )

  const customerSps = sps ? sps.id : null
  const customerBbs = bbs ? bbs.id : null

  const customers = data.customers?.map((c: any) => c.id) ?? []

  // Set form
  form.value = {
    id: data.id,
    customers,
    scheduled_date: date,
    activity_type_id: data.activity_type_id,
    notes: data.notes ?? '',
  }

  useSPS.value = !!customerSps
  useBBS.value = !!customerBbs
}


watch([selectedSPS, selectedBBS], ([sps, bbs]) => {
  const result: number[] = []

  if (sps) result.push(sps)
  if (bbs) result.push(bbs)

  form.value.customers = result
})

const handleMenu = (item: any, { value }: any) => {

  const url = createUrl(`/activity/${item.id}/view-report`).value

  const actions: Record<string, Function> = {
    open: () => router.push({ path: url }),
    open_new_tab: () => window.open(url, '_blank')
  }

  actions[value]?.()
}

const handleClickEdit = (id: number) => {
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}

const handleClickEditReport = async(id: number) => {
  await activityStore.updateActivityStatus(id, STATUS.DRAFT, true)
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}
const verifyAndCheckIn = async(itemId: number) => {
  await activityStore.checkActiveVisit(itemId)
  
  if (activityStore.hasActiveVisit) {
    showWarningDialog.value = true
  } else {
    handleCheckIn(itemId)
  }
}
const handleCheckIn = async(id: number) => {
  await activityStore.updateActivityStatus(id, STATUS.ONGOING)
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}

const handleDelete = async(id: number) => {
  await activityStore.deleteActivity(id).then(() => {
    showDeleteModal.value = false
  })
}

const handelUpdateActivity = async () => {
  await activityStore.updateActivity(form.value)
  await nextTick()
  showScheduleForm.value = false
} 
const handleEdit = async (item: IActivity) => {
  setFormValue(item)
  await customerStore.fetchCustomerOptions(null, salesPersonId.value.id)
  await nextTick()

  showScheduleForm.value = true
}

const handleExportReport = async(id: string, customer: string, date?: string) => {
  activityStore.exportReport(id, customer, date)
}

const handleUpdateEditable = async (item: IActivity, value: boolean) => {
  loadingEditableUntilId.value = item.id
  const editableUntil = value
    ? dayjs().add(24, 'hour').format('YYYY-MM-DD HH:mm:ss')
    : null

  const isUpdated = await activityStore.updateEditableUntil(item.id, editableUntil)
  if (isUpdated) {
    item.editable = value
    item.editable_until = editableUntil ?? undefined
  }
  loadingEditableUntilId.value = null
}

const updateSelectedType = (val: number) => {
 form.value.activity_type_id = val
}

 const handleSheetClick = async(visitId: number) => {
  showWarningDialog.value = false      
  handleClickEdit(visitId)
}

const customFilter = (item: any, queryText: string, itemText: string) => {
  const text = itemText?.toLowerCase() || ''
  const search = queryText?.toLowerCase() || ''
  return text.includes(search)
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
      <VCol v-if="canFilterSalesPerson" cols="12" sm="4" md="4" lg="4" class="pl-0">
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
    </VCardItem>
    <VCardText v-if="showFilters">
      <VRow>
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
            :filter="customFilter"
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
      :headers="tableHeaders" class="text-no-wrap" 
      return-object
      :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
      @update:options="activityStore.updateSortOptions" 
      @update:model-value="activityStore.setSelectedRows"
      multi-sort
    >
    <template #item.editable="{ item }">
      <div class="d-flex justify-center align-center gap-x-2">
        <VCheckbox
          :loading="loadingEditableUntilId === item.id"
          :model-value="item.editable"
          label=""
          :disabled="item.status !== 'completed' || loadingEditableUntilId === item.id"
          @update:model-value="val => handleUpdateEditable(item, !!val)"
        />
      </div>
    </template>
      <template #item.actions="{ item }">
      <div class="d-flex justify-start gap-x-2">

        <!-- ✅ DELETE: selalu tampil jika admin -->
        <VBtn
          v-if="isAdmin || item.assigned_to.id === user.id"
          :key="`delete-${item.id}`"
          :loading="activityStore.loadingId === item.id"
          @click="() => { showDeleteModal = true; activityToDelete = item }"
          size="small"
          variant="tonal"
          color="warning"
          prepend-icon="tabler-trash"
        >
          Delete
        </VBtn>

        <!-- ASSIGNED -->
        <template v-if="item.status === STATUS.ASSIGNED && !isAdmin">
          <VBtn
            v-if="item.assigned_to.id === user.id"
            :key="item.id"
            :loading="activityStore.loadingId === item.id"
            @click="verifyAndCheckIn(item.id)"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-play"
          >
            Start
          </VBtn>

          <VBtn
            v-if="item.assigned_to.id === user.id && item.status !== STATUS.ONGOING"
            :key="`edit-${item.id}`"
            @click="handleEdit(item)"
            size="small"
            variant="tonal"
            color="warning"
            prepend-icon="tabler-edit"
          >
            Edit Schedule
          </VBtn>
        </template>

        <!-- COMPLETED -->
        <template v-else-if="item.status === STATUS.COMPLETED">
          <VBtn
            v-if="item.assigned_to.id === user.id && item.editable"
            :key="`re-edit-${item.id}`"          
            @click="handleClickEditReport(item.id)"
            size="small"
            variant="tonal"
            color="warning"
            prepend-icon="tabler-edit"
          >
            Edit
          </VBtn>
          <VMenu
            :key="`menu-view-${item.id}`"
          >
            <template #activator="{ props }">
              <VBtn         
                v-bind="props"
                size="small"
                variant="tonal"
                color="primary"
              >
              View
              </VBtn>
            </template>
            <VList>
            <VListItem
              class="text-sm"
              v-for="menu in viewMenuItems"
              :key="menu.value"
              @click="handleMenu(item, menu)"
            >
              <template #prepend>
                <VIcon :icon="menu.prependIcon" />
              </template>
              <VListItemTitle>{{ menu.title }}</VListItemTitle>
            </VListItem>
          </VList>
          </VMenu>
          <VBtn
            color="success"
            size="small"
            :loading="activityStore.loadingReport === `loading${item.id}`"
            prepend-icon="tabler-file-export"
            @click="handleExportReport(
              item.id.toString(),
              item.customers[0].CardName,
              item.check_in
            )"
          >
            Export
          </VBtn>          
        </template>

        <!-- DRAFT / ONGOING -->
        <template v-else-if="(item.status === STATUS.DRAFT || item.status === STATUS.ONGOING) && !isAdmin">
          <VBtn
            v-if="item.assigned_to.id === user.id"
            :key="`continue-${item.id}`"
            :loading="activityStore.loadingId === item.id"
            @click="handleClickEdit(item.id)"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-edit"
          >
            Continue
          </VBtn>
        </template>

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
          <VCol cols="12">
            <AppSelect
              v-model="form.activity_type_id"           
              placeholder="Select Activity Type"
              :items="activityStore.activityTypes"
              clearable
              clear-icon="tabler-x"
              @update:model-value="updateSelectedType"
            />
          </VCol>
        <VCol cols="12">
          <VCheckbox
            v-model="useSPS"
            label="SPS Customer"
            :disabled="disableSPS"
          /> 
        </VCol>
        <VCol cols="12" v-if="useSPS">
          <AppAutocomplete
            autocomplete="off"
            v-model="selectedSPS"
            :items="customerStore.customerOptions.filter(cs => cs.companyId === COMPANIES.SPS)"
            placeholder="Select SPS Customer"
            clearable
            clear-icon="tabler-x"
          />
        </VCol>
         <VCol cols="12">
          <VCheckbox
            v-model="useBBS"
            label="BBS Customer"
            :disabled="disableBBS"
          /> 
        </VCol>

        <VCol cols="12" v-if="useBBS">
          <AppAutocomplete
            autocomplete="off"
            v-model="selectedBBS"
            :items="customerStore.customerOptions.filter(cs => cs.companyId === COMPANIES.BBS)"
            placeholder="Select BBS Customer"
            clearable
            clear-icon="tabler-x"
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

 <VDialog v-model="showDeleteModal" width="450">

  <DialogCloseBtn @click="() => {showDeleteModal = false; activityToDelete = null}" />

  <VCard class="pa-4">

    <VCardTitle>Delete Activity</VCardTitle>

    <VCardText>
      <p>Are you sure you want to delete this activity?</p>
    </VCardText>

   <VCardActions>
    <VBtn @click="showDeleteModal = false">Cancel</VBtn>
    <VBtn color="error" v-if="activityToDelete != null" @click="handleDelete(activityToDelete?.id)">Delete</VBtn>
    <VSpacer />
  </VCardActions>
  </VCard>
</VDialog>

<VDialog v-model="showWarningDialog" max-width="400">
  <VCard>
    <VCardTitle class="text-h6 font-weight-bold pt-4 px-6 text-warning">
      <VIcon icon="tabler-alert-triangle" class="me-2" color="warning" />
      Active Visit Detected
    </VCardTitle>
    

    <VCardText class="px-6 text-body-1">
    <p class="mb-4">Please finish the active visit before creating a new one.</p>
  
      <VSheet 
        v-for="visit in activityStore.activeVisit" 
        :key="visit.id"
        color="amber-lighten-5" 
        class="pa-3 rounded border-s-4 border-warning text-body-2 mb-2 cursor-pointer elevation-1"
        @click="handleSheetClick(visit.id)"
      >
        <div class="d-flex justify-between align-center mb-1">
          <div>
            <strong>Visit ID:</strong> #{{ visit.id }}
          </div>
          <!-- Ikon petunjuk bawaan Vuetify/Tabler agar user tahu ini bisa diklik -->
          <VIcon icon="tabler-chevron-right" size="18" color="warning" />
        </div>
        
        <div class="d-flex align-center">
          <strong>Status:</strong> 
          <VChip 
            size="x-small" 
            :color="visit.status === 'ongoing' ? 'success' : 'warning'" 
            class="text-uppercase ms-2 font-weight-bold"
          >
            {{ visit.status }}
          </VChip>
        </div>
      </VSheet>
    </VCardText>
    
    <VCardActions class="pb-4 px-6">
      <VSpacer />
      <VBtn color="warning" outlined variant="text" @click="showWarningDialog = false">
        OK
      </VBtn>
    </VCardActions>
  </VCard>
</VDialog>

</template>

<style lang="scss">
.v-list-item-title {
  font-size: small;
}

.v-list-item .v-list-item__prepend .v-icon {
  font-size: 1.25rem !important;
}
</style>
