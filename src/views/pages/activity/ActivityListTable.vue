<script lang="ts" setup>
import { Filters, useActivityStore, useCustomerStore } from '@/@core/stores';
import { IActivity } from '@/@core/typedefs';
import dayjs from 'dayjs';
import { getLocalStoreKey } from './functions';

const activityStore = useActivityStore()
const customerStore = useCustomerStore()

const user = useCookie<any>('userData')

  const isAdmin = computed(() => {
  if (user.value.role) {
    return user.value.role.role === 'admin'
  } else {
    return false
  }
})

const searchQuery = ref('')
const salesPersonId = computed(() => user.value.sales_person.filter((sp: any) => sp.CompanyId === 'SPS')[0])
const debouncedQuery = useDebounce(searchQuery, 400)
const router = useRouter()
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
const localKey = getLocalStoreKey(user.value.id)
const savedFilters = localStorage.getItem(localKey)

const parsedFilters = savedFilters
  ? JSON.parse(savedFilters)
  : {}

delete parsedFilters.deleted


const showFilters = ref(savedFilters ? JSON.parse(savedFilters).showFilters : false)
const { 
  filters,
  activities,
  updateFilters,
  pagination,
  mutate,
  loadingList,
  customerOptions,
  salesPersonOptions,
  isSalesPersonLoading,
  activityTypes
} = useActivities(
  localKey,
  parsedFilters as Partial<Filters>, 
  {deleted: false}
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

const loadActivity = async () => {
  await activityStore.initialize()
}

onMounted(loadActivity)

watch(filters.value, val => {
  if (val)
    customerStore.fetchCustomerOptions(null, val.sales_person_id?.toString())
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
  updateFilters({ search: val })
})


/* ================= STATUS BADGE ================= */
const getStatus = (status: string) => {
  switch (status) {
    case STATUS.ASSIGNED:
      return { color: 'warning', content: 'Assigned' }
    case STATUS.ONGOING:
      return { color: 'primary', content: 'Ongoing' }
    case STATUS.SUBMITTED:
      return { color: 'success', content: 'Submitted' }
    case STATUS.COMPLETED:
      return { color: 'success', content: 'Completed' }
    case STATUS.CANCELLED:
      return { color: 'error', content: 'Cancelled' }
    case STATUS.MISSED:
      return { color: 'error', content: 'Missed' }
    case STATUS.DRAFT:
      return { color: 'warning', content: 'Draft' }
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

const handleClickEditReport = async (id: number) => {
  await activityStore.updateActivityStatus(id, STATUS.DRAFT, true)
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}
const handleCheckIn = async (id: number) => {
  await activityStore.updateActivityStatus(id, STATUS.ONGOING)
  router.push({ path: createUrl(`/activity/${id}/report`).value })
}

const handleDelete = async (id: number) => {
  await activityStore.deleteActivity(id).then(() => {
    showDeleteModal.value = false
  })
  await mutate()
}

const handelUpdateActivity = async () => {
  await activityStore.updateActivity(form.value)
  await nextTick()
  showScheduleForm.value = false
  await mutate()
}
const handleEdit = async (item: IActivity) => {
  setFormValue(item)
  await customerStore.fetchCustomerOptions(null, salesPersonId.value.id)
  await nextTick()

  showScheduleForm.value = true
}

const handleExportReport = async (id: string, customer: string, date?: string) => {
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
  await mutate()
}

const updateSelectedType = (val: number) => {
  form.value.activity_type_id = val
}

const customFilter = (item: any, queryText: string, itemText: string) => {
  const text = itemText?.toLowerCase() || ''
  const search = queryText?.toLowerCase() || ''
  return text.includes(search)
}
</script>
<template>
  <VBreadcrumbs class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
    :items="[{ title: 'Home', to: '/', class: 'text-primary' }, { title: 'Activities' }]">
    <template v-slot:prepend>
      <v-icon icon='tabler-home' size="small"></v-icon>
    </template>
  </VBreadcrumbs>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCheckbox v-model="showFilters" label="Show Filters"></VCheckbox>
      <VCol cols="12" sm="4" md="4" lg="4" class="pl-0">
        <AppCombobox v-model="filters.sales_person_id" :disabled="isSalesPersonLoading"
          :loading="isSalesPersonLoading" placeholder="Filter by sales person"
          :items="salesPersonOptions" clearable clear-icon="tabler-x" :return-object="false"
          autocomplete="off" autocorrect="off" spellcheck="false" />
      </VCol>
    </VCardItem>
    <VCardText v-if="showFilters">
      <VRow>
        <VCol v-if="isAdmin" cols="12" sm="4">
          <AppCombobox v-model="filters.customer_id" placeholder="Filter by Customer"
            :items="customerOptions" clearable clear-icon="tabler-x" :return-object="false"
            autocomplete="off" autocorrect="off" :filter="customFilter" spellcheck="false" />
        </VCol>
        <VCol cols="12" sm="4">
          <AppCombobox v-model="filters.status" :disabled="activityStore.loading" placeholder="Filter by status" :items="[
            { title: 'Assigned', value: 'assigned' },
            { title: 'On Going', value: 'ongoing' },
            { title: 'Submitted', value: 'submitted' },
            { title: 'Completed', value: 'completed' },
            { title: 'Cancelled', value: 'cancelled' },
            { title: 'Draft', value: 'draft' },
            { title: 'Overdue', value: 'misssed' },
          ]" clearable clear-icon="tabler-x" :return-object="false" autocomplete="off" autocorrect="off"
            spellcheck="false" />
        </VCol>
        <VCol cols="12" sm="4">
          <AppDateTimePicker v-model="filters.start_date" placeholder="Select start date" clearable
            clear-icon="tabler-x" @update:model-value="val => val && updateFilters({ start_date: val })" />
        </VCol>
        <VCol cols="12" sm="4">
          <AppDateTimePicker v-model="filters.end_date" placeholder="Select end date" clearable clear-icon="tabler-x"
            @update:model-value="val => val && updateFilters({ end_date: val })" />
        </VCol>
      </VRow>
    </VCardText>
    <VDivider />

    <VCardText class="d-flex flex-wrap gap-4">
      <div class="me-3 d-flex gap-3">
        <AppSelect :model-value="filters.per_page" :items="PAGINATION_ITEMS" style="inline-size: 6.25rem;"
          @update:model-value="updateFilters({ per_page: parseInt($event, 10), page: 1 })" />
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
    <VDataTableServer :loading="loadingList" v-model:items-per-page="filters.per_page"
      v-model:model-value="activityStore.selectedRows" v-model:page="filters.page" :items="activities"
      :items-length="pagination.total" :headers="tableHeaders" class="text-no-wrap" return-object
      :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
      @update:options="updateFilters({ sort_options: $event.sortBy })" @update:model-value="activityStore.setSelectedRows"
      multi-sort>
      <template #item.editable="{ item }">
        <div class="d-flex justify-center align-center gap-x-2">
          <VCheckbox :loading="loadingEditableUntilId === item.id" :model-value="item.editable" label=""
            :disabled="item.status !== 'completed' || loadingEditableUntilId === item.id"
            @update:model-value="val => handleUpdateEditable(item, !!val)" />
        </div>
      </template>
      <template #item.actions="{ item }">
        <div class="d-flex justify-start gap-x-2">

          <!-- ✅ DELETE: selalu tampil jika admin -->
          <VBtn v-if="isAdmin || item.assigned_to.id === user.id" :key="`delete-${item.id}`"
            :loading="activityStore.loadingId === item.id"
            @click="() => { showDeleteModal = true; activityToDelete = item }" size="small" variant="tonal"
            color="warning" prepend-icon="tabler-trash">
            Delete
          </VBtn>

          <!-- ASSIGNED -->
          <template v-if="item.status === STATUS.ASSIGNED && !isAdmin">
            <VBtn v-if="item.assigned_to.id === user.id" :key="item.id" :loading="activityStore.loadingId === item.id"
              @click="handleCheckIn(item.id)" size="small" variant="tonal" color="primary" prepend-icon="tabler-play">
              Start
            </VBtn>

            <VBtn v-if="item.assigned_to.id === user.id && item.status !== STATUS.ONGOING" :key="`edit-${item.id}`"
              @click="handleEdit(item)" size="small" variant="tonal" color="warning" prepend-icon="tabler-edit">
              Edit Schedule
            </VBtn>
          </template>

          <!-- COMPLETED -->
          <template v-else-if="item.status === STATUS.COMPLETED">
            <VBtn v-if="item.assigned_to.id === user.id && item.editable" :key="`re-edit-${item.id}`"
              @click="handleClickEditReport(item.id)" size="small" variant="tonal" color="warning"
              prepend-icon="tabler-edit">
              Edit
            </VBtn>
            <VMenu :key="`menu-view-${item.id}`">
              <template #activator="{ props }">
                <VBtn v-bind="props" size="small" variant="tonal" color="primary">
                  View
                </VBtn>
              </template>
              <VList>
                <VListItem class="text-sm" v-for="menu in viewMenuItems" :key="menu.value"
                  @click="handleMenu(item, menu)">
                  <template #prepend>
                    <VIcon :icon="menu.prependIcon" />
                  </template>
                  <VListItemTitle>{{ menu.title }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
            <VBtn color="success" size="small" :loading="activityStore.loadingReport === `loading${item.id}`"
              prepend-icon="tabler-file-export" @click="handleExportReport(
                item.id.toString(),
                item.customers[0].CardName,
                item.check_in
              )">
              Export
            </VBtn>
          </template>

          <!-- DRAFT / ONGOING -->
          <template v-else-if="(item.status === STATUS.DRAFT || item.status === STATUS.ONGOING) && !isAdmin">
            <VBtn v-if="item.assigned_to.id === user.id" :key="`continue-${item.id}`"
              :loading="activityStore.loadingId === item.id" @click="handleClickEdit(item.id)" size="small"
              variant="tonal" color="primary" prepend-icon="tabler-edit">
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
              {{ `${customer.CardName} - ${customer.CompanyId}` }}
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
              <VBadge :color="getStatus(item.status)?.color" size="small" :content="getStatus(item.status)?.content" />
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
              <AppDateTimePicker v-model="form.scheduled_date" label="Visit Date" clearable />
            </VCol>
            <!-- NOTES -->
            <VCol cols="12">
              <AppTextarea v-model="form.notes" label="Notes" rows="3" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="form.activity_type_id" placeholder="Select Activity Type"
                :items="activityTypes" clearable clear-icon="tabler-x"
                @update:model-value="updateSelectedType" />
            </VCol>
            <VCol cols="12">
              <VCheckbox v-model="useSPS" label="SPS Customer" :disabled="disableSPS" />
            </VCol>
            <VCol cols="12" v-if="useSPS">
              <AppAutocomplete autocomplete="off" v-model="selectedSPS"
                :items="customerStore.customerOptions.filter(cs => cs.companyId === COMPANIES.SPS)"
                placeholder="Select SPS Customer" clearable clear-icon="tabler-x" />
            </VCol>
            <VCol cols="12">
              <VCheckbox v-model="useBBS" label="BBS Customer" :disabled="disableBBS" />
            </VCol>

            <VCol cols="12" v-if="useBBS">
              <AppAutocomplete autocomplete="off" v-model="selectedBBS"
                :items="customerStore.customerOptions.filter(cs => cs.companyId === COMPANIES.BBS)"
                placeholder="Select BBS Customer" clearable clear-icon="tabler-x" />
            </VCol>
            <!-- BUTTON -->
            <VCol cols="12" class="text-right">
              <VBtn color="primary" type="submit" :loading="activityStore.loadingId === form.id">
                Save
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog v-model="showDeleteModal" width="450">

    <DialogCloseBtn @click="() => { showDeleteModal = false; activityToDelete = null }" />

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

</template>

<style lang="scss">
.v-list-item-title {
  font-size: small;
}

.v-list-item .v-list-item__prepend .v-icon {
  font-size: 1.25rem !important;
}
</style>
