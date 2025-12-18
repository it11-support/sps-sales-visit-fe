<script lang="ts" setup>
import { useActivityStore, useProductStore, useStatisticStore } from '@/@core/stores';
import { ICompetitor } from '@/@core/typedefs';
import CheckIn from './CheckIn.vue';
import ReportForm from './ReportForm.vue';
import { getAnchorAndPrevDays, sortByCompanyPriority } from './functions';

const COMPANY_PRIORITY = ['SPS']


interface MonthlyValue {
  total_sales: number
  total_days: number
  items: number  
}

interface Props {
  assignmentId: string  
}

export type CompetitorOption = ICompetitor & {
  isNew?: boolean
  rawName?: string
}
const props = defineProps<Props>()
const activityStore = useActivityStore()
const statStore = useStatisticStore()
const productStore = useProductStore()
const loading = ref(true)
const showCheckIn = ref(false)
const loadAll = async () => {
  await activityStore.fetchActivityById(props.assignmentId)

  await statStore.fetchMonthlySales(props.assignmentId)
  // await customerStore.fetchCustomerById(defaultCustomerId.toString())
  await activityStore.fetchAllOptions()
  loading.value = false
}

onMounted(() => {
  productStore.fetchProductOptions()
  loadAll()
  activityStore.currentReport.assignment_id = Number(props.assignmentId)
})

const activity = computed(() => activityStore.activity)

const activeCustomer = computed(() => activityStore.customers.find((c) => c.CompanyId === activityStore.activeTab))

const sales = computed(() => {
  type CompanyGrowthData = {
    growth?: number
  } & Record<string, MonthlyValue>

  let result: Record<string, CompanyGrowthData> = {}

  if(!activityStore.activityReport.sales_growth?.length){
    for (const [companyId, months] of Object.entries(statStore.monthly_sales as Record<string, any>)) {
      result[companyId] = {}

      for (const [key, raw] of Object.entries(months as Record<string, any>)) {
        // ambil hanya month (YYYY-MM)
       if (key === 'growth') {
          result[companyId].growth = Number(raw) || 0
        continue
      }
        if (!/^\d{4}-\d{2}$/.test(key)) continue
        
        const value = raw as Partial<MonthlyValue>
        result[companyId][key] = {
          total_sales: value.total_sales ?? 0,
          total_days: value.total_days ?? 0,
          items: value.items ?? 0,
        }
      }
    }
  } else {
      const salesData = activityStore.activityReport.sales_growth?.reduce(
        (acc: any, curr: any) => {
          const companyId = curr.CompanyId
          const month = curr.date.slice(0, 7)

          if (!acc[companyId]) acc[companyId] = {}

          acc[companyId][month] = {
            items: Number(curr.total_items),
            total_sales: Number(curr.total_sales),
            date: curr.date, // ✅ simpan date
          }

          return acc
        },
        {} as any
      )

      for (const companyId of Object.keys(salesData)) {
        const meta = getAnchorAndPrevDays(salesData[companyId])
        if (!meta) continue

        const { currentKey, prevKey, anchorDay, prevDays } = meta

        const currentSales = salesData[companyId][currentKey].total_sales
        const prevSales = salesData[companyId][prevKey].total_sales

        const avgCurrent = currentSales / anchorDay
        const avgPrev = prevSales / prevDays

        salesData[companyId].growth =
          prevSales === 0 ? 0 : Number((((avgCurrent - avgPrev) / avgPrev) * 100).toFixed(2))
      }
      result = salesData
    }

    return sortByCompanyPriority(result)
})

const missingItems = computed(() => {
  let items : Record<string, any[]> = {}
  if(!activityStore.activityReport.missing_items?.length){
    
    for (const [key, value] of Object.entries(statStore.monthly_sales)) {
      items[key] = value.missing_items
    }    
  } else {
    items = activityStore.activityReport.missing_items.reduce((acc: Record<string, any[]>, item: any) => {
      const companyId = item?.product?.CompanyId
      if (!companyId) return acc
      if (!acc[companyId]) acc[companyId] = []
      acc[companyId].push(
        {
          ItemCode: item.product?.ItemCode,
          ItemName: item.product?.ItemName,
          last_purchased: item.last_transaction_date,
          volume_kg: Number(item.last_transaction_volume ?? 0),
        }
      )
      return acc
    }, {} as Record<string, any[]>)
  }
  return sortByCompanyPriority(items)
})

</script>

<template>
<VBreadcrumbs
  class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
  :items="[
    {
      title: 'Home',
      to: '/',
      class: 'text-primary' 
    },
    { 
      title: 'Activities', 
      to: { 
        name: 'activity-list' 
      },
      class: 'text-primary'
    }, 
    {
      title: 'Activity Report',     
    }
  ]"
  >
  <template v-slot:prepend>
    <v-icon icon='tabler-home' size="small"></v-icon>
  </template>
