<script lang="ts" setup>
// import ActivityReportEditForm from '@/views/pages/activity/ActivityReportEditForm.vue';
import ActivityReportNewForm from '@/views/pages/activity/ActivityReportNewForm.vue';
const router = useRoute('activity-id-report-edit' as any)
const assignmentId = router.params.id

</script>


<template>
  <ActivityReportNewForm :assignment-id="assignmentId"/>
</template>
