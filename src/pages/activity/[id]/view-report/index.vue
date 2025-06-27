<script lang="ts" setup>
import ActivityReportDetail from '@/views/pages/activity/ActivityReportDetail.vue';

const router = useRoute('activity-id-view-report' as any)
const assignmentId = router.params.id

</script>


<template>
 <ActivityReportDetail :assignment-id="assignmentId" />
</template>
