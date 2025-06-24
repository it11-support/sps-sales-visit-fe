<script lang="ts" setup>
import AppSelect from '@/@core/components/app-form-elements/AppSelect.vue';
import { useActivityStore, useConfigStore, useCustomerStore, useProductStore, useStatisticStore } from '@/@core/stores';
import { ICompetitor } from '@/@core/typedefs';
import { nextTick } from 'vue';
import { VForm } from 'vuetify/components';
import CheckIn from './CheckIn.vue';

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
const customerStore = useCustomerStore()
const productStore = useProductStore()
const loading = ref(true)
const competitors = ref<ICompetitor[]>([
  {name: '', address: '', product: '', price: undefined, qty: undefined},
])
const search = ref('')
const isSelecting = ref(false)
const form = ref<VForm>()
const configStore = useConfigStore()
const router = useRouter()
const isDraft = ref(false)
const showCheckIn = ref(false)

const loadAll = async () => {
  await activityStore.fetchActivityById(props.assignmentId)
  await statStore.fetchMoMSummary(activityStore.activity.customer_id)
  await customerStore.fetchCustomerById(activityStore.activity.customer_id)
  await activityStore.fetchAllOptions()
  loading.value = false
}

onMounted(() => {
  productStore.fetchProductOptions()
  loadAll()
  activityStore.activityReport.assignment_id = Number(props.assignmentId)
})

const activity = computed(() => activityStore.activity)
const monthly_summary = computed(() => statStore.monthly_summary)
const customer = computed(() => customerStore.customerDetail)

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

watch(missingItems, (newValue) => {
  const missingItem = JSON.stringify(newValue)
  activityStore.updateForm({non_active_product: missingItem})
}, {deep: true})

watch(competitors, (newValue) => {
  if(newValue.length > 0) {
    activityStore.updateForm({competitors: newValue})
  }
}, {deep: true})

const handleAddCompetitor = () => {
  competitors.value.push({name: '', address: '', product: '', price: undefined, qty: undefined})
}

const handleRemoveCompetitor = (index: number) => {
  competitors.value.splice(index, 1)
}

