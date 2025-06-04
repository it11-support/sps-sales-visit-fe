<script lang="ts" setup>
import { useActivityStore, useAuthStore } from '@/@core/stores';

const activityStore = useActivityStore()
const authStore = useAuthStore()
const user = useCookie<any>('userData')
const isAdmin = computed(() => user.value.role.role === 'admin')
const searchQuery = ref('')
const salesPersonId = computed(() => user.value.sales_person?.SlpCode)
const debouncedQuery = useDebounce(searchQuery, 400)

const headers = computed(() => {
  const headers = [
    { title: 'Actions', key: 'actions', sortable: false },
    { title: 'Schedule', key: 'scheduled_date', sortable: true },
    { title: 'Customer', key: 'customer', sortable: true },
    { title: 'Type', key: 'activity', sortable: true },
    { title: 'Note', key: 'notes', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
  ]
  if (isAdmin.value) {
    headers.splice(1, 0, { title: 'Assigned To', key: 'assigned_to.sales_person', sortable: true })
  }
  return headers
})


onMounted(async () => {
  if(!isAdmin.value && salesPersonId.value) {
    activityStore.updateFilters({ sales_person_id: salesPersonId.value })
  }
  await activityStore.fetchActivities()
  await activityStore.fetchSalesPersonOptions()
})

watch(() =>isAdmin.value, (val) => {
  if(val) {
    activityStore.updateFilters({ sales_person_id: undefined })
  } else {
    const spId = authStore.user?.sales_person?.SlpCode
    if (spId) {
      activityStore.updateFilters({ sales_person_id: spId })
    }
  }
}, { immediate: true })

watch(debouncedQuery, (val) => {
  activityStore.updateFilters({ search: val })
})


</script>

<template>
  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCardTitle>Filters</VCardTitle>
    </VCardItem>
    <VCardText>
      <VRow>
        <VCol 
          v-if="isAdmin"
          cols="12"
          sm="4"
        >
          <AppSelect 
            v-model="activityStore.filters.sales_person_id"
            :disabled="activityStore.loading"
            @update:model-value="activityStore.updateFilters({ sales_person_id: $event })"
            placeholder="Fitler by sales person" 
            :items="activityStore.salesPersonsOptions" 
            clearable 
            clear-icon="tabler-x"
          />
        </VCol>
        <VCol cols="12" sm="4">
          <AppSelect 
            v-model="activityStore.filters.status"
            :disabled="activityStore.loading"
            @update:model-value="activityStore.updateFilters({ status: $event })"
            placeholder="Filter by status" 
            :items="[
              { title: 'Pending', value: 'pending' },
              { title: 'Assigned', value: 'assigned' },
              { title: 'Completed', value: 'completed' },
              { title: 'Cancelled', value: 'cancelled' },
              { title: 'Overdue', value: 'misssed' },
            ]"
            clearable 
            clear-icon="tabler-x"
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
          <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
            Export
          </VBtn>
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
      show-select 
      :select-strategy="'all'"
      return-object 
      @update:options="activityStore.updateSortOptions" 
      @update:model-value="activityStore.setSelectedRows"
      multi-sort
    >
      <template #item.actions="{ item }">
        <a :href="`${'/activity/view/' + item.id}`">
        <VIcon small class="mr-1">tabler-eye</VIcon>
          View
        </a>
      </template>
      <template #item.assigned_to.sales_person="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              {{ item.assigned_to.sales_person?.SlpName }}
            </div>
          </div>
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
      <template #item.customer="{ item }">
        <div class="d-flex align-center gap-x-4">
          <div class="d-flex flex-column">
            <div class="text-sm">
              {{ item.customer.CardName }}
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
    </VDataTableServer>
  </VCard>
</template>
