<script setup lang="ts">

import { IMonthlySummary, useStatisticStore } from '@/@core/stores/statistic';
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
import { VOverlay } from 'vuetify/components';
import MonthOnMonthStatistic from './MonthOnMonthStatistic.vue';
import TopSales from './TopSales.vue';
import YearOnYearStatistic from './YearOnYearStatistic.vue';

interface Props {
  id: string,
  companyId: string
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

onMounted(async () => {
  console.log(statStore.summary)
})
console.log(statStore.summary)
const labels = computed(() => statStore.summary?.monthly_summary.map((item: IMonthlySummary) => item.month))
const datasetSales = computed(() => {
  const summary = statStore.summary?.monthly_summary
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
  const summary = statStore.summary?.monthly_summary
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
  if (!statStore.summary?.monthly_summary?.length) return []

  return topFiveSales.value.map((desc, index) => {
    return {
      label: desc.description,
      data: statStore.summary?.monthly_summary.map((monthData: IMonthlySummary) => {
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
      data: statStore.summary?.monthly_summary.map((monthData: IMonthlySummary) => {
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
      data: statStore.summary?.monthly_summary.map((monthData: IMonthlySummary) => {
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
  <VCol cols="12" v-if="!props.id">
    <VSkeletonLoader
      type="article"
    >
    </VSkeletonLoader>
  </VCol>
  <VCol cols="12"  v-else>
    <AppCardActions
      title="SALES STATISTIC"
      action-collapsed
      action-refresh
      @refresh="statStore.fetchYoySummary(id)"
    >
      <VOverlay
        v-model="statStore.loadingState"
        class="justify-center align-center" 
        contained
      >
        <VProgressCircular size="32" indeterminate />
      </VOverlay>
      <VCardText>
        <VRow class="d-flex justify-start mb-4">
          <!-- Filter Dropdown -->
          <VCol cols="12" lg="3" md="6" sm="12">
            <AppSelect
              v-model="range"
              placeholder="Filter by range"
              label="Select range"
              :items="[
                { value: 3, title: '3 Months' },
                { value: 6, title: '6 Months' },
                { value: 12, title: '12 Months' },
                { value: 18, title: '18 Months' },
                { value: 24, title: '24 Months' },
              ]"
              @update:model-value="statStore.updateFilters(id, { range: $event })"
            />
          </VCol>
        </VRow>

        <!-- Chart container with horizontal scroll on small screens -->
        <div class="scroll-x-on-mobile">
          <div class="scroll-container">
            <VRow class="d-flex justify-start flex-wrap gap-4">
              <!-- Chart 1 -->
              <VCol cols="12" lg="6" md="8" sm="12">
                <div style="block-size: 400px;">
                  <Line
                    id="sales-chart"
                    :options="{
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
                          font: { size: 14 }
                        }
                      }
                    }"
                    :data="datasetSales"
                  />
                </div>
              </VCol>

              <!-- Chart 2 -->
              <VCol cols="12" lg="6" md="8" sm="12">
                <div style="block-size: 400px;">
                  <Line
                    id="items-revenue-chart"
                    :options="{
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
                          font: { size: 14 }
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
                    }"
                    :data="{ labels, datasets: datasetRevenue }"
                  />
                </div>
              </VCol>

              <!-- Chart 3 -->
              <VCol cols="12" lg="6" md="8" sm="12">
                <div style="block-size: 400px;">
                  <Line
                    id="items-invoice-chart"
                    :options="{
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
                          font: { size: 14 }
                        }
                      }
                    }"
                    :data="{ labels, datasets: datasetInvoice }"
                  />
                </div>
              </VCol>

              <!-- Chart 4 -->
              <VCol cols="12" lg="6" md="8" sm="12">
                <div style="block-size: 400px;">
                  <Line
                    id="items-volume-chart"
                    :options="{
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
                          font: { size: 14 }
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const volume = (context.raw as number).toFixed(2)
                              return `${context.dataset.label}: ${volume} Kg`
                            }
                          }
                        }
                      }
                    }"
                    :data="{ labels, datasets: datasetVolume }"
                  />
                </div>
              </VCol>
            </VRow>
          </div>
        </div>

        <!-- Other statistic components -->
        <TopSales :id="props.id" :company-id="props.companyId"/>
        <MonthOnMonthStatistic :id="props.id" :company-id="props.companyId"/>
        <YearOnYearStatistic :id="props.id" />
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

.scroll-x-on-mobile {
  overflow-x: auto;
}

.scroll-container {
  min-inline-size: 600px;
}

@media (min-width: 992px) {
  .scroll-x-on-mobile {
    overflow-x: unset;
  }

  .scroll-container {
    min-inline-size: unset;
  }
}
</style>
