<script lang="ts" setup>
import { useSalesSummaryStore } from '@/@core/stores/sales';
import { useTheme } from 'vuetify';
import { VSkeletonLoader } from 'vuetify/components';
import Chart from './Chart.vue';


const salesSummaryStore = useSalesSummaryStore()
const vuetifyTheme = useTheme()

onMounted(async () => {
  await salesSummaryStore.fetchSalesSummary()
})

watch(
  () => salesSummaryStore.month,
  async (newValue) => {
    if (newValue) {
      await salesSummaryStore.fetchSalesSummary()
    }
  }
)

</script>

<template>
  <VSkeletonLoader
    type="article"
    v-if="salesSummaryStore.loading">
  </VSkeletonLoader>
  <template v-else>
    <VRow class="d-flex justify-start mb-5">
      <VCol sm="8" md="4" lg="4">
        <AppSelect 
        v-model="salesSummaryStore.month"
        label="Select Month"
        placeholder="Select Month" 
        item-title="label" 
        item-value="value" 
        :rules="[]"
        @update:model-value="salesSummaryStore.setMonth($event as number)"
        :items="salesSummaryStore.monthList" 
        />
      </VCol>
    </VRow>
   <Chart />
  </template>
</template>
<style lang="scss" scoped>
.chart-scroll-wrapper {
  overflow-x: auto;
  padding-block-end: 1rem;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-inline-size: max-content;
}
</style>