const computedItems = computed<ICompetitor[]>(() => {
  const baseItems = activityStore.allCompetitorOptions as ICompetitor[]
  const trimmed = search.value.trim()

  if (!trimmed || isSelecting.value) return baseItems

  const exists = baseItems.some(item =>
    item.name.toLowerCase() === trimmed.toLowerCase()
  )

  if (!exists) {
    return [
      ...baseItems,
      {
        id: `new-${trimmed}`,
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
  isSelecting.value = true
  const newName = val.name.split(' - ')[0]
  if (val?.isNew) {
    const newItem: ICompetitor = {
      id: Date.now(),
      name: val.rawName || val.name,
      address: '',
    }

    activityStore.allCompetitorOptions.push(newItem)
    competitors.value[index] = { ...newItem }
  } else {
    competitors.value[index] = { ...val, name: newName }
  }

  nextTick(() => {
    search.value = ''
    isSelecting.value = false
  })
}

const submitHandler = async () => {
  configStore.overlay = true
  try {
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        console.log(errors)
        configStore.overlay = false
        return
      }
    }
    await activityStore.updateReport(props.assignmentId as unknown as number, true).then(() => {
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
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        configStore.overlay = false
        if(errors) {
          const firstError = Object.values(errors)[0]
          const el = document.getElementById(firstError.id as string)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
        return
      }
      await activityStore.storeActivityReport(true).then(() => {
        router.push({ path: createUrl(`/activity/${props.assignmentId}/report/edit`).value })
      })
    }
    
  } catch (error) {
    configStore.overlay = false
    console.log(error)
  }
  configStore.overlay = false
}
const handleBackToList = () => {
  router.push({ path: createUrl(`/activity/list`).value })
} 

const handleCheckOut = async() => {
   await activityStore.updateReport(props.assignmentId as unknown as number, false).then(async() => {
     await activityStore.checkOut(Number(props.assignmentId))
  }) 
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
<VCard class="mb-6">
  <VCardItem class="pb-4">
    <VCardTitle>CUSTOMER SUMMARY</VCardTitle>
  </VCardItem>
  <VCardText>
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
                  {{ customer?.SlpName }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  Customer Name
                </td>
                <td>
                  {{ customer?.CardName }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  PIC
                </td>
                <td>
                  {{ customer?.CntctPrsn }}
                </td>
              </tr>
              <tr>
                <td class="pe-5">
                  Status
                </td>
                <td>
                  {{ customer?.NonActive === 'Y' ? 'Inactive' : 'Active' }}
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
            </template>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </VCardText> 
</VCard>
<VForm ref="form" @submit.prevent="submitHandler">
  <VCard class="mb-6">
    <VCardItem>
      <VCardTitle>
        ACTIVITY REPORT
      </VCardTitle>
      </VCardItem>
      <VCardText>
        <VRow>
          <VCol cols="12" lg="6" md="6" sm="12">
            <AppSelect
              @update:model-value="activityStore.updateForm({ reason_qty_drop_id: $event })"
              v-model="activityStore.activityReport.reason_qty_drop"
              :items="activityStore.reasonQtyDropOptions"
              label="Reason Quantity Drop"
              placeholder="Reason Quantity Drop"
              clearable
              clear-icon="tabler-x"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12" lg="6" md="6" sm="12">
            <AppSelect              
              v-model="activityStore.activityReport.activity_purpose"
              @update:model-value="activityStore.updateForm({ activity_purpose_id: $event })"
              :items="activityStore.activityPuposesOptions"
              label="Activity Purpose"
              placeholder="Activity Purpose"
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
              @update:model-value="activityStore.updateForm({ products: $event })"
              v-model="activityStore.activityReport.products"
              :items="productStore.products"
              label="Product Offering"
              placeholder="Product Offering"
              clearable
              clear-icon="tabler-x"
              item-title="ItemName"
              item-value="ItemCode"
              :rules="isDraft ? [] : [requiredValidator]"
            />
          </VCol>
          <VCol cols="12" lg="6" md="6" sm="12">
            <AppTextarea              
              v-model="activityStore.activityReport.product_issue"
              @update:model-value="activityStore.updateForm({ product_issue: $event })"
              label="Product Issues"
              placeholder="Product Issues"
              clearable
              clear-icon="tabler-x"
              :rules="isDraft ? [] : [requiredValidator]"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12" lg="6" md="6" sm="12">
            <AppTextarea              
              v-model="activityStore.activityReport.next_action"
              @update:model-value="activityStore.updateForm({ next_action: $event })"
              label="Next actions"
              placeholder="Next actions"
              clearable
              clear-icon="tabler-x"
              :rules="isDraft ? [] : [requiredValidator]"
            />
          </VCol>
          <VCol cols="12" lg="6" md="6" sm="12">
            <AppTextarea             
              label="Additional notes"
              v-model="activityStore.activityReport.additional_note"
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
     <VRow v-for="(item, index) in competitors" :key="index">
      <VCol>
        <VRow>
           <VCol cols="12" lg="4" md="4" sm="12">           
            <VAutocomplete
              v-model="competitors[index]"
              :items="computedItems"
              :item-value="item => item.id"
              :item-title="item => item.name "
              :return-object="true"
              label="Competitors"
              placeholder="Competitors"
              @update:model-value="val => {
                if(!val) {
                  competitors[index] = {name: '', address: '', product: '', price: undefined, qty: undefined}
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
              :rules="isDraft ? [] : [v => !!(v && v.value || v.id) || 'Competitor is required']"
            />
            </VCol>
            <VCol cols="12" lg="4" md="4" sm="12">
              <VTextField
                v-model="competitors[index].address"
                label="Address"
                placeholder="Address"
                @update:model-value="val => {
                  competitors[index].address = val
                }"
                :rules="isDraft ? [] : [requiredValidator]"
              />
            </VCol>
            <VCol cols="12" lg="3" md="4" sm="12">
              <VTextField
                v-model="competitors[index].product"
                label="Product"
                placeholder="Product"
                @update:model-value="val => {
                  competitors[index].product = val
                }"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="12" lg="4" md="4" sm="12">              
              <CurrencyInput
                :model-value="Number(competitors[index].price) ?? undefined"
                label="Price"
                placeholder="Price"
                :options="{ locale: 'id-ID', currency: 'IDR'}"
                @update:model-value="(val: number) => {
                  competitors[index].price = val
                }"
                :rules="[(val:number) => regexValidator(val, /^Rp\s?\d{1,3}(\.\d{3})*$/)]"

              />
            </VCol>
            <VCol cols="12" lg="4" md="4" sm="12">
              <VTextField
                :model-value="competitors[index].qty ?? undefined"
                hide-details="auto"
                label="Quantity"
                type="number"
                placeholder="Quantity"          
                @update:model-value="(val) => competitors[index].qty = Number(val)"
              />
            </VCol>
            </VRow>
            <VRow>
            <VCol cols="12" lg="6" md="6" sm="12" class="d-flex gap-2">
               <VBtn icon color="error" @click="handleRemoveCompetitor(index)" v-if="competitors.length > 1" >
                <VIcon icon="tabler-trash" />
              </VBtn>
              <VBtn icon color="success" @click="handleAddCompetitor" v-if="index === competitors.length - 1">
                <VIcon icon="tabler-plus" /> 
              </VBtn>
             
            </VCol>
            </VRow>
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
      <VCol class="text-no-wrap" cols="12" v-if="activityStore.activity.check_in">
        <span class="me-2" style="min-inline-size: 120px;">Check In Date</span>
        <span>{{ formatDate(activityStore.activity.check_in as unknown as  string, true ) }}</span>
      </VCol>
      <VCol class="text-no-wrap" cols="12" v-if="!activityStore.loadingAssignment && viewMap">
        <VBtn color="success" size="small" @click="handleViewOnMap">
          <VIcon icon="tabler-map-2 mr-2" /> View Location
        </VBtn>
      </VCol>
    </VCardText> 
    <VCardText>
      <VRow class="flex-wrap">
        <VCol cols="12" lg="2" md="4" sm="12" class="d-flex justify-start">
          <VBtn color="warning" type="button" @click="handleBackToList">
            <VIcon end icon="tabler-arrow-big-left" class="mr-1"/> Back To List 
          </VBtn>
        </VCol>
        <VCol cols="12" lg="2" md="4" sm="12" class="d-flex justify-start">
          <VBtn color="warning" type="button" @click="handleSaveAsDraft">
            Save As Draft <VIcon end icon="tabler-pencil-check" />
          </VBtn>
        </VCol>
        <VCol cols="12" lg="2" md="4" sm="12" class="d-flex justify-start" v-if="activityStore.activity.image_path === null">
          <VBtn color="warning" type="button" @click="showCheckIn = true">
            Take Photo <VIcon end icon="tabler-camera" />
          </VBtn>
        </VCol>
        <VCol cols="12" lg="2" md="4" sm="12" class="d-flex justify-start" :loading="activityStore.loadingId === Number(props.assignmentId)" v-if="activityStore.activity.image_path !== null && activityStore.activity.check_out === null">
          <VBtn color="success" type="button" @click="handleCheckOut">
            Check Out <VIcon end icon="tabler-home-check" />
          </VBtn>
        </VCol>
        <VCol cols="12" lg="2" md="4" sm="12" class="d-flex justify-start" v-if="activityStore.activity.image_path !== null && activityStore.activity.check_out !== null">
          <VBtn color="success" type="submit">
            Submit Report <VIcon end icon="tabler-device-floppy" />
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</VForm>

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
