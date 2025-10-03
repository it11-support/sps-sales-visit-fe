<script lang="ts" setup>
import { useActivityStore, useStatisticStore } from '@/@core/stores';

interface Props {
  assignmentId: string
}

const props = defineProps<Props>()
const baseDomain = import.meta.env.VITE_BASE_DOMAIN
const activityStore = useActivityStore()
const statStore = useStatisticStore()

onMounted(async () => { 
  await activityStore.fetchActivityReport(props.assignmentId)
  const defaultCustomerId = Number(activityStore.customers.find((customer) => customer.CompanyId === activityStore.activeTab )?.id)
  await statStore.fetchMoMSummary(defaultCustomerId?.toString() ?? '')
})


const currentReport = computed(() => activityStore.activityReport[activityStore.activeTab])

const customer = computed(() => activityStore.customers.find((customer) => customer.CompanyId === activityStore.activeTab ))

const monthly_summary = computed(() => statStore.summary[activityStore.activeTab]?.monthly_summary)
const competitors = computed(() => activityStore.activityReport[activityStore.activeTab]?.competitors ?? [])
const summary = computed(() => {
  if (!monthly_summary.value?.length) return []

  const raw = [...monthly_summary.value]
    .reverse()
    .slice(0, 2)
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

const viewMap = computed(() => {
  if(!activityStore.report.assignment) return

  const {lat, lng} = activityStore.report.assignment  
  return `https://www.google.com/maps?q=${lat},${lng}`
})

const handleViewOnMap = () => {
  window.open(viewMap.value, '_blank')
}
</script>

<template>
  <section>
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
        title: 'Activity Report Detail',     
      }
    ]"
    >
    <template v-slot:prepend>
      <v-icon icon='tabler-home' size="small"></v-icon>
    </template>
  </VBreadcrumbs>
    <VRow>      
      <VCol cols="12" >
        <VCard class="pa-2 pa-sm-2">
          <VRow>
            <VCol cols="12">
              <VCardItem class="pb-4">
                <VCardTitle>ACTIVITY REPORT DETAIL</VCardTitle>
              </VCardItem>
              </VCol>
          </VRow>
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
            <VCol cols="12" md="6" sm="12" lg="6">
              <VCardText>
                <VRow>
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      CUSTOMER
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VListItem v-if="!activityStore.loadingAssignment">                     
                      <VListItemTitle class="d-flex mb-1">
                        <span class="me-2" style="min-inline-size: 120px;">Outlet Name</span>
                        <div>
                          <span>{{ customer?.CardName }}</span>
                        </div>                       
                      </VListItemTitle>

                      <VListItemTitle class="d-flex"> <VListItemTitle class="d-flex"></VListItemTitle>
                        <span class="me-2" style="min-inline-size: 120px;">Outlet PIC</span>
                        <div>
                          <span>{{ customer?.CntctPrsn }}</span>
                        </div>                      
                      </VListItemTitle>

                      <VListItemTitle class="d-flex">
                        <span class="me-2" style="min-inline-size: 120px;">Status</span>
                         <div>
                          <span>{{ customer?.NonActive === "Y" ? 'Inactive' : 'Active' }}</span>
                        </div>                         
                      </VListItemTitle>
                    </VListItem>
                   
                  </VCol>
                  <VCol class="text-no-wrap" cols="12">
                    <VImg                      
                      :width="$vuetify.display.smAndDown ? 200 : 400"
                      aspect-ratio="4/3"
                      cover
                      :src="`${baseDomain}/storage/${activityStore.activityReport[activityStore.activeTab]?.image_path}`"
                    />
                  </VCol>
                  <VCol class="text-no-wrap" cols="12" v-if="activityStore.currentReport.assignment?.check_in !== undefined">
                    <span class="me-2" style="min-inline-size: 120px;">Check In Date</span>
                    <span>{{ formatDate(activityStore.currentReport.assignment?.check_in as unknown as  string, true ) }}</span>
                  </VCol>
                  <VCol class="text-no-wrap" cols="12" v-if="activityStore.currentReport.assignment?.check_out !== undefined">
                    <span class="me-2" style="min-inline-size: 120px;">Check Out Date</span>
                    <span>{{ formatDate(activityStore.currentReport.assignment?.check_out as unknown as  string, true ) }}</span>
                  </VCol>
                  <VCol class="text-no-wrap" cols="12" v-if="!activityStore.loadingAssignment && viewMap">
                    <VBtn color="success" size="small" @click="handleViewOnMap">
                      <VIcon icon="tabler-map-2 mr-2" /> View Location
                    </VBtn>
                  </VCol>
                </VRow>
              </VCardText>
              <VCardText v-if="missingItems.length">
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      NON ACTIVE ITEMS
                    </h6>
                    <template v-if="statStore.loadingState">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VTable v-if="!statStore.loadingState && !activityStore.loadingAssignment && missingItems.length" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
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
                            VOLUME (Kg)
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
              <VCardText v-if="activityStore.report?.products">
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap w-100" cols="12">
                    <h6 class="text-h6 mb-4">
                      PRODUCT OFFERING
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment && activityStore.report?.products.length" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
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
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      PRODUCT ISSUE
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment && currentReport.product_issue" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                      <VListItem v-for="item in currentReport.product_issue?.split('\n') || []" :key="item">
                        <VListItemTitle >
                          {{ item }}
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCol>
                </VRow>
              </VCardText>
              <VCardText>            
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      NEXT ACTION
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment && currentReport.next_action" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                      <VListItem v-for="item in currentReport.next_action.split('\n') || []" :key="item">
                        <VListItemTitle>
                          {{ item }}
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCol>
                </VRow>
              </VCardText>
              <VCardText>
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      ADDITIONAL NOTES
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    <VList v-if="!statStore.loadingState && !activityStore.loadingAssignment && currentReport.additional_note" class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
                      <VListItem v-for="item in currentReport.additional_note.split('\n') || []" :key="item">
                        <VListItemTitle>
                          {{ item }}
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCol>
                </VRow>
              </VCardText>
            </VCol>
            <VCol cols="12" md="6" sm="12" lg="6">
              <VCardText>
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap" cols="12">
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
                  <VCol class="text-no-wrap" cols="12">
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
                            {{ activityStore.activityReport[activityStore.activeTab].reason_qty_drop?.reason }}
                          </td>
                          <td class="text-no-wrap">
                            {{ activityStore.activityReport[activityStore.activeTab].activity_purpose?.purpose }}
                          </td>
                        </tr>
                      </tbody>
                    </VTable>
                  </VCol>
                </VRow>
              </VCardText>
              <VCardText>
                <VRow class="print-row mb-2">
                  <VCol class="text-no-wrap" cols="12">
                    <h6 class="text-h6 mb-4">
                      COMPETITORS
                    </h6>
                    <template v-if="activityStore.loadingAssignment">
                      <VSkeletonLoader          
                        type="article"
                      />
                    </template>
                    
                      <VTable v-if="!statStore.loadingState && !activityStore.loadingAssignment && competitors" class="border text-high-emphasis mb-6">
                      <thead>
                        <tr>
                          <th scope="col">
                              NAME
                            </th>
                            <th scope="col">
                              ADDRESS
                            </th>
                            <th
                              scope="col"
                              class="text-center"
                            >
                              PRODUCT
                            </th>
                            <th                              
                              scope="col"
                              class="text-center"
                            >
                              PRICE
                            </th>
                             <th                             
                              scope="col"
                              class="text-center"
                            >
                              QTY
                            </th>
                        </tr>
                      </thead>
                      <tbody class="text-base">
                        <tr
                          v-for="(item, index) in competitors"
                          :key="index"
                        >
                          <td class="text-no-wrap">
                            {{ item.name }}
                          </td>
                          <td class="text-no-wrap ">
                            {{ item.address }}
                          </td>
                          <td class="text-center">
                            {{ item.product }}
                          </td>
                           <td class="text-center">
                            {{ item.price ? formatMoney(item.price) : '' }}
                          </td>
                           <td class="text-center">
                            {{ item.qty }}
                          </td>
                        </tr>
                      </tbody>
                    </VTable>
                     
                  </VCol>
                </VRow>
              </VCardText>
            </VCol>
          </VRow>
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