</VBreadcrumbs>
<VCard class="mb-6">
  <VCardItem class="pb-4">
    <VCardTitle>CUSTOMER SUMMARY</VCardTitle>
  </VCardItem>
  <VCardText>
    <VRow>
      <VCol cols="12">
        <VTabs v-model="activityStore.activeTab">
          <VTab
            v-for="name in activityStore.tabs"
            :key="name"
            :value="name"
            @click="activityStore.setActiveTab(name)"
          >
            {{ name }}
          </VTab>
      </VTabs>
      </VCol>
    </VRow>
    <VRow>
      <VCol class="text-no-wrap" cols="12" lg="4" md="4" sm="12">
        <template v-if="loading">
          <VSkeletonLoader          
            type="article"
          />
        </template>
        <template v-if="!loading">
          <div class="d-flex flex-column gap-y-1">
              <div class="d-flex justify-space-between align-center">
                <h6 class="text-h6">
                  {{ formatFullDateWithSuffix(activity.scheduled_date) }}
                </h6> 
              </div>
             
              <div class="d-flex justify-start align-start flex-wrap">
                <h3
                  class="mb-0 flex-grow-1 min-width-0"
                  style="white-space: normal; word-break: break-word;"
                >
                 {{ activeCustomer?.CardName }}
                </h3>
                <VChip
                  :color="activeCustomer?.NonActive === 'N' ? 'success' : 'error'"
                  text-color="white"
                  size="small"
                  class="font-weight-medium flex-shrink-0"
                >
                  {{ activeCustomer?.NonActive === 'N' ? 'Active' : 'Inactive' }}
                </VChip>
              </div>

            <div class="d-flex justify-start gap-5 align-center py-2">
                <p class="mb-0">
                  Sales Person
                </p>
                 <span>{{ activeCustomer?.SlpName }}</span>
              </div>
               <div class="d-flex justify-start gap-5 align-center py-2">
                <p class="mb-0">
                  PIC
                </p>
                 <span>{{ activeCustomer?.CntctPrsn }}</span>
              </div>
  
            </div>
        </template>
      </VCol>     
    </VRow>
  </VCardText> 
</VCard>
<VCard class="mb-6">
  <VCardItem class="pb-4">
    <VCardTitle>GROWTH</VCardTitle>
  </VCardItem>
  <VCardText>
    <VRow>
      <VCol class="text-no-wrap" cols="12" lg="9" md="9" sm="12">
        <VTable class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6" density="compact">
        <thead>
          <tr class="text-center">
            <th scope="col">                
            </th>
            <th scope="col" class="text-center">
              Month
            </th>
            <th scope="col" class="text-center">
              Revenue
            </th>
            <th scope="col" class="text-center">
              Items
            </th>
            <th scope="col" class="text-center">
              PERCENTAGE
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(branchData, branchName) in sales" :key="branchName">
            <tr
              v-for="([month, rawValue], index) in Object.entries(branchData).filter(([k]) => k !== 'growth' && k !== 'missing_items')"
              :key="month"
            >
              <template v-if="typeof rawValue === 'object' && 'total_sales' in rawValue">
                <td v-if="index === 0" :rowspan="Object.keys(branchData).filter(k => k !== 'growth' && k !== 'missing_items').length" class="text-center m-2">
                  {{ branchName }}
                </td>

                <td class="text-center">{{ formatDateToMonthShort(month, false, true) }}</td>
                <td class="text-center">{{ formatMoney(rawValue.total_sales) }}</td>
                <td class="text-center">{{ rawValue.items }}</td>

                <td v-if="index === 0" :rowspan="Object.keys(branchData).filter(k => k !== 'growth' && k !== 'missing_items').length" class="text-center">
                  <VIcon
                    size="md"
                    :color="(branchData?.growth ?? 0) > 0 ? 'success' : 'error'" 
                    :icon="(branchData?.growth ?? 0) > 0 ? 'tabler-trending-up' : 'tabler-trending-down'"
                  />
                  <span>{{ branchData.growth }}%</span>
                </td>
              </template>
            </tr>
          </template>
        </tbody>
        </VTable>
      </VCol>
    </VRow>
    <VRow>       
      <VCol class="text-no-wrap" cols="12" lg="9" md="9" sm="12">
        <h6 class="text-h6 mb-4">
          NON-ACTIVE ITEMS
        </h6>
        <template v-if="loading">
          <VSkeletonLoader
            v-for="i in 3"
            :key="i"
            type="list-item-two-line"
          />
        </template>
        <template v-else>
          <VTable class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6" density="compact">
            <thead>
              <tr>
                 <th scope="col">
                  
                </th>              
                <th scope="col">
                  ITEM NAME
                </th>
                <th scope="col" class="text-center">
                  LAST PURCHASED
                </th>
                <th scope="col" class="text-center">
                  VOLUME (Kg)
                </th>
              </tr>
            </thead>
            <tbody class="text-base">
              <template v-for="(branchData, branchName) in missingItems" :key="branchName">
                <template v-for="(item, idx) in branchData" :key="item.ItemCode">
                  <tr>
                    <!-- Branch name hanya di baris pertama -->
                    <td v-if="idx === 0" :rowspan="branchData.length" class="text-center pr-2">
                      {{ branchName }}
                    </td>
                    <!-- Item details -->                   
                    <td>{{ item.ItemName }}</td>
                    <td class="text-center">{{ formatDate(item.last_purchased) }}</td>
                    <td class="text-center">{{ item.volume_kg.toFixed(2) }}</td>
                  </tr>
                </template>
                <tr v-if="!branchData || !branchData.length">
                  <td>{{ branchName }}</td>
                  <td colspan="3" class="text-center text-muted">No missing items</td>
                </tr>
              </template>
            </tbody>
          </VTable>
        </template>
      </VCol>
    </VRow>
  </VCardText>
</VCard>
<ReportForm :assignment-id="props.assignmentId"/>

<CheckIn :show="showCheckIn" :assignmentId="Number(props.assignmentId)" @update:show="showCheckIn = $event" />
</template>
<style lang="scss">
.app-autocomplete .v-field__input {
  min-block-size: 135px !important;
}

.v-table > .v-table__wrapper > table > tbody > tr > td {
  padding-inline: 12px !important;
}

.pe-5 {
  max-inline-size: 100px !important;
}

@media (max-width: 768px) {
  .app-autocomplete .v-field__input {
    min-block-size: unset !important;
  }
}
</style>
