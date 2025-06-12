<script lang="ts" setup>
import ActivityReportForm from '@/views/pages/activity/ActivityReportForm.vue';

const router = useRoute('activity-id-report' as any)
const assignmentId = router.params.id

</script>


<template>
  <ActivityReportForm :assignment-id="assignmentId" />
</template>
