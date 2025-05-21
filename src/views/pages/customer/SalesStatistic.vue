<script setup lang="ts">
import { Bar } from 'vue-chartjs';


interface Props {
  summary : {
  month: string,
  invoice_count: string
  total_sales: number
  }[]
}

const props = defineProps<Props>()

const dataset = computed(() => {
  return {
    labels: props.summary.map((item) => item.month),
    datasets: [
    {data: props.summary.map((item) => item.total_sales)}
    ],
  }
})

</script>

<template>
  <VCol
    cols="12"
  >
    <VCard>
      <VCardText>
        <p class="text-lg text-disabled">
          SALES STATISTIC
        </p>
        <span class="d-flex gap-2 pb-2">
        
           <Bar
            id="my-chart-id"
            :options="{responsive: true}"
            :data="dataset"
            
            />
        </span>
        
      </VCardText>
    </VCard>
  </VCol>
</template>
