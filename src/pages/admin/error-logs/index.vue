<script lang="ts" setup>

interface ErrorLog {
  id: number
  level_name: string
  message: string
  exception_class: string | null
  exception_message: string | null
  file: string | null
  line: number | null
  url: string | null
  method: string | null
  ip: string | null
  user_name: string | null
  username: string | null
  route_name: string | null
  controller_action: string | null
  created_at: string
  context: Record<string, any> | null
}

const logsData = ref<{
  status: string
  message: string
  data: {
    data: ErrorLog[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
} | null>(null)
const logsError = ref<any>(null)
const loading = ref(false)

const searchQuery = ref('')
const searchQueryDebounced = refDebounced(searchQuery, 400)
const selectedLevel = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showDetailModal = ref(false)
const selectedLog = ref<ErrorLog | null>(null)

const levelOptions = [
  { title: 'All Levels', value: null },
  { title: 'ERROR', value: 'ERROR' },
  { title: 'WARNING', value: 'WARNING' },
  { title: 'INFO', value: 'INFO' },
  { title: 'DEBUG', value: 'DEBUG' },
]

const headers = [
  { title: 'Time', key: 'created_at', sortable: true },
  { title: 'Level', key: 'level_name', sortable: true },
  { title: 'Message', key: 'message', sortable: false },
  { title: 'URL', key: 'url', sortable: false },
  { title: 'User', key: 'user_name', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const loadLogs = async () => {
  loading.value = true
  const params: Record<string, any> = {
    page: currentPage.value,
    per_page: itemsPerPage.value,
  }
  if (selectedLevel.value) params.level = selectedLevel.value
  if (searchQuery.value) params.search = searchQuery.value

  const { data, error } = await useApi<{
    status: string
    message: string
    data: {
      data: ErrorLog[]
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }>(createUrl('error-logs', { query: params }).value)
  logsData.value = data.value
  logsError.value = error.value
  loading.value = false
}

onMounted(loadLogs)

watch([currentPage, itemsPerPage, selectedLevel], loadLogs)

watch(searchQueryDebounced, () => {
  currentPage.value = 1
  loadLogs()
})

const getLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR': return 'error'
    case 'WARNING': return 'warning'
    case 'INFO': return 'info'
    case 'DEBUG': return 'secondary'
    default: return 'primary'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const truncate = (text: string | null, length: number = 80) => {
  if (!text) return '-'
  return text.length > length ? text.substring(0, length) + '...' : text
}

const viewDetail = (log: ErrorLog) => {
  selectedLog.value = log
  showDetailModal.value = true
}

const handleDelete = async (log: ErrorLog) => {
  if (!confirm('Delete this error log?')) return
  try {
    await useApi(`error-logs/${log.id}`, { method: 'DELETE' }).execute()
    loadLogs()
  } catch (e) {
    console.error('Failed to delete log:', e)
  }
}

const logs = computed(() => logsData.value?.data?.data ?? [])
const pagination = computed(() => ({
  currentPage: logsData.value?.data?.current_page ?? 1,
  lastPage: logsData.value?.data?.last_page ?? 1,
  total: logsData.value?.data?.total ?? 0,
}))
</script>

<template>
  <VBreadcrumbs
    class="px-0 pb-2 pt-0"
    :items="[{ title: 'Home', to: '/', class: 'text-primary' }, { title: 'Error Logs' }]"
  >
    <template #prepend>
      <VIcon icon="tabler-home" size="small" />
    </template>
  </VBreadcrumbs>

  <VCard class="mb-6">
    <VCardItem class="pb-4">
      <VCardTitle>Error Logs</VCardTitle>
      <VCardSubtitle>View and trace application errors</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VRow>
        <VCol cols="12" sm="6" md="4">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search message, URL, user..."
            prepend-inner-icon="tabler-search"
            clearable
          />
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <AppSelect
            v-model="selectedLevel"
            :items="levelOptions"
            placeholder="Filter by level"
            clearable
            :return-object="false"
          />
        </VCol>
        <VCol cols="12" sm="6" md="2">
          <VBtn
            variant="tonal"
            color="primary"
            prepend-icon="tabler-refresh"
            @click="loadLogs"
          >
            Refresh
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VDataTableServer
      :headers="headers"
      :items="logs"
      :loading="loading"
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :items-length="pagination.total"
      hover
      class="elevation-0"
      @update:page="loadLogs"
      @update:items-per-page="loadLogs"
    >
      <template #item.created_at="{ item }">
        <span class="text-caption">{{ formatDate(item.created_at) }}</span>
      </template>

      <template #item.level_name="{ item }">
        <VChip
          :color="getLevelColor(item.level_name)"
          size="small"
          label
        >
          {{ item.level_name }}
        </VChip>
      </template>

      <template #item.message="{ item }">
        <span :title="item.message" class="d-inline-block" style="max-width: 300px;">
          {{ truncate(item.message, 60) }}
        </span>
      </template>

      <template #item.url="{ item }">
        <span :title="item?.url || ''" class="d-inline-table" style="max-width: 200px;">
          {{ truncate(item?.url, 40) }}
        </span>
      </template>

      <template #item.user_name="{ item }">
        <div>
          <div class="text-caption">{{ item.user_name || '-' }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.username || '' }}</div>
        </div>
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon="tabler-eye"
          size="small"
          variant="text"
          color="primary"
          @click="viewDetail(item)"
        />
        <VBtn
          icon="tabler-trash"
          size="small"
          variant="text"
          color="error"
          @click="handleDelete(item)"
        />
      </template>

      <template #no-data>
        <div class="pa-8 text-center">
          <VIcon icon="tabler-alert-circle" size="48" color="secondary" />
          <div class="text-h6 mt-2">No error logs found</div>
        </div>
      </template>
    </VDataTableServer>

    
  </VCard>

  <!-- Detail Modal -->
  <VDialog v-model="showDetailModal" max-width="800">
    <VCard v-if="selectedLog">
      <VCardTitle class="d-flex align-center pt-4 px-4">
        <VChip :color="getLevelColor(selectedLog.level_name)" size="small" label class="mr-3">
          {{ selectedLog.level_name }}
        </VChip>
        <span class="text-truncate">{{ selectedLog.message }}</span>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">Timestamp</div>
            <div class="mb-3">{{ formatDate(selectedLog.created_at) }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">User</div>
            <div class="mb-3">{{ selectedLog.user_name || '-' }} ({{ selectedLog.username || '-' }})</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">URL</div>
            <div class="mb-3 text-break">{{ selectedLog.url || '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">Method</div>
            <div class="mb-3">{{ selectedLog.method || '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">Route</div>
            <div class="mb-3">{{ selectedLog.route_name || '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">Controller</div>
            <div class="mb-3">{{ selectedLog.controller_action || '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption text-medium-emphasis mb-1">IP Address</div>
            <div class="mb-3">{{ selectedLog.ip || '-' }}</div>
          </VCol>
        </VRow>

        <VDivider class="my-3" />

        <div v-if="selectedLog.exception_message">
          <div class="text-caption text-medium-emphasis mb-1">Exception</div>
          <VAlert type="error" variant="tonal" class="mb-3">
            <div class="text-caption">{{ selectedLog.exception_message }}</div>
          </VAlert>
        </div>

        <div v-if="selectedLog.file">
          <div class="text-caption text-medium-emphasis mb-1">File</div>
          <code class="d-block pa-2 bg-grey-lighten-4 rounded text-caption">
            {{ selectedLog.file }}:{{ selectedLog.line }}
          </code>
        </div>

        <div v-if="selectedLog.context" class="mt-3">
          <div class="text-caption text-medium-emphasis mb-1">Context</div>
          <pre class="pa-2 bg-grey-lighten-4 rounded text-caption overflow-auto" style="max-height: 200px;">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
        </div>
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="tonal" @click="showDetailModal = false">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
