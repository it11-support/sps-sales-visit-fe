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

const props = defineProps<Props>()
const range = ref<number | undefined>()
const loading = ref(false)
const panel = ref(0)
const momPanel = ref(0)
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
  return topFiveSales.value.map((desc:any) => {
    return data.value.data.monthly_summary.map((monthData: Summary) => {
      const item = monthData.items.find(i => i.description === desc.description)
      return item?.unit ?? ''
    })
  })
})

const datasetRevenue = computed(() => {
  return topFiveSales.value.map((desc: any, index: number) => {
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

const itemCounts = computed(() => {
 return data.value.data.monthly_summary.reduce((acc: { [month: string]: { count: number, totalSales: number } }, data: Summary) => {
    const month = data.month;
    const totalSales = data.items.reduce((sum, item) => sum + item.total_sales, 0);
    acc[month] = {
      count: (acc[month] ? acc[month].count : 0) + data.items.length,
      totalSales: (acc[month] ? acc[month].totalSales : 0) + totalSales
    };
    return acc;
  }, {})
})

const changesData = computed(() => {
  const changes: Record<string, {
    currentTotalItem: number;
    currentTotalSales: number;
    itemChange: number;
    salesChange: number;
    itemChangePercentage: number;
    salesChangePercentage: number;
  }> = {};

  const months = Object.keys(itemCounts.value).reverse();

  months.forEach((month, index) => {
    const currentData = itemCounts.value[month];
    const previousMonth = months[index + 1]; 
    const previousData = itemCounts.value[previousMonth];

    if (previousData) {
      const itemChange = currentData.count - previousData.count;
      const salesChange = currentData.totalSales - previousData.totalSales;

      const itemChangePercentage = previousData.count !== 0
        ? (itemChange / previousData.count) * 100
        : 0

      const salesChangePercentage = previousData.totalSales !== 0
        ? (salesChange / previousData.totalSales) * 100
        : 0

      changes[month] = {
        currentTotalItem: currentData.count,
        currentTotalSales: currentData.totalSales,
        itemChange,
        salesChange,
        itemChangePercentage,
        salesChangePercentage,
      }
      
    } else {
      changes[month] = {
        currentTotalItem: currentData.count,
        currentTotalSales: currentData.totalSales,
        itemChange: 0,
        salesChange: 0,
        itemChangePercentage: 0,
        salesChangePercentage: 0,
      };
    }
  });

  return changes;
});

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

const handleRefresh = async (stopLoading?: () => void) => {
  await execute().finally(() => {
    if (stopLoading) stopLoading();
  });
};

const averageItems = computed(() => {
  const summaries = data.value?.data?.monthly_summary ?? [];

  if (summaries.length === 0) return 0;

  const totalItems = summaries.reduce((acc: number, summary: Summary) => {
    return acc + (summary.items?.length || 0);
  }, 0);

  return totalItems / summaries.length;
});


const averageSales = computed(() => {
  const summaries = data.value?.data?.monthly_summary ?? []

  if (summaries.length === 0) return 0

  const totalSales = summaries.reduce((acc: number, summary: Summary) => {
    const itemSales = summary.items?.reduce((sum: number, item: Item) => {
      return sum + (item.total_sales ?? 0)
    }, 0) ?? 0

    return acc + itemSales
  }, 0)

  return totalSales / summaries.length
})

const maxPurchasedItems = computed(() => {
  return data.value?.data?.monthly_summary.reduce((acc: number, summary: Summary) => {
    return Math.max(acc, summary.items?.length || 0)
  }, 0)
})

const maxSales = computed(() => {
  return data.value?.data?.monthly_summary.reduce((acc: number, summary: Summary) => {
    return Math.max(acc, summary.items?.reduce((sum: number, item: Item) => {
      return sum + (item.total_sales ?? 0)
    }, 0) || 0)
  }, 0)
})
console.log(maxPurchasedItems.value, maxSales.value)
const calculateAverage = (val: number, avg: number): string => {

  if(avg === 0 || val === 0) return AVG_CRITERIA.AVERAGE

  if (val > avg) {
    return AVG_CRITERIA.ABOVE
  } else if (val < avg) {
    return AVG_CRITERIA.BELOW
  } else {
    return AVG_CRITERIA.AVERAGE
  }
}

</script>

<template>
  <VCol cols="12">
    <AppCardActions
      title="SALES STATISTIC"
      action-collapsed
      action-refresh
      @refresh="handleRefresh"
    >
      <VOverlay v-model="loading" class="justify-center align-center" contained>
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
            @update:model-value="updateRange" />
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
        <VRow class="d-flex justify-start">
          <VCol cols="12">
            <VExpansionPanels v-model="panel" variant="popout">
              <VExpansionPanel>
                  <VExpansionPanelTitle>TOP 5 ITEM</VExpansionPanelTitle>
                  <VExpansionPanelText>
                    <VTable min-height="300px" fixed-header class="no-scroll" :items="top5Sales">
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
                  </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCol>
        </VRow>
        <VRow class="d-flex justify-start">
          <VCol cols="12">
            <VExpansionPanels v-model="momPanel" variant="popout">
              <VExpansionPanel>
                <VExpansionPanelTitle >MONTH OVER MONTH SALES</VExpansionPanelTitle>
                <VExpansionPanelText class="d-flex justify-start">
                  <VRow class="d-flex justify-start mt-2">
                    <VCol 
                    cols="6"
                    md="6"
                    lg="6"   
                    sm="12">
                      <p class="text-h6">Average Items: <span class="font-weight-bold">{{ averageItems.toFixed(2) }}</span></p>
                      <p class="text-h6">Average Sales: <span class="font-weight-bold">{{ formatMoney(averageSales) }}</span></p>
                    </VCol>
                    <VCol
                      cols="6"
                      md="6"
                      lg="6" 
                      sm="12"  >
                      <p class="text-h6">Max Items: <span class="font-weight-bold">{{ maxPurchasedItems.toFixed(2) }}</span></p>
                      <p class="text-h6">Max Sales: <span class="font-weight-bold">{{ formatMoney(maxSales) }}</span></p>
                    </VCol>
                    <VDivider />
                  </VRow>
                </VExpansionPanelText>
                <VExpansionPanelText>
                  <VTable min-height="300px" fixed-header class="no-scroll" :items="changesData">
                    <thead>
                      <tr>
                        <th class="text-left">
                          Month
                        </th>
                        <th class="text-left">
                          Items
                        </th>
                        <th class="text-left">
                          Item Changes
                        </th>
                        <th class="text-left">
                          Total Sales
                        </th>                          
                        <th class="text-left">
                          Total Sales Changes
                        </th>
                        <th class="text-left">
                          AVG Items
                        </th>
                        <th class="text-left">
                          AVG Sales
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in changesData" :key="index">
                        <td>{{ index }}</td>
                        <td>{{ item.currentTotalItem }}</td>
                        <td>
                          {{ item.itemChange  }} 
                          ({{ item.itemChangePercentage.toFixed(2) }}%) 
                          <VIcon 
                            :color="item.itemChange > 0 ? 'success' : (item.itemChange === 0 ? '' : 'error')" 
                            :icon="item.itemChange > 0 ? 'tabler-trending-up' : (item.itemChange === 0 ? '' : 'tabler-trending-down')"
                          />
                        </td>
                        <td>{{ formatMoney(item.currentTotalSales) }}</td>                        
                        <td>
                          {{ formatMoney(item.salesChange) }} 
                          ({{ item.salesChangePercentage.toFixed(2) }}%) 
                          <VIcon 
                            :color="item.salesChange > 0 ? 'success' : (item.salesChange === 0 ? '' : 'error')" 
                            :icon="item.salesChange > 0 ? 'tabler-trending-up' : (item.salesChange === 0 ? '' : 'tabler-trending-down')" 
                          />
                        </td>
                        <td>
                          <VChip 
                            :color="calculateAverage(item.currentTotalItem , averageItems) === AVG_CRITERIA.ABOVE 
                            ? 'success' 
                            : (calculateAverage(item.currentTotalItem , averageItems) === AVG_CRITERIA.BELOW 
                            ? 'error' : '')" 
                            label size="small" 
                            class="mb-2"> 
                              {{ calculateAverage(item.currentTotalItem , averageItems) }} 
                            </VChip>
                        </td>

                        <td>
                          <VChip 
                            :color="calculateAverage(item.currentTotalSales , averageSales) === AVG_CRITERIA.ABOVE 
                            ? 'success' 
                            : (calculateAverage(item.currentTotalSales , averageSales) === AVG_CRITERIA.BELOW 
                            ? 'error' : '')" 
                            label size="small" 
                            class="mb-2"> 
                              {{ calculateAverage(item.currentTotalSales , averageSales) }} 
                            </VChip>
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCol>
        </VRow>
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
