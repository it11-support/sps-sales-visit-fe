<script lang="ts" setup>
import AppSelect from '@/@core/components/app-form-elements/AppSelect.vue';
import { useActivityStore, useConfigStore, useProductStore, useStatisticStore } from '@/@core/stores';
import { ICompetitor } from '@/@core/typedefs';
import { nextTick } from 'vue';
import { VForm } from 'vuetify/components';
import CheckIn from './CheckIn.vue';

type VFormInst = InstanceType<typeof VForm> | null

interface Props {
  assignmentId: string  
}

export type CompetitorOption = ICompetitor & {
  isNew?: boolean;
  rawName?: string
}
const props = defineProps<Props>()
const activityStore = useActivityStore()
const statStore = useStatisticStore()
const productStore = useProductStore()
const loading = ref(true)
// const competitors = ref<ICompetitor[]>([])
const search = ref('')
const isSelecting = ref(false)
const form = reactive<Record<string, InstanceType<typeof VForm> | null>>({})

const configStore = useConfigStore()
const router = useRouter()
const isDraft = ref(false)
const showCheckIn = ref(false)
const competitors = reactive<Record<string, ICompetitor[]>>({})
const loadAll = async () => {
  await activityStore.fetchActivityById(props.assignmentId)
  const defaultCistomerId = Number(activityStore.activity.customers.find((c) => c.CompanyId === activityStore.activeTab)?.id)
  await statStore.fetchMoMSummary(defaultCistomerId.toString())
  // await customerStore.fetchCustomerById(defaultCistomerId.toString())
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


const monthly_summary = computed(() => statStore.summary[activityStore.activeTab]?.monthly_summary ?? [])
const summary = computed(() => {
  if (!monthly_summary?.value.length) return []

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

const loadCompetitors = (company: string) => {
  if (!competitors[company]) {
    const reportCompetitors = activityStore.allCompetitorOptions[company] || []
    competitors[company] = reportCompetitors.map(c => ({ ...c }))
  }
}

watch(activityStore, (newTab) => {
  loadCompetitors(newTab.activeTab)
})

watch(competitors, (newValue) => {
  const tab = activityStore.activeTab
  if (newValue[tab]?.length > 0) {
    activityStore.updateForm({
      competitors: newValue[tab] || []
    })
  }
}, { deep: true })

const handleRemoveCompetitor = (tab: string, index: number) => {
  competitors[tab].splice(index, 1)
}

const handleAddCompetitor = () => {
  const tab = activityStore.activeTab

  competitors[tab].push({ name: '', address: '', product: '', price: undefined, qty: undefined })
}

const computedItems = computed<ICompetitor[]>(() => {
  const baseItems = activityStore.allCompetitorOptions[activityStore.activeTab] ?? []
  const trimmed = search.value.trim()

  if (!trimmed || isSelecting.value) return baseItems

  const exists = (baseItems ?? []).some(item =>
    item.name.toLowerCase() === trimmed.toLowerCase()
  )

  if (!exists) {
    return [
      ...baseItems,
      {
        name: `+ Add "${trimmed}"`,
        address: '',
        isNew: true,
        rawName: trimmed,
      }
    ]
  }

  return baseItems
})


function onSelect(val: ICompetitor, index: number) {
  const tab = activityStore.activeTab
  isSelecting.value = true
  const newName = val.name.split(' - ')[0]

  if (val?.isNew) {
    const newItem: ICompetitor = {
      id: Date.now(),
      name: val.rawName || val.name,
      address: '',
      product: '',
      price: undefined,
      qty: undefined,
      isNew: true,
    }

    activityStore.allCompetitorOptions[activityStore.activeTab] ??= []
    activityStore.allCompetitorOptions[activityStore.activeTab].push(newItem)

    competitors[tab][index] = { ...newItem }
  } else {
    competitors[tab][index] = { ...val, name: newName }
  }

  nextTick(() => {
    search.value = ''
    isSelecting.value = false
  })
}

const submitHandler = async () => {
  configStore.overlay = true
  try {
    const validation = await form.value?.validate?.()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        const el = document.getElementById('scrollTarget')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        configStore.overlay = false
        return
      }
    }
    await activityStore.storeActivityReport(false).then(() => {
      router.push({ path: createUrl(`/activity/list`).value })
    })
  } catch (error) {
    console.log(error)
  }
  configStore.overlay = false
}

const handleSaveAsDraft = async () => {
  isDraft.value = true
  configStore.overlay = true
  try {
    const validation = await form.value?.validate?.()

    if (!validation?.valid) {
      configStore.overlay = false
      document.getElementById('scrollTarget')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    await activityStore.storeActivityReport(true)
    router.push({ path: createUrl(`/activity/${props.assignmentId}/report/edit`).value })
  } catch (error) {
    console.error(error)
  } finally {
    configStore.overlay = false
  }
}

const handleBackToList = () => {
  router.push({ path: createUrl(`/activity/list`).value })
} 

const handleCheckOut = async() => {
  isDraft.value = true
  try {
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        const el = document.getElementById('scrollTarget')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
      await activityStore.updateReport(props.assignmentId as unknown as number, false).then(async() => {
        await activityStore.checkOut(Number(props.assignmentId))
      })
    }
    
  } catch (error) {
    console.log(error)
  }
}

const baseDomain = import.meta.env.VITE_BASE_DOMAIN

const viewMap = computed(() => {
  if(!activityStore.activity) return

  const {lat, lng} = activityStore.activity
  
  if(!lat || !lng) return

  return `https://www.google.com/maps?q=${lat},${lng}`
})

const handleViewOnMap = () => {
  window.open(viewMap.value, '_blank')
}

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
          <VTable class="invoice-preview-table text-high-emphasis overflow-hidden mb-6">
            <tbody>
              <tr>
                <td class="pe-5">
                 Date
                </td>
                <td>
                  {{ formatFullDateWithSuffix(activity.scheduled_date) }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  Sales Person
                </td>
                <td>
                  {{ activeCustomer?.SlpName }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  Customer Name
                </td>
                <td>
                  {{ activeCustomer?.CardName }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  PIC
                </td>
                <td>
                  {{ activeCustomer?.CntctPrsn }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  Status
                </td>
                <td>
                  {{ activeCustomer?.NonActive === 'Y' ? 'Inactive' : 'Active' }}
                </td>
              </tr>                 
            </tbody>
          </VTable>
        </template>
      </VCol>
      <VCol class="text-no-wrap">
        <VRow>
          <VCol class="text-no-wrap" cols="12" lg="9" md="9" sm="12">
            <h6 class="text-h6 mb-4">
            GROWTH
            </h6>
            <template v-if="loading">
              <VSkeletonLoader
                v-for="i in 3"
                :key="i"
                type="list-item-two-line"
              />
            </template>
            <template v-else>
              <VTable class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
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
            </template>
          </VCol>
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
              <VTable class="invoice-preview-table border text-high-emphasis overflow-hidden mb-6">
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
            </template>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </VCardText> 
</VCard>
<VWindow v-model="activityStore.activeTab">
  <VWindowItem :value="tab" v-for="tab in ['SPS', 'BBS']">
    <VForm :ref="el => (form[tab] = el as VFormInst)" @submit.prevent="submitHandler">
      <VCard class="mb-6">
        <VCardItem>
          <VCardTitle>
            ACTIVITY REPORT
          </VCardTitle>
          </VCardItem>
          <VCardText id="scrollTarget">
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppSelect              
                  v-model="activityStore.currentReport.activity_purpose"
                  @update:model-value="activityStore.updateForm({ activity_purpose_id: $event })"
                  :items="activityStore.activityPuposesOptions"
                  label="Activity Purpose"
                  placeholder="Activity Purpose"
                  clearable
                  clear-icon="tabler-x"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppSelect
                  v-model="activityStore.currentReport.reason_qty_drop_id"
                  :items="activityStore.reasonQtyDropOptions"
                  label="Reason Quantity Drop"
                  placeholder="Reason Quantity Drop"
                  clearable
                  clear-icon="tabler-x"
                  :rules="[requiredValidator]"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppAutocomplete
                  chips
                  closable-chips
                  multiple
                  v-model="activityStore.currentReport.products"
                  :items="productStore.products"
                  label="Product Offering"
                  placeholder="Product Offering"
                  clearable
                  clear-icon="tabler-x"
                  item-title="ItemName"
                  item-value="ItemCode"
                  return-object
                />
              </VCol>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppTextarea              
                  v-model="activityStore.currentReport.product_issue"
                  @update:model-value="activityStore.updateForm({ product_issue: $event })"
                  label="Product Issues"
                  placeholder="Product Issues"
                  clearable
                  clear-icon="tabler-x"                  
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppTextarea              
                  v-model="activityStore.currentReport.next_action"
                  @update:model-value="activityStore.updateForm({ next_action: $event })"
                  label="Next actions"
                  placeholder="Next actions"
                  clearable
                  clear-icon="tabler-x"
                />
              </VCol>
              <VCol cols="12" lg="6" md="6" sm="12">
                <AppTextarea             
                  label="Additional notes"
                  v-model="activityStore.currentReport.additional_note"
                  @update:model-value="activityStore.updateForm({ additional_note: $event })"
                  placeholder="Additional notes"
                  clearable
                  clear-icon="tabler-x"
                />
              </VCol>
            </VRow>
          </VCardText> 
      </VCard>
      <VCard class="mb-6" title="Competitors" subtitle="Add Competitors">
      <VCardText>
        <VRow v-for="(item, index) in competitors[activityStore.activeTab]" :key="index">
          <VCol>
            <VRow>
              <VCol cols="12" lg="4" md="4" sm="12">           
                <VAutocomplete
                  v-model="competitors[activityStore.activeTab][index]"
                  :items="computedItems"
                  :item-value="item => item.id"
                  :item-title="item => item.name "
                  :return-object="true"
                  label="Competitors"
                  placeholder="Competitors"
                  @update:model-value="val => {
                    if(!val) {
                      activityStore.currentReport.competitors[index] = {name: '', address: '', product: '', price: undefined, qty: undefined}
                    } else { 
                      onSelect(val, index)
                      isSelecting = true
                    }               
                  }"
                  @update:search="val => {
                    search = val
                    isSelecting = false
                  }"
                  clearable
                  :rules="[v => !!(v && v.name) || 'Competitor is required']"
                />
              </VCol>
              <VCol cols="12" lg="4" md="4" sm="12">
                <VTextField
                    v-model="competitors[activityStore.activeTab][index].address"
                    label="Address"
                    placeholder="Address"
                    @update:model-value="val => {
                      competitors[activityStore.activeTab][index].address = val
                    }"
                    :rules="[requiredValidator]"
                  />
              </VCol>
              <VCol cols="12" lg="3" md="4" sm="12">
                  <VTextField
                    v-model="competitors[activityStore.activeTab][index].product"
                    label="Product"
                    placeholder="Product"
                    @update:model-value="val => {
                      competitors[activityStore.activeTab][index].product = val
                    }"
                  />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="4" md="4" sm="12">              
                <CurrencyInput
                  :model-value="Number(competitors[activityStore.activeTab][index].price) ?? undefined"
                  label="Price"
                  placeholder="Price"
                  :options="{ locale: 'id-ID', currency: 'IDR'}"
                  @update:model-value="(val: number) => {
                    competitors[activityStore.activeTab][index].price = val
                  }"
                  :rules="[(val:number) => regexValidator(val, /^Rp\s?\d{1,3}(\.\d{3})*$/)]"

                />
              </VCol>
              <VCol cols="12" lg="4" md="4" sm="12">
                <VTextField
                  :model-value="competitors[activityStore.activeTab][index].qty ?? undefined"
                  hide-details="auto"
                  label="Quantity (Kg)"
                  type="number"
                  placeholder="Quantity (Kg)"          
                  @update:model-value="(val) => competitors[activityStore.activeTab][index].qty = Number(val)"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12" class="d-flex gap-2">
                <VBtn icon color="error" @click="handleRemoveCompetitor(activityStore.activeTab, index)" v-if="competitors[activityStore.activeTab]?.length > 0" >
                  <VIcon icon="tabler-trash" />
                </VBtn>
                <VBtn icon color="success" @click="handleAddCompetitor" v-if="index === competitors[activityStore.activeTab].length - 1">
                  <VIcon icon="tabler-plus" /> 
                </VBtn>
              </VCol>
            </VRow>
            </VCol>
        </VRow>
        <VRow v-if="competitors[activityStore.activeTab]?.length === 0">
          <VCol>
            <VBtn icon color="success" @click="handleAddCompetitor">
              <VIcon icon="tabler-plus" />
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
        <VCardText v-if="activityStore.activity.image_path !== null">
          <VCol class="text-no-wrap" cols="12">
            <VImg
              :width="$vuetify.display.smAndDown ? 200 : 400"
              aspect-ratio="4/3"
              cover
              :src="`${baseDomain}/storage/${activityStore.activity.image_path}`"
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
        </VCardText> 
        <VCardText>
          <VRow class="flex-wrap">
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start">
              <VBtn color="warning" type="button" @click="handleBackToList">
                <VIcon end icon="tabler-arrow-big-left" class="mr-1"/> Back To List 
              </VBtn>
            </VCol>
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start">
              <VBtn color="warning" type="button" @click="handleSaveAsDraft">
                Save As Draft <VIcon end icon="tabler-pencil-check" />
              </VBtn>
            </VCol>
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start" v-if="activityStore.activity.image_path === null">
              <VBtn color="warning" type="button" @click="showCheckIn = true">
                Take Photo <VIcon end icon="tabler-camera" />
              </VBtn>
            </VCol>
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start" :loading="activityStore.loadingId === Number(props.assignmentId)" v-if="activityStore.activity.image_path !== null && activityStore.activity.check_out === null">
              <VBtn color="success" type="button" @click="handleCheckOut">
                Check Out <VIcon end icon="tabler-home-check" />
              </VBtn>
            </VCol>
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start" v-if="activityStore.activity.image_path !== null && activityStore.activity.check_out !== null">
              <VBtn color="success" type="submit">
                Submit Report <VIcon end icon="tabler-device-floppy" />
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VForm>
 </VWindowItem>
</VWindow>

<CheckIn :show="showCheckIn" :assignmentId="Number(props.assignmentId)" @update:show="showCheckIn = $event" />
</template>
<style>
.app-autocomplete .v-field__input {
  min-block-size: 135px !important;
}

@media (max-width: 768px) {
  .app-autocomplete .v-field__input {
    min-block-size: unset !important;
  }
}
</style>
