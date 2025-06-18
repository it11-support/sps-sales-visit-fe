<script lang="ts" setup>
import ActivityReportEditForm from '@/views/pages/activity/ActivityReportEditForm.vue';

const router = useRoute('activity-id-report-edit' as any)
const assignmentId = router.params.id

</script>


<template>
  <ActivityReportEditForm :assignment-id="assignmentId"/>
</template>
