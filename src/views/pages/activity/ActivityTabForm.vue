<script setup lang="ts">
import { useActivityStore, useConfigStore, useProductStore } from '@/@core/stores';
import { ICompetitor } from '@/@core/typedefs';
import { VForm } from 'vuetify/components/VForm';
import CheckIn from './CheckIn.vue';

interface Props {
  tab: string
  assignmentId: string
}

export type ActivityTabFormExpose = {
  validate: () => Promise<{ valid: boolean; errors: any[] }>
  scrollToFirstError: () => void
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
const configStore = useConfigStore()

const props = defineProps<Props>()
const activityStore = useActivityStore()
const productStore = useProductStore()
const showCheckIn = ref(false)
const search = ref('')
const router = useRouter()
const isSelecting = ref(false)
const isDraft = ref(false)
const report = computed({
  get() {
    return activityStore.initReport(props.tab)
  },
  set(val) {
    activityStore.activityReport[props.tab] = val
  },
})


const handleCheckOut = async() => {
  isDraft.value = true
  try {
    const validation = await formRef.value?.validate()
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

function handleRemoveCompetitor(tab: string, index: number) {
  if (!activityStore.activityReport[tab]) return

  const report = activityStore.activityReport[tab]

  if (report.competitors && report.competitors.length > index) {
    report.competitors.splice(index, 1)
  }
}

const computedItems = computed<ICompetitor[]>(() => {
  const trimmed = search.value.trim().toLowerCase()
  const tab = activityStore.activeTab

  const baseItems = Object.values(activityStore.allCompetitorOptions)
    .flat()
    .filter(Boolean) as ICompetitor[]

  if (!trimmed || isSelecting.value) return baseItems

  let filtered = baseItems.filter(item =>
    item.name.toLowerCase().includes(trimmed)
  )

  const selectedIds = report.value.competitors.map(c => c.id)
  filtered = filtered.filter(item => !selectedIds.includes(item.id))

  const exactMatch = baseItems.some(item =>
    item.name.toLowerCase() === trimmed
  )

  if (!exactMatch) {
    filtered.push({
      id: `new-${trimmed}`,
      name: `+ Add "${search.value}"`,
      rawName: search.value,
      address: '',
      product: '',
      price: undefined,
      qty: undefined,
      isNew: true
    })
  }

  return filtered
})

const handleBackToList = () => {
  router.push({ path: createUrl(`/activity/list`).value })
} 

function onSelect(val: ICompetitor, index: number) {
  const tab = activityStore.activeTab
  isSelecting.value = true

  const newItem: ICompetitor = val.isNew
    ? {
        id: Date.now(),
        name: val.rawName || '',
        address: '',
        product: '',
        price: undefined,
        qty: undefined,
        isNew: false,
      }
    : {
        ...val,
        name: val.name.split(' - ')[0],
        isNew: false,
      }

  const arr = [...report.value.competitors]
  arr[index] = newItem
  report.value.competitors = arr

  if (!activityStore.allCompetitorOptions[tab]) {
    activityStore.allCompetitorOptions[tab] = []
  }

  if (val.isNew) {
    activityStore.allCompetitorOptions[tab].push(newItem)
  }

  nextTick(() => {
    search.value = ''
    isSelecting.value = false
  })
}

function handleAddCompetitor() {
  const tab = activityStore.activeTab

  if (!activityStore.activityReport[tab]) {
    activityStore.activityReport[tab] = activityStore.createDefaultReport()
  }

  const report = activityStore.activityReport[tab]

  report.competitors.push({
    id: Date.now(),
    name: '',
    address: '',
    product: '',
    price: undefined,
    qty: undefined,
    isNew: true
  })
}


watch(
  () => report, 
  () => {

    const reports = {
      'SPS': activityStore.activityReport['SPS'],
      'BBS': activityStore.activityReport['BBS']
    }

  },
  { deep: true }
)

const formRef = ref<InstanceType<typeof VForm> | null>(null)

defineExpose<ActivityTabFormExpose>({
  validate: async () => {
    const result = await formRef.value?.validate()
    return {
      valid: !!result?.valid,
      errors: result?.errors ?? []
    }
  },
  scrollToFirstError: () => {
    const firstError = formRef.value?.$el.querySelector('.v-messages__message')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

const submitHandler = async () => {
  configStore.overlay = true
  try {
    const validation = await formRef.value?.validate()
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

</script>

<template>
  <VForm ref="formRef" @submit.prevent="submitHandler" >
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
              v-model="report.activity_purpose_id"              
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
              v-model="report.reason_qty_drop_id"
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
              v-model="report.products"
              :items="productStore.products.filter((product) => product.CompanyId === activityStore.activeTab)"
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
              v-model="report.product_issue"
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
                v-model="report.next_action"
                label="Next actions"
                placeholder="Next actions"
                clearable
                clear-icon="tabler-x"
              />
            </VCol>
            <VCol cols="12" lg="6" md="6" sm="12">
              <AppTextarea             
                label="Additional notes"
                v-model="report.additional_note"
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
        <VRow v-for="(item, index) in report.competitors" :key="index">
          <VCol>
            <VRow>
              <VCol cols="12" lg="4" md="4" sm="12">           
                <VAutocomplete
                  v-model="report.competitors[index]"
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
                    v-model="report.competitors[index].address"
                    label="Address"
                    placeholder="Address"
                    @update:model-value="val => {
                      report.competitors[index].address = val
                    }"
                    :rules="[requiredValidator]"
                  />
              </VCol>
              <VCol cols="12" lg="3" md="4" sm="12">
                  <VTextField
                    v-model="report.competitors[index].product"
                    label="Product"
                    placeholder="Product"
                    @update:model-value="val => {
                      report.competitors[index].product = val
                    }"
                  />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="4" md="4" sm="12">              
                <CurrencyInput
                  :model-value="Number(report.competitors[index].price) ?? undefined"
                  label="Price"
                  placeholder="Price"
                  :options="{ locale: 'id-ID', currency: 'IDR'}"
                  @update:model-value="(val: number) => {
                    report.competitors[index].price = val
                  }"
                  :rules="[(val:number) => regexValidator(val, /^Rp\s?\d{1,3}(\.\d{3})*$/)]"

                />
              </VCol>
              <VCol cols="12" lg="4" md="4" sm="12">
                <VTextField
                  :model-value="report.competitors[index].qty ?? undefined"
                  hide-details="auto"
                  label="Quantity (Kg)"
                  type="number"
                  placeholder="Quantity (Kg)"          
                  @update:model-value="(val) => report.competitors[index].qty = Number(val)"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12" class="d-flex gap-2">
                <VBtn icon color="error" @click="handleRemoveCompetitor(activityStore.activeTab, index)" v-if="report.competitors?.length > 0" >
                  <VIcon icon="tabler-trash" />
                </VBtn>
                <VBtn icon color="success" @click="handleAddCompetitor" v-if="index === report.competitors.length - 1">
                  <VIcon icon="tabler-plus" /> 
                </VBtn>
              </VCol>
            </VRow>
            </VCol>
        </VRow>
        <VRow v-if="report.competitors?.length === 0">
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
           <slot name="saveAsDraft"></slot>
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
<CheckIn :show="showCheckIn" :assignmentId="Number(props.assignmentId)" @update:show="showCheckIn = $event" />
</template>
