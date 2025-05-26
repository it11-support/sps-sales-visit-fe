<script setup lang="ts">
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

interface Item {
  item_code: string;
  description: string;
  invoice_count: number;
  volume: number;
  total_sales: number;
  price: number;
  unit: string;
  last_invoice_date: string
}
interface Props {
  id: string
}
interface Summary {
  month: string;
  items: Item[]
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

const props = defineProps<Props>()
const range = ref<number | undefined>()
const loading = ref(false)
const { data, execute } = await useApi<any>(createUrl(`customer/sales-summary/${props.id}`, { query: { range } }))

const labels = computed(() => data.value?.data?.monthly_summary.map((item: Summary) => item.month))
const top5Sales = computed(() => data.value?.data?.top_5_items.map((item: Item) => item))

const top5TotalSales = computed(() => top5Sales.value.reduce((sum: number, item: Item) => sum + item.total_sales, 0))

console.log(top5TotalSales.value)
const datasetSales = computed(() => {
  const summary = data.value?.data?.monthly_summary
  if (!summary || summary.length === 0) {
    return {
      labels: [],
      datasets: [],
    }
  }

  const salesData = summary.map((item: Summary) =>
    item.items.reduce((sum, item) => sum + item.total_sales, 0)
  )

  return {
    labels: summary.map((item: Summary) => item.month),
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
  const summary = data.value?.data?.monthly_summary
  if (!summary || summary.length === 0) return []

  const totalByItem: Record<string, number> = {}

  summary.forEach((month: Summary) => {
    month.items.forEach((item) => {
      totalByItem[item.description] = (totalByItem[item.description] || 0) + item.invoice_count
    })
  })

  return Object.entries(totalByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([description, count]) => ({ description, count }))
})

watch(range, async (newVal) => {
  console.log(newVal)
  loading.value = true
  try {
    await execute()
  } finally {
    loading.value = false
  }
})

const datasetInvoice = computed(() => {
  if (!data.value?.data?.monthly_summary?.length) return []

  return topFiveSales.value.map((desc, index) => {
    return {
      label: desc.description,
      data: data.value.data.monthly_summary.map((monthData: Summary) => {
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
      data: data.value.data.monthly_summary.map((monthData: Summary) => {
        const item = monthData.items.find(i => i.description === desc.description)
        return item?.volume ? item.volume : 0
      }),
      borderColor: getColor(index),
      tension: 0.3,
      fill: false,
    }
  })
}
)

const volumeUnits = computed(() => {
  return topFiveSales.value.map((desc) => {
    return data.value.data.monthly_summary.map((monthData: Summary) => {
      const item = monthData.items.find(i => i.description === desc.description)
      return item?.unit ?? ''
    })
  })
})

const datasetRevenue = computed(() => {
  return topFiveSales.value.map((desc, index) => {
    return {
      label: desc.description,
      data: data.value.data.monthly_summary.map((monthData: Summary) => {
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

const updateRange = async (val: number) => {
  range.value = val
}
</script>

<template>
  <VCol cols="12">
    <VCard>
      <VOverlay v-model="loading" class="justify-center align-center" contained>
        <VProgressCircular size="64" indeterminate />
      </VOverlay>
      <VCardText>
        <p class="text-lg text-disabled">
          SALES STATISTIC
        </p>
        <VRow class="d-flex justify-start">
          <!-- Chart 1: Sales Chart -->
          <VCol cols="12" lg="3" md="6" sm="12">
            <AppSelect v-model="range" placeholder="Filter by range" label="Select range" :items="[
              { value: 3, title: '3 Months' },
              { value: 6, title: '6 Months' },
              { value: 12, title: '12 Months' },
              { value: 18, title: '18 Months' },
              { value: 24, title: '24 Months' },
            ]" @update:model-value="updateRange" />
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
                        const unit = volumeUnits[context.datasetIndex]?.[context.dataIndex] ?? ''
                        return `${context.dataset.label}: ${volume} ${unit}`
                      }
                    }
                  }
                }
              }" :data="{ labels, datasets: datasetVolume }" />
            </div>
          </VCol>
        </VRow>
        <VDivider class="my-4" />

        <VRow class="d-flex justify-start">
          <VCol cols="12">
            <p class="text-lg text-disabled">
              TOP 5 ITEM
            </p>
            <VTable height="300px" fixed-header class="no-scroll" :items="top5Sales">
              <thead>
                <tr>
                  <th class="text-left">
                    Item Code
                  </th>
                  <th class="text-left">
                    Description
                  </th>
                  <th class="text-left">
                    QTY
                  </th>
                  <th class="text-left">
                    Unit
                  </th>
                  <th class="text-left">
                    Price
                  </th>
                  <th class="text-left">
                    Total
                  </th>
                  <th class="text-left">
                    Contribution
                  </th>
                  <th class="text-left">
                    Last Invoice Date
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in top5Sales" :key="item.item_code">
                  <td>{{ item.item_code }}</td>
                  <td>{{ item.description }}</td>
                  <td>{{ item.volume.toFixed(2) }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ formatMoney(item.price) }}</td>
                  <td>{{ formatMoney(item.total_sales) }}</td>
                  <td>{{ `${(item.total_sales / top5TotalSales * 100).toFixed(2)} % ` }}</td>
                  <td>{{ formatDate(item.last_invoice_date) }}</td>
                </tr>
              </tbody>
            </VTable>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VCol>
</template>

<style lang="scss">
.no-scroll .v-data-table__wrapper {
  overflow: visible !important;
  max-block-size: none !important;
}
</style>
