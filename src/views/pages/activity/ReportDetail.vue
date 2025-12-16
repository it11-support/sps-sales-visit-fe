
<script lang="ts" setup>
  import { useActivityStore, useStatisticStore } from '@/@core/stores';
import { IActivityReport } from '@/@core/typedefs';
import { VSheet } from 'vuetify/components';

  type Props = {
    assignmentId: string
  }

  const props = defineProps<Props>()
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN
  const activityStore = useActivityStore()
  const statStore = useStatisticStore()
  const activityReport = ref<IActivityReport>()
  const loading = ref(true)

  onMounted(async() => {
  await activityStore.fetchActivityReport(props.assignmentId)
  await statStore.fetchMonthlySales(props.assignmentId)

  loading.value = false
  })

  watch(() => activityStore.activityReport, (newVal) => {
    if (!newVal || Object.keys(newVal).length === 0) return
  activityReport.value = newVal
  })

  const activity = computed(() => activityStore.activity)
  const activeCustomer = computed(() => activityStore.customers.find((c) => c.CompanyId === activityStore.activeTab))
  const customers = computed(() => activityStore.customers)
  const monthly_sales = computed(() => statStore.monthly_sales ?? {})
  const details = computed(() => activityStore.activityReport ?? {})

  const viewMap = computed(() => {
    if(!details.value) return

    const {lat, lng} = details.value 
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
    <VCard class="pa-2 pa-sm-2 mb-6" >
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
        <VCol class="text-no-wrap px-6" cols="12" lg="4" md="4" sm="12">
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
    </VCard>
    <VCard class="mb-6">
      <VCardText class="pa-3">
        <VRow no-gutters class="ga-3">
          <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
               <VRow>
                <VCol>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text">GROWTH</div>
                  </div>
                </VCol>
              </VRow>
              <template v-if="loading">
                <VSkeletonLoader          
                  type="article"
                />
              </template>
              <VRow v-for="(data , name) in details.group_growth" :key="name">
                <VCol class="mb-2">
                <div class="d-flex align-center justify-space-between">
                  <div class="text"> {{ name }}</div>
                  <div
                    :class="[
                      'font-weight-medium d-flex align-center',
                      Number(data.growth_percent) > 0 ? 'text-success' : 'text-error'
                    ]"
                  >
                    <VIcon
                      size="md"
                      :color="Number(data.growth_percent) > 0 ? 'success' : 'error'" 
                      :icon="Number(data.growth_percent) > 0 ? 'tabler-trending-up' : 'tabler-trending-down'"
                      />
                    <span class="ms-1">({{ (Number(data.growth_percent)).toFixed(2) }}%)</span>
                  </div>
                </div>
                <div class="border-t border-gray-300 my-2"></div>
                <VRow >
                  <VCol
                    cols="12"
                    lg="12"
                    v-for="([period, rawValue], index) in Object.entries(data).filter(([k]) => k !== 'growth_percent')"
                    :key="period"
                  >
                    <template v-if="rawValue && typeof rawValue === 'object' && 'total_amount' in rawValue">
                      <div class="d-flex justify-space-between align-center">
                        <!-- tampilkan nama period, misal "October 2025" -->
                        <span>{{ period }}</span>

                        <!-- format total_amount -->
                        <span>{{ formatMoney(Number(rawValue?.total_amount ?? 0)) }}</span>

                        <!-- total_items -->
                        <span class="text-center">{{ rawValue?.total_items ?? 0 }} items</span>
                      </div>
                    </template>
                  </VCol>
                </VRow>
                </VCol>
            </VRow>
            </VSheet>
          </VCol>
          <VCol>
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text">NON ACTIVE ITEMS</div>
                  </div>
                </VCol>
              </VRow>
              <template v-if="loading">
                <VSkeletonLoader
                  type="article"
                />
              </template>
              <VRow v-else>                
                <VCol>
                  <VTable class="invoice-preview-table text-high-emphasis overflow-hidden mb-6" density="compact">
                    <thead  class="text-xs">
                      <tr>
                        <th scope="col">                          
                        </th>                      
                        <th scope="col" class="text-center">
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
                    <tbody class="text-xs">
                      <template v-for="(branchData, branchName) in monthly_sales" :key="branchName">
                        <template v-for="(item, idx) in branchData.missing_items" :key="item.ItemCode">
                          <tr>
                            <!-- Branch name hanya di baris pertama -->
                            <td v-if="idx === 0" :rowspan="branchData.missing_items.length" class="text-center pr-2">
                              {{ branchName }}
                            </td>
                            <!-- Item details -->                            
                            <td>{{ item.ItemName }}</td>
                            <td class="text-center">{{ formatDate(item.last_purchased) }}</td>
                            <td class="text-center">{{ item.volume_kg.toFixed(2) }}</td>
                          </tr>
                        </template>
                        <tr v-if="!branchData.missing_items || !branchData.missing_items.length">
                          <td>{{ branchName }}</td>
                          <td colspan="3" class="text-center text-muted">No missing items</td>
                        </tr>
                      </template>
                    </tbody>
                  </VTable>
                </VCol>
              </VRow>
            </VSheet>
          </VCol> 
        </VRow>
      </VCardText>    
    </VCard>

    <VCard class="mb-6">
      <VCardText class="pa-3">
        <VRow no-gutters class="ga-3">
          <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text">PRODUCTS OFFERED</div>
                  </div>
                </VCol>
              </VRow>
               <template v-if="loading">
                <VSkeletonLoader
                  type="article"
                />
              </template>
              <VRow v-for="data in details.products" :key="data.ItemCode">
                <VCol              
                  class="pa-2"
                  >
                  <div class="d-flex align-center justify-space-between">
                    <div class="text-sm"> {{ data.ItemName }}</div>
                  </div>
                </VCol>
              </VRow>
            </VSheet>
          </VCol>
          <VCol>
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text">COMPETITORS</div>
                  </div>
                </VCol>
              </VRow>
               <template v-if="loading">
                <VSkeletonLoader
                  type="article"
                />
              </template>
              <VRow v-else>
                <VCol>
                  <VTable class="invoice-preview-table text-high-emphasis overflow-hidden mb-6" density="compact">
                    <thead>
                      <tr>
                        <th scope="col">
                          SUPPLIER
                        </th>
                        <th scope="col" class="text-center">
                          PRODUCT
                        </th>
                        <th scope="col" class="text-center">
                          PRICE
                        </th>
                        <th scope="col" class="text-center">
                          QTY
                        </th>                  
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="data in details.competitors" :key="data.id">
                        
                          <tr class="text-center">                    
                            <td>{{ data.name }}</td>
                            <td>{{ data.product }}</td>
                            <td>{{ formatMoney(data.price as number) }}</td>
                            <td>{{ data.qty?.toFixed(2) }}</td>
                          </tr>

                      </template>
                    </tbody>
                  </VTable>
                </VCol>
              </VRow>
            </VSheet>
          </VCol> 
        </VRow>
      </VCardText>    
    </VCard>
    
    <VCard class="mb-6">
      <VCardText class="pa-3">
         <template v-if="loading">
          <VSkeletonLoader
            type="article"
          />
        </template>
        <VRow no-gutters class="ga-3" v-else>
          <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol cols="12">
                  <span class="font-weight-medium"> Visit Purpose</span>
                  <ul class="pl-4 mt-2 text-sm text-left">
                    <li v-for="data in details.activity_purposes" :key="data.id">
                      {{ data.purpose }}
                    </li>
                  </ul>
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12">
                  <span class="font-weight-medium">Reason Qty Drop</span>
                  <ul class="pl-4 mt-2 text-sm text-left">
                    <li v-for="data in details.reason_qty_drops" :key="data.id">
                      {{ data.reason }}
                    </li>
                  </ul>
                </VCol>
              </VRow>
            </VSheet>
          </VCol>
          <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span> Product Issue</span>
                  </div>                 
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-sm"> {{ details.product_issue }}</span>
                  </div>                 
                </VCol>
              </VRow>
            </VSheet>
          </VCol>
          <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span>Additional Notes</span>
                  </div>                 
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-sm"> {{ details.additional_note }}</span>
                  </div>                 
                </VCol>
              </VRow>
            </VSheet>
          </VCol>
           <VCol cols="12" lg="4" sm="12">
            <VSheet class="border rounded pa-5">
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span>Next Action</span>
                  </div>                 
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" lg="12">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-sm"> {{ details.next_action }}</span>
                  </div>                 
                </VCol>
              </VRow>
            </VSheet>
          </VCol>
        </VRow>
      </VCardText>    
    </VCard>
   
    <VCard class="mb-6">
      <VCardText class="pa-3">
        <template v-if="loading">
          <VSkeletonLoader
            type="article"
          />
        </template>
        <VRow no-gutters class="ga-3" v-else>
          <VCol cols="12" lg="4" sm="12" class="text-no-wrap">
            <VImg 
              :width="$vuetify.display.smAndDown ? 300 : 400"
              aspect-ratio="4/3"
              cover
              :src="`${baseDomain}/storage/${activityStore.activityReport?.image_path}`"
            />
          </VCol>
            <VCol class="text-no-wrap" cols="12" v-if="details.check_in !== undefined">
              <span class="me-2" style="min-inline-size: 120px;">Check In Date</span>
              <span>{{ formatDate(details.check_in, true ) }}</span>
            </VCol>
            <VCol class="text-no-wrap" cols="12" v-if="details.check_out !== undefined">
              <span class="me-2" style="min-inline-size: 120px;">Check Out Date</span>
              <span>{{ formatDate(details.check_out, true ) }}</span>
            </VCol>
            <VCol class="text-no-wrap" cols="12" v-if="!activityStore.loadingAssignment && viewMap">
              <VBtn color="success" size="small" @click="handleViewOnMap">
                <VIcon icon="tabler-map-2 mr-2" /> View Location
              </VBtn>
            </VCol>
        </VRow>
      </VCardText>    
    </VCard>

  </section>
</template>
