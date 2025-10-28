<script lang="ts" setup>
import { useStatisticStore } from '@/@core/stores/statistic';

interface Props {
  id: string
  companyId: string
}

const statStore = useStatisticStore()
const props = defineProps<Props>()
const panel = ref(0)
const rank = ref(5)
const {id} = toRefs(props)

onMounted(async () => {
  await statStore.fetchMoMSummary(id.value)
})

const topSales = computed(() => statStore.summary?.top_items ?? [])

</script>

<template> 
  <VRow class="d-flex justify-start">
    <VCol cols="12">
      <VExpansionPanels v-model="panel" variant="popout">
        <VExpansionPanel>
            <VExpansionPanelTitle>Top Sales</VExpansionPanelTitle>
            <VExpansionPanelText>
               <VRow class="d-flex justify-start">
                <VCol cols="12" md="3" lg="3">
                  <AppSelect 
                    v-model="rank" 
                    placeholder="Select Rank" 
                    label="Rank"                   
                    :items="[
                      { value: 3, title: 'Top 3' },
                      { value: 5, title: 'Top 5' },
                      { value: 10, title: 'Top 10' },
                    ]" 
                    clearable
                    @update:model-value="statStore.updateFilters(id, { rank: $event })"
                  />
                </VCol>
              </VRow>
              <VDivider class="my-4" />
              <VSkeletonLoader v-if="statStore.loadingState" type="article" />
              <VTable min-height="300px" fixed-header class="no-scroll" :items="topSales" v-if="!statStore.loadingState">
                <thead>
                  <tr>
                    <th class="text-left">
                      Item Code
                    </th>
                    <th class="text-left">
                      Description
                    </th>
                    <th class="text-left">
                      Volume (Kg)
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
                  <tr v-for="item in topSales" :key="item.item_code">
                    <td>{{ item.item_code }}</td>
                    <td>{{ item.description }}</td>
                    <td>{{ item.volume.toFixed(2) }}</td>
                    <td>{{ formatMoney(item.price) }}</td>
                    <td>{{ formatMoney(item.total_sales) }}</td>
                    <td>{{ `${item.contribution.toFixed(2)} % ` }}</td>
                    <td>{{ formatDate(item.last_invoice_date) }}</td>
                  </tr>
                </tbody>
              </VTable>
            </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </VCol>
  </VRow>
</template>
