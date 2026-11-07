<script setup lang="ts">
import { useActivityStore } from '@/@core/stores';
import type { ActivityHistoryEvent } from '@/@core/typedefs';
import { computed, onMounted, watch } from 'vue';

const props = defineProps<{
  assignmentId: number | string
}>()

const activityStore = useActivityStore()

const eventConfig: Record<
  ActivityHistoryEvent,
  { title: string; icon: string; color: string }
> = {
  created: {
    title: 'Activity Created',
    icon: 'tabler-circle-plus',
    color: 'primary',
  },
  edited: {
    title: 'Activity Edited',
    icon: 'tabler-edit',
    color: 'warning',
  },
  updated: {
    title: 'Schedule Updated',
    icon: 'tabler-calendar-time',
    color: 'info',
  },
  checked_in: {
    title: 'Checked In',
    icon: 'tabler-login',
    color: 'success',
  },
  checked_out: {
    title: 'Checked Out',
    icon: 'tabler-logout',
    color: 'warning',
  },
  draft_saved: {
    title: 'Draft Saved',
    icon: 'tabler-device-floppy',
    color: 'secondary',
  },
  submitted: {
    title: 'Report Submitted',
    icon: 'tabler-send',
    color: 'success',
  },
}

const histories = computed(() => activityStore.activityHistories)
const loading = computed(() => activityStore.loadingHistory)

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

const loadHistory = async () => {
  await activityStore.fetchActivityHistory(props.assignmentId)
}

onMounted(loadHistory)

watch(
  () => props.assignmentId,
  loadHistory,
)
</script>

<template>
  <VCard variant="outlined">
    <VCardItem>
      <template #prepend>
        <VIcon icon="tabler-history" />
      </template>

      <VCardTitle>Activity History</VCardTitle>

      <template #append>
        <VBtn icon="tabler-refresh" variant="text" size="small" :loading="loading" @click="loadHistory" />
      </template>
    </VCardItem>

    <VDivider />

    <VCardText>
      <div v-if="loading && !histories.length" class="d-flex justify-center py-8">
        <VProgressCircular indeterminate size="28" />
      </div>

      <div v-else-if="!histories.length" class="text-center text-medium-emphasis py-8">
        No activity history available.
      </div>

      <VTimeline v-else side="end" align="start" density="compact" truncate-line="both">
        <VTimelineItem v-for="history in histories" :key="history.id"
          :dot-color="eventConfig[history.event]?.color ?? 'secondary'"
          :icon="eventConfig[history.event]?.icon ?? 'tabler-history'" size="small" fill-dot>
          <div class="d-flex flex-column ga-1">
            <div class="font-weight-medium">
              {{ eventConfig[history.event]?.title ?? history.event }}
            </div>

            <div class="text-body-2 text-medium-emphasis">
              {{ history.user?.salesPerson?.[0].SlpName ?? 'System' }}
            </div>

            <div class="text-caption text-medium-emphasis">
              {{ formatDate(history.occurred_at) }}
            </div>

            <div v-if="
              history.event === 'updated'
              && history.old_values?.scheduled_date
              && history.new_values?.scheduled_date
            " class="text-caption mt-1">
              Schedule:
              {{ history.old_values.scheduled_date }}
              →
              {{ history.new_values.scheduled_date }}
            </div>
          </div>
        </VTimelineItem>
      </VTimeline>
    </VCardText>
  </VCard>
</template>
