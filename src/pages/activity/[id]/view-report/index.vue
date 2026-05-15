<script lang="ts" setup>
import ReportDetail from '@/views/pages/activity/ReportDetail.vue';

const router = useRoute('activity-id-view-report' as any)
const assignmentId = router.params.id

</script>


<template>
 <ReportDetail :assignment-id="assignmentId" />
</template>
