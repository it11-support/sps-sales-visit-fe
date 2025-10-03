<script lang="ts" setup>
import { IMonthlySummary, IMonthlySummaryItem, useStatisticStore } from '@/@core/stores/statistic';

interface Props {
  id: string
  companyId: string
}

enum AVG_CRITERIA {
  BELOW = 'BELOW',
  ABOVE = 'ABOVE',
  AVERAGE = 'AVERAGE'
}

const statStore = useStatisticStore()

const props = defineProps<Props>()
const momPanel = ref(false)
const { id, companyId } = toRefs(props)



onMounted(async () => {
  await statStore.fetchMoMSummary(id.value)
})

const averageSales = computed(() => {
  const summaries = statStore.summary[props.companyId]?.monthly_summary ?? []

  if (summaries.length === 0) return 0

  const totalSales = summaries.reduce((acc: number, summary: IMonthlySummary) => {
    const itemSales = summary.items?.reduce((sum: number, item: IMonthlySummaryItem) => {
      return sum + (item.total_sales ?? 0)
    }, 0) ?? 0

    return acc + itemSales
  }, 0)

  return totalSales / summaries.length
})

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

const averageItems = computed(() => {
  const summaries = statStore.summary[props.companyId]?.monthly_summary ?? [];

  if (summaries.length === 0) return 0;

  const totalItems = summaries.reduce((acc: number, summary: IMonthlySummary) => {
    return acc + (summary.items?.length || 0);
  }, 0);

  return totalItems / summaries.length;
});


const maxPurchasedItems = computed(() => {
  return statStore.summary[props.companyId]?.monthly_summary.reduce((acc: number, summary: IMonthlySummary) => {
    return Math.max(acc, summary.items?.length || 0)
  }, 0)
})

const maxSales = computed(() => {
  return statStore.summary[props.companyId]?.monthly_summary.reduce((acc: number, summary: IMonthlySummary) => {
    return Math.max(acc, summary.items?.reduce((sum: number, item: IMonthlySummaryItem) => {
      return sum + (item.total_sales ?? 0)
    }, 0) || 0)
  }, 0)
})

const itemCounts = computed(() => {
  return statStore.summary[props.companyId]?.monthly_summary.reduce((acc: { [month: string]: { count: number, totalSales: number, totalVolume: number } }, data: IMonthlySummary) => {
    const month = data.month;

    const totalSales = data.items.reduce((sum, item) => sum + item.total_sales, 0);

    const totalVolume = data.items.reduce((sum, item) => sum + item.volume, 0);

    const itemCount = data.items.length;

    acc[month] = {
      count: itemCount,
      totalSales: totalSales,
      totalVolume
    };
    return acc;
  }, {});
});

const changesData = computed(() => {
  const changes: Record<string, {
    currentTotalItem: number;
    currentTotalSales: number;
    totalVolume: number
    itemChange: number;
    salesChange: number;
    itemChangePercentage: number;
    salesChangePercentage: number;
    volumeChanges: number
    volumeChangePercentage: number
  }> = {};

  const months = computed(() => Object.keys(itemCounts.value ?? {}).reverse())


  months.value.forEach((month, index) => {
    const currentData = itemCounts.value[month];
    const previousMonth = months.value[index + 1]; 
    const previousData = itemCounts.value[previousMonth];

    if (previousData) {
      const itemChange = currentData.count - previousData.count;
      const salesChange = currentData.totalSales - previousData.totalSales;
      const volumeChanges = currentData.totalVolume - previousData.totalVolume

      const itemChangePercentage = previousData.count !== 0
        ? (itemChange / previousData.count) * 100
        : 0

      const salesChangePercentage = previousData.totalSales !== 0
        ? (salesChange / previousData.totalSales) * 100
        : 0

      const volumeChangePercentage = previousData.totalVolume !== 0
        ? (volumeChanges / previousData.totalVolume) * 100
        : 0

      changes[month] = {
        currentTotalItem: currentData.count,
        currentTotalSales: currentData.totalSales,
        totalVolume: currentData.totalVolume,
        itemChange,
        salesChange,
        itemChangePercentage,
        salesChangePercentage,
        volumeChanges,
        volumeChangePercentage
      }
      
    } else {
      changes[month] = {
        currentTotalItem: currentData.count,
        currentTotalSales: currentData.totalSales,
        itemChange: 0,
        totalVolume: currentData.totalVolume,
        salesChange: 0,
        itemChangePercentage: 0,
        salesChangePercentage: 0,
        volumeChanges: 0,
        volumeChangePercentage: 0
      };
    }
  });

  return changes;
});

