<script lang="ts" setup>
import { useStatisticStore } from '@/@core/stores/statistic';
const yoyPanel = ref()

enum AVG_CRITERIA {
  BELOW = 'BELOW',
  ABOVE = 'ABOVE',
  AVERAGE = 'AVERAGE'
}

interface Props {
  id: string
}


const statStore = useStatisticStore()
const props = defineProps<Props>()

onMounted(async () => {
  await statStore.fetchYoySummary(props.id)

  changesData.value.map((item: any) => {
    console.log(item.items_yoy_percent != null)
  })
})
const changesData = computed(() => statStore.yoy_summary)
const maxItems = computed(() => statStore.maxItems)
const maxSales = computed(() => statStore.maxSales)
const averageItems  = computed(() => statStore.avgItems)
const avgSales = computed(() => statStore.avgSales)
 
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

const widgetData = computed(() => ([
  { title: 'Average Purchased Items', value: averageItems.value.toFixed(2), icon: 'tabler-timeline' },
  { title: 'Average Sales', value: formatMoney(avgSales.value), icon: 'tabler-coin' },
  { title: 'Max Purchased Items', value: maxItems.value, icon: 'tabler-shopping-cart-star' },
  { title: 'Max Sales', value: formatMoney(maxSales.value), icon: 'tabler-shopping-cart-dollar' },
]))

</script>
<template>
  <VRow class="d-flex justify-start">
    <VCol cols="12">
      <VExpansionPanels v-model="yoyPanel" variant="popout">
        <VExpansionPanel>
          <VExpansionPanelTitle >Year on Year Growth</VExpansionPanelTitle>          
          <VExpansionPanelText>
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
                    class="px-6"
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
                        size="42"
                      >
                        <VIcon
                          :icon="data.icon"
                          size="26"
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
                    Volume
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
                  <td>{{ item.month }}</td>
                  <td>{{ item.items_now }} </td>
                  <td>
                    {{ item.items_yoy  }} 
                    <span :class="`text-xs ${item.items_yoy_percent == 0   ? '': (item.items_yoy_percent > 0 ? 'text-success' : 'text-error') }`"> ({{ item.items_yoy_percent }}%) </span>
                    <VIcon 
                      size="md"
                      :color="item.items_yoy_percent == 0  ? '' : (item.items_yoy_percent > 0 ? 'success' : 'error')" 
                      :icon="item.items_yoy_percent == 0 ? '' : (item.items_yoy_percent >  0 ? 'tabler-trending-up' : 'tabler-trending-down')"
                    />
                  </td>
                   <td>{{ item.volume_now.toFixed(2) }} </td>
                  <td>
                    {{ item.volume_yoy.toFixed(2) }}
                    <span :class="`text-xs ${item.volume_yoy_percent == 0   ? '': (item.volume_yoy_percent > 0 ? 'text-success' : 'text-error') }`">({{ item.volume_yoy_percent }}%) </span>
                    <VIcon 
                      size="md"
                      :color="item.items_yoy_percent == 0  ? '' : (item.items_yoy_percent > 0 ? 'success' : 'error')" 
                      :icon="item.items_yoy_percent == 0 ? '' : (item.items_yoy_percent >  0 ? 'tabler-trending-up' : 'tabler-trending-down')"
                    />
                  </td>
                  <td>{{ formatMoney(item.sales_now) }} </td>
                  <td>
                    {{ formatMoney(item.sales_yoy) }}
                    <span :class="`text-xs ${item.sales_yoy_percent == 0   ? '': (item.sales_yoy_percent > 0 ? 'text-success' : 'text-error') }`">({{ item.sales_yoy_percent }}%) </span>
                    <VIcon
                      size="md"
                      :color="item.sales_yoy_percent == 0  ? '' : (item.sales_yoy_percent > 0 ? 'success' : 'error')" 
                      :icon="item.sales_yoy_percent == 0 ? '' : (item.sales_yoy_percent >  0 ? 'tabler-trending-up' : 'tabler-trending-down')"
                    />
                  </td>
                  <td>
                    <VChip
                      :color="calculateAverage(item.items_now , averageItems) === AVG_CRITERIA.ABOVE 
                        ? 'success' 
                        : (calculateAverage(item.items_now , averageItems) === AVG_CRITERIA.BELOW  ? 'error' : '')" 
                      label 
                      size="small"
                      class="mb-2"
                    > 
                      {{ calculateAverage(item.items_now , averageItems) }} 
                    </VChip>
                  </td>
                  <td>
                    <VChip
                      :color="calculateAverage(item.sales_now , avgSales) === AVG_CRITERIA.ABOVE 
                        ? 'success' 
                        : (calculateAverage(item.sales_now , avgSales) === AVG_CRITERIA.BELOW  ? 'error' : '')" 
                      label 
                      size="small"
                      class="mb-2"
                    > 
                      {{ calculateAverage(item.sales_now , avgSales) }} 
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
