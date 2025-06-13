<script setup lang="ts">

import { IMonthlySummary, IMonthlySummaryItem, useStatisticStore } from '@/@core/stores/statistic';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { Line } from 'vue-chartjs';
import MonthOnMonthStatistic from './MonthOnMonthStatistic.vue';
import TopSales from './TopSales.vue';
import YearOnYearStatistic from './YearOnYearStatistic.vue';

interface Props {
  id: string
}

enum AVG_CRITERIA {
  BELOW = 'BELOW',
  ABOVE = 'ABOVE',
  AVERAGE = 'AVERAGE'
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const statStore = useStatisticStore()
const props = defineProps<Props>()
const range = ref<number | undefined>()

const labels = computed(() => statStore.monthly_summary.map((item: IMonthlySummary) => item.month))

const datasetSales = computed(() => {
  const summary = statStore.monthly_summary
  if (!summary || summary.length === 0) {
    return {
      labels: [],
      datasets: [],
    }
  }

  const salesData = summary.map((item: IMonthlySummary) =>
    item.items.reduce((sum, item) => sum + item.total_sales, 0)
  )

  return {
    labels: summary.map((item: IMonthlySummary) => item.month),
    datasets: [
      {
        borderColor: '#d97979',
        label: 'Monthly Sales',
        data: salesData,
        tension: 0.3,
        fill: false,
      },
    ],
  }
})

const topFiveSales = computed(() => {
  const summary = statStore.monthly_summary
  if (!summary || summary.length === 0) return []

  const totalByItem: Record<string, number> = {}

  summary.forEach((month: IMonthlySummary) => {
    month.items.forEach((item) => {
      totalByItem[item.description] = (totalByItem[item.description] || 0) + item.invoice_count
    })
  })

  return Object.entries(totalByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([description, count]) => ({ description, count }))
})

const datasetInvoice = computed(() => {
  if (!statStore.monthly_summary?.length) return []

  return topFiveSales.value.map((desc, index) => {
    return {
      label: desc.description,
      data: statStore.monthly_summary.map((monthData: IMonthlySummary) => {
        const item = monthData.items.find(i => i.description === desc.description)
        return item ? item.invoice_count : 0
      }),
      borderColor: getColor(index),
      tension: 0.3,
      fill: false,
    }
  })
})

const datasetVolume = computed(() => {
  return topFiveSales.value.map((desc, index) => {
    return {
      label: desc.description,
      data: statStore.monthly_summary.map((monthData: IMonthlySummary) => {
        const item = monthData.items.find(i => i.description === desc.description)
        return item?.volume ? item.volume : 0
      }),
      borderColor: getColor(index),
      tension: 0.3,
      fill: false,
    }
  })
})


const datasetRevenue = computed(() => {
  return topFiveSales.value.map((desc: any, index: number) => {
    return {
      label: desc.description,
      data: statStore.monthly_summary.map((monthData: IMonthlySummary) => {
        const item = monthData.items.find(i => i.description === desc.description)
        return item ? item.total_sales : 0
      }),
      borderColor: getColor(index),
      tension: 0.3,
      fill: false,
    }
  })
})


function getColor(index: number) {
  const colors = [
    '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0',
    '#f67019', '#f53794', '#5dcebb', '#9966ff', '#c9cbcf'
  ]
  return colors[index % colors.length]
}

</script>

<template>
  <VCol cols="12">
    <AppCardActions
      title="SALES STATISTIC"
      action-collapsed
      action-refresh
      @refresh="statStore.fetchYoySummary(id)"
    >
      <VOverlay v-model="statStore.loadingState" class="justify-center align-center" contained>
        <VProgressCircular size="32" indeterminate />
      </VOverlay>
      <VCardText>
        <VRow class="d-flex justify-start">
          <!-- Chart 1: Sales Chart -->
          <VCol cols="12" lg="3" md="6" sm="12">
            <AppSelect v-model="range" placeholder="Filter by range" label="Select range" :items="[
              { value: 3, title: '3 Months' },
              { value: 6, title: '6 Months' },
              { value: 12, title: '12 Months' },
              { value: 18, title: '18 Months' },
              { value: 24, title: '24 Months' },
            ]" 
            @update:model-value="statStore.updateFilters(id, { range: $event })" />
          </VCol>
        </VRow>
        <VRow class="d-flex justify-start">
          <!-- Chart 1: Sales Chart -->
          <VCol cols="12" lg="6" md="8" sm="12">
            <div style="block-size: 400px;"> <!-- Define fixed height for parent -->
              <Line id="sales-chart" :options="{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Total Sales' } },
                  x: { title: { display: true, text: 'Month' } }
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'Total Sales',
                    font: {
                      size: 14
                    }
                  }
                }
              }" :data="datasetSales" />
            </div>
          </VCol>
            <!-- Chart 2: Items revenue Chart -->
          <VCol cols="12" lg="6" md="8" sm="12">
            <div style="block-size: 400px;"> <!-- Define fixed height for parent -->
              <Line id="items-revenue-chart" :options="{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Sales by Item' } },
                  x: { title: { display: true, text: 'Month' } }
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'Sales by Item',
                    font: {
                      size: 14
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const volume = context.raw
                        return `${context.dataset.label}: ${formatMoney(volume as number)}`
                      }
                    }
                  }
                }
              }
                " :data="{ labels, datasets: datasetRevenue }" />
            </div>
          </VCol>

          <!-- Chart 3: Items Volume Chart -->
          <VCol cols="12" lg="6" md="8" sm="12">
            <div style="block-size: 400px;"> <!-- Define fixed height for parent -->
              <Line id="items-invoice-chart" :options="{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Invoice Count' } },
                  x: { title: { display: true, text: 'Month' } }
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'Invoice Count by Item',
                    font: {
                      size: 14
                    }
                  }
                }
              }" :data="{ labels, datasets: datasetInvoice }" />
            </div>
          </VCol>
          <VCol cols="12" lg="6" md="8" sm="12">
            <div style="block-size: 400px;"> <!-- Define fixed height for parent -->
              <Line id="items-volume-chart" :options="{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Quantity in unit' } },
                  x: { title: { display: true, text: 'Month' } }
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'Quantity by Item',
                    font: {
                      size: 14
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const volume = (context.raw as number).toFixed(2) ?? 0
                        return `${context.dataset.label}: ${volume} Kg`
                      }
                    }
                  }
                }
              }" :data="{ labels, datasets: datasetVolume }" />
            </div>
          </VCol>
        </VRow>
        <TopSales :id="props.id"/>
        <MonthOnMonthStatistic :id="props.id"/>
        <YearOnYearStatistic :id="props.id"/>
      </VCardText>
    </AppCardActions>
  </VCol> 
</template>

<style lang="scss">
.no-scroll .v-data-table__wrapper {
  overflow: visible !important;
  max-block-size: none !important;
}

.v-expansion-panel-text__wrapper {
  padding-block: 0.5rem !important;
}
</style>