const widgetData = computed(() => ([
  {
    title: 'Average Purchased Items',
    value: (averageItems.value ?? 0).toFixed(2),
    icon: 'tabler-timeline',
  },
  {
    title: 'Average Sales',
    value: formatMoney(averageSales.value ?? 0, true),
    icon: 'tabler-coin',
  },
  {
    title: 'Max Purchased Items',
    value: maxPurchasedItems.value ?? 0,
    icon: 'tabler-shopping-cart-star',
  },
  {
    title: 'Max Sales',
    value: formatMoney(maxSales.value ?? 0, true),
    icon: 'tabler-shopping-cart-dollar',
  },
]))

</script>

<template>
  <VRow class="d-flex justify-start">    
    <VCol cols="12">
      <VExpansionPanels v-model="momPanel" variant="popout">
        <VExpansionPanel>
          <VExpansionPanelTitle >Month on Month Growth</VExpansionPanelTitle>
            <VExpansionPanelText class="d-flex justify-start">
              <VCardText>
                <VRow class="border-radius-lg">
                  <template
                    v-for="(data, id) in widgetData"
                    :key="id"
                  >
                    <VCol
                      cols="12"
                      sm="6"
                      md="3"                      
                    >
                      <div
                        class="d-flex justify-space-between"
                        :class="$vuetify.display.xs
                          ? id !== widgetData.length - 1 ? 'border-b pb-4' : ''
                          : $vuetify.display.sm
                            ? id < (widgetData.length / 2) ? 'border-b pb-4' : ''
                            : ''"
                      >
                        <div class="d-flex flex-column">
                          <h4 class="text-h4">
                            {{ data.value }}
                          </h4>

                          <div class="text-body-1">
                            {{ data.title }}
                          </div>
                        </div>

                        <VAvatar
                          variant="tonal"
                          rounded
                          size="46"
                        >
                          <VIcon
                            :icon="data.icon"
                            size="28"
                            class="text-high-emphasis"
                          />
                        </VAvatar>
                      </div>
                    </VCol>
                    <VDivider
                      v-if="$vuetify.display.mdAndUp ? id !== widgetData.length - 1
                        : $vuetify.display.smAndUp ? id % 2 === 0
                          : false"
                      vertical
                      inset
                      length="60"
                    />
                  </template>
                </VRow>
              </VCardText>              
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
                    Volume (Kg)
                  </th>
                  <th class="text-left">
                    Volume Changes
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
                  <td>{{ item.currentTotalItem }} </td>
                  <td>
                    {{ item.itemChange  }} 
                    <span :class="`text-xs ${item.itemChangePercentage == 0   ? '': (item.itemChangePercentage > 0 ? 'text-success' : 'text-error') }`">({{ item.itemChangePercentage.toFixed(2) }}%) </span>
                    <VIcon
                      size="md"
                      :color="item.itemChange > 0 ? 'success' : (item.itemChange === 0 ? '' : 'error')" 
                      :icon="item.itemChange > 0 ? 'tabler-trending-up' : (item.itemChange === 0 ? '' : 'tabler-trending-down')"
                    />
                  </td>
                  <td>{{ item.totalVolume.toFixed(2) }}</td>
                  <td>
                    {{ item.volumeChanges.toFixed(2) }} 
                    <span :class="`text-xs ${item.volumeChangePercentage == 0   ? '': (item.volumeChangePercentage > 0 ? 'text-success' : 'text-error') }`">({{ item.volumeChangePercentage.toFixed(2) }}%) </span>
                    <VIcon
                      size="md"
                      :color="item.volumeChanges > 0 ? 'success' : (item.volumeChanges === 0 ? '' : 'error')" 
                      :icon="item.volumeChanges > 0 ? 'tabler-trending-up' : (item.volumeChanges === 0 ? '' : 'tabler-trending-down')"
                    />
                  </td>
                  <td>{{ formatMoney(item.currentTotalSales) }}</td>                        
                  <td>
                    {{ formatMoney(item.salesChange) }} 
                    <span :class="`text-xs ${item.salesChangePercentage == 0   ? '': (item.salesChangePercentage > 0 ? 'text-success' : 'text-error') }`">({{ item.salesChangePercentage.toFixed(2) }}%) </span>
                    <VIcon
                      size="md"
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
</template>
