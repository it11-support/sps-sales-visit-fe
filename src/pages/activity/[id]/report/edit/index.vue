<script lang="ts" setup>
// import ActivityReportEditForm from '@/views/pages/activity/ActivityReportEditForm.vue';
import ActivityReportForm from '@/views/pages/activity/ActivityReportForm.vue';
const router = useRoute('activity-id-report-edit' as any)
const assignmentId = router.params.id

</script>


<template>
  <ActivityReportForm :assignment-id="assignmentId"/>
</template>
