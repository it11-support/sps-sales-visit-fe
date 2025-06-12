<script lang="ts" setup>
import { useActivityStore, useStatisticStore } from '@/@core/stores';

interface Props {
  assignmentId: string
}

const props = defineProps<Props>()

const activityStore = useActivityStore()
const statStore = useStatisticStore()
onMounted(async () => {
  await activityStore.fetchActivityReport(props.assignmentId)
  await statStore.fetchMoMSummary(activityStore.report.assignment.customer_id)
})

const monthly_summary = computed(() => statStore.monthly_summary)

const summary = computed(() => {
  if (!monthly_summary.value?.length) return []

  const raw = [...monthly_summary.value]
    .reverse()
    .slice(0, 3)
    .map(({ month, items }) => {
      const total_sales = items.reduce((sum, item) => sum + item.total_sales, 0)
      const total_item = items.length

      return {
        month,
        total_item,
        total_sales,
      }
    })

  return raw.map((item, index, arr) => {
    if (index === arr.length - 1) {
      return {
        ...item,
        growth_percent: null,
      }
    }

    const prev = arr[index + 1]
    const growth =
      prev.total_sales === 0
        ? null
        : ((item.total_sales - prev.total_sales) / prev.total_sales) * 100

    return {
      ...item,
      growth_percent: growth !== null ? Math.round(growth * 100) / 100 : null,
    }
  })
})

const missingItems = computed(() => {
   if (!monthly_summary.value || monthly_summary.value.length < 3) {
    return []
  }

  const items = [...monthly_summary.value].reverse().slice(1, 3).map(item => item.items)

  const itemsSet = new Set(items[0].map(item =>item.item_code))
  const missing = items[1].filter(item => !itemsSet.has(item.item_code))
  return missing
})

</script>

<template>
  <section>
    <VRow>      
      <VCol cols="12" >
        <VCard class="pa-2 pa-sm-2">
          <VCardItem class="pb-4">
            <VCardTitle>ACTIVITY REPORT DETAIL</VCardTitle>
          </VCardItem>
          <VCardText>
            <VRow>
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  CUSTOMER
                </h6>
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VListItem>
                  <VListItemTitle class="d-flex">
                    <span class="me-4" style="min-inline-size: 120px;">Sales Person</span>
                    <span>{{ activityStore.report?.assignment?.assigned_to?.sales_person?.SlpName }}</span>
                  </VListItemTitle>

                  <VListItemTitle class="d-flex">
                    <span class="me-4" style="min-inline-size: 120px;">Outlet Name</span>
                    <span>{{ activityStore.report?.assignment?.customer?.CardName }}</span>
                  </VListItemTitle>

                  <VListItemTitle class="d-flex">
                    <span class="me-4" style="min-inline-size: 120px;">Outlet PIC</span>
                    <span>{{ activityStore.report?.assignment?.customer?.CntctPrsn }}</span>
                  </VListItemTitle>

                  <VListItemTitle class="d-flex">
                    <span class="me-4" style="min-inline-size: 120px;">Status</span>
                    <span>{{ activityStore.report.assignment?.customer?.NonActive === "Y" ? 'Inactive' : 'Active' }}</span>
                  </VListItemTitle>
                </VListItem>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>            
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  GROWTH
                </h6>
                <template v-if="statStore.loadingState">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VTable v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="border text-high-emphasis mb-6">
                  <thead>
                    <tr>
                      <th scope="col">
                        MONTH
                        </th>
                        <th scope="col">
                          TOTAL ITEMS
                        </th>
                        <th
                          scope="col"
                          class="text-center"
                        >
                          TOTAL REVENUE
                        </th>
                        <th
                          colspan="2"
                          scope="col"
                          class="text-center"
                        >
                          PERCENTAGE
                        </th>
                    </tr>
                  </thead>
                  <tbody class="text-base">
                    <tr
                      v-for="(item, index) in summary"
                      :key="index"
                    >
                      <td class="text-no-wrap">
                        {{ item.month }}
                      </td>
                      <td class="text-no-wrap ">
                        {{ item.total_item }}
                      </td>
                      <td class="text-center">
                        {{ formatMoney(item.total_sales) }}
                      </td>
                      <td class="text-center" v-if="item.growth_percent && item.growth_percent < 0 ">                  
                        DOWN
                        <span class="text-error text-muted text-sm">
                          {{ Math.abs(item.growth_percent) }} % 
                          <VIcon size="sm" icon="tabler-arrow-down" />
                        </span>
                      </td>
                      <td class="text-center" v-else-if="item.growth_percent && item.growth_percent > 0 ">                  
                        UP
                        <span class="text-success text-muted text-sm">
                          {{ Math.abs(item.growth_percent) }} % 
                          <VIcon size="sm" icon="tabler-arrow-up" />
                        </span>
                      </td>
                      <td class="text-center" v-else>
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader
                    type="article"
                  />
                </template>
                <VTable v-if="!activityStore.loadingAssignment && !statStore.loadingState" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <thead>
                    <tr>
                      <th scope="col">
                        REASON QTY DROP
                      </th>
                      <th scope="col">
                        VISIT PURPOSE
                      </th>                       
                    </tr>
                  </thead>
                  <tbody class="text-base">
                    <tr>
                      <td class="text-no-wrap">
                        {{ activityStore.report?.reason_qty_drop?.reason }}
                      </td>
                      <td class="text-no-wrap">
                        {{ activityStore.report?.activity_purpose?.purpose }}
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>            
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  NON ACTIVE ITEMS
                </h6>
                <template v-if="statStore.loadingState">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VTable v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <thead>
                    <tr>
                      <th scope="col">
                        ITEM CODE
                      </th>
                      <th scope="col">
                        ITEM NAME
                      </th>
                      <th scope="col">
                        LAST PURCHASED
                      </th>
                      <th scope="col">
                        VOLUME
                      </th>
                    </tr>
                  </thead>
                  <tbody class="text-base">
                    <tr
                      v-for="(item, index) in missingItems"
                      :key="index"
                    >
                      <td class="text-no-wrap">
                        {{ item.item_code }}
                      </td>
                      <td class="text-no-wrap">
                        {{ item.description }}
                      </td>
                      <td class="text-no-wrap">
                        {{ formatDate(item.last_invoice_date) }}
                      </td>
                      <td class="text-no-wrap">
                        {{  `${item.volume.toFixed(2)} ${item.unit}` }} 
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>            
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  PRODUCT OFFERING
                </h6>
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <VListItem
                    v-for="(item, index) in activityStore.report?.products"
                    :key="index"
                  >
                    <VListItemTitle>
                      {{ item.ItemName }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCol>
            </VRow>            
          </VCardText>
          <VCardText>            
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  PRODUCT ISSUE
                </h6>
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <VListItem>
                    <VListItemTitle>
                      {{ activityStore.report?.product_issue }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>            
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  NEXT ACTION
                </h6>
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <VListItem>
                    <VListItemTitle>
                      {{ activityStore.report?.next_action }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText>
            <VRow class="print-row mb-2">
              <VCol class="text-no-wrap" cols="12" lg="6" md="6" sm="12">
                <h6 class="text-h6 mb-4">
                  ADDITIONAL NOTES
                </h6>
                <template v-if="activityStore.loadingAssignment">
                  <VSkeletonLoader          
                    type="article"
                  />
                </template>
                <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                  <VListItem>
                    <VListItemTitle>
                      {{ activityStore.report?.additional_note }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

