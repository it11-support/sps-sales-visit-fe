<script setup lang="ts">
import AppAutocomplete from '@/@core/components/app-form-elements/AppAutocomplete.vue'
import AppSelect from '@/@core/components/app-form-elements/AppSelect.vue'
import AppStepper from '@/@core/components/AppStepper.vue'
import { useActivityStore, useConfigStore, useProductStore, useStatisticStore } from '@/@core/stores'
import { ICompetitor } from '@/@core/typedefs'
import { VWindow } from 'vuetify/components'
import { VForm } from 'vuetify/components/VForm'
import CheckIn from './CheckIn.vue'

const statStore = useStatisticStore()

const steps = [
  {
    title: "Activity Purpose",
    subtitle: "Activity purpose & reason quantity drop"
  },
  {
    title: "Products",
    subtitle: "Product offering & issues"
  },
  {
    title: "Notes",
    subtitle: "Next action & additional notes"
  },
  {
    title: "Competitors",
    subtitle: "Add Competitors"
  },
  {
    title: "Attachment",
    subtitle: "Take a picture"
  }
]

interface Props {
  assignmentId: string  
}
const baseDomain = import.meta.env.VITE_BASE_DOMAIN

const search = ref('')
const currentStep = ref(0)
const isDraft = ref(false)
const activityRef = ref<VForm>()
const productRef = ref<VForm>()
const notesRef = ref<VForm>()
const competitorsRef = ref<VForm>()
const competitors = reactive<ICompetitor[]>([])
const isSelecting = ref(false)
const isCurrentStepValid = ref(true)
const activityStore = useActivityStore()
const productStore = useProductStore()
const showCheckIn = ref(false)
const router = useRouter()
const props = defineProps<Props>()
const configStore = useConfigStore()

let initializing = true

const activityPurposeReport = ref({
  activity_purpose: undefined as number | undefined,
  reason_qty_drop_id: undefined as number | undefined,
})

const productReport = ref({
  products: undefined as any,
  product_issue: '',
})

const notesReport = ref({
  next_action: '',
  additional_note: '',
})


watch(
  () => activityStore.activityReport,
  (newVal) => {
    if (!newVal || Object.keys(newVal).length === 0) return

    initializing = true
    activityPurposeReport.value.activity_purpose = newVal.activity_purpose_id ?? undefined
    activityPurposeReport.value.reason_qty_drop_id = newVal.reason_qty_drop_id ?? undefined

    productReport.value.products = newVal.products ?? undefined
    productReport.value.product_issue = newVal.product_issue ?? ''
    notesReport.value.next_action = newVal.next_action ?? ''
    notesReport.value.additional_note = newVal.additional_note ?? ''
    competitors.splice(0, competitors.length, ...(newVal.competitors ?? []))

    activityPurposeReport.value.activity_purpose
    // tunggu tick agar tidak langsung trigger watcher berikutnya
    nextTick(() => (initializing = false))
  },
  { immediate: true, deep: true }
)

watch(
  activityPurposeReport,
  (newVal) => {
    if (initializing) return
    activityStore.updateForm({
      activity_purpose_id: newVal.activity_purpose,
      reason_qty_drop_id: newVal.reason_qty_drop_id,
      assignment_id: Number(props.assignmentId),
    })
  },
  { deep: true }
)

watch(
  productReport,
  (newVal) => {
    if (initializing) return
    activityStore.updateForm({
      products: newVal.products,
      product_issue: newVal.product_issue,
    })
  },
  { deep: true }
)

watch(
  notesReport,
  (newVal) => {
    if (initializing) return
    activityStore.updateForm({
      next_action: newVal.next_action,
      additional_note: newVal.additional_note,
    })
  },
  { deep: true }
)

watch(
  competitors,
  (newVal) => {
    if (initializing) return
    activityStore.updateForm({ competitors: newVal })
  },
  { deep: true }
)

const computedItems = computed<ICompetitor[]>(() => {
  const baseItems = activityStore.allCompetitorOptions

  const trimmed = search.value.trim()

  if (!trimmed || isSelecting.value) return baseItems

  const exists = (baseItems ?? []).some(item =>
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


const validateForm = (ref: VForm | undefined) => {
  ref?.validate().then(valid => {
    if(valid.valid) {
      currentStep.value ++
      isCurrentStepValid.value = true
      activityStore.updateForm({

      })
    } else {
      isCurrentStepValid.value = false
    }
  })
}

const handleSaveAsDraft = async () => {
  isDraft.value = true
  configStore.overlay = true
  try {
    if (!isCurrentStepValid.value) {
      configStore.overlay = false
      const el = document.getElementById('scrollTarget')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    await activityStore.storeActivityReport(true).then(() => {
      router.push({ path: createUrl(`/activity/${props.assignmentId}/report`).value })
    })
  } catch (error) {
    configStore.overlay = false
    console.log(error)
  }
  configStore.overlay = false
}

const handleCheckOut = async() => {
  isDraft.value = true
  configStore.overlay = true
  try {
    if (!isCurrentStepValid.value) {
      configStore.overlay = false
      const el = document.getElementById('scrollTarget')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    await activityStore.updateReport(props.assignmentId as unknown as number, false).then(async() => {
      await activityStore.checkOut(Number(props.assignmentId))
    })    
  } catch (error) {
    configStore.overlay = false
    console.log(error)
  }
  configStore.overlay = false
}

const onSelect = (val: ICompetitor, index: number) => {

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

    activityStore.competitorOptions.push(newItem)
    competitors[index] = { ...newItem }
  } else {
    competitors[index] = { ...val, name: newName }
  }

  nextTick(() => {
    search.value = ''
    isSelecting.value = false
  })
}

const handleRemoveCompetitor = (index: number) => {
  competitors.splice(index, 1)
}

const handleAddCompetitor = () => {
  competitors.push({ name: '', address: '', product: '', price: undefined, qty: undefined })
}

const handleSubmit = async () => {
  configStore.overlay = true
  try {
    if (!isCurrentStepValid.value) {
      const el = document.getElementById('scrollTarget')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      configStore.overlay = false
      return
    }
    
    await activityStore.storeActivityReport(false).then(() => {
      router.push({ path: createUrl(`/activity/list`).value })
    })
  } catch (error) {
    console.log(error)
  }
  configStore.overlay = false
}

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
  <VCard>
    <VCardTitle>
      ACTIVITY REPORT
    </VCardTitle>
    <VCardText style="padding: 5px !important;">
      <AppStepper
        v-model:current-step="currentStep"
        :items="steps"
        :is-active-step-valid="isCurrentStepValid"
      />
    </VCardText>
    <VDivider />
    <VCardText >
      <VWindow
        v-model="currentStep"
        class="disable-tab-transition"
      >
        <VWindowItem>
          <VForm 
            ref="activityRef" 
            @submit.prevent="() => validateForm(activityRef)"
          >
            <VRow>
              <VCol cols="12" md="6">
                 <AppSelect              
                  v-model="activityPurposeReport.activity_purpose"                  
                  :items="activityStore.activityPuposesOptions"
                  label="Activity Purpose"
                  placeholder="Activity Purpose"
                  clearable
                  clear-icon="tabler-x"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="activityPurposeReport.reason_qty_drop_id"
                  :items="activityStore.reasonQtyDropOptions"
                  label="Reason Quantity Drop"
                  placeholder="Reason Quantity Drop"
                  clearable
                  clear-icon="tabler-x"
                  :rules="[]"
                />
              </VCol>
              </VRow>
              <VRow>
              <VCol cols="12">
                <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                  <VBtn
                    color="secondary"
                    variant="tonal"
                    disabled
                  >
                    <VIcon
                      icon="tabler-arrow-left"
                      start
                      class="flip-in-rtl"
                    />
                    Previous
                  </VBtn>

                  <VBtn type="submit">
                    Next
                    <VIcon
                      icon="tabler-arrow-right"
                      end
                      class="flip-in-rtl"
                    />
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VWindowItem>
        <VWindowItem>
          <VForm ref="productRef"
           @submit.prevent="() => validateForm(productRef)"
          >
             <VRow>
              <VCol cols="12" md="6">
                <AppAutocomplete
                  chips
                  closable-chips
                  multiple
                  v-model="productReport.products"
                  :items="productStore.products"
                  label="Product Offering"
                  placeholder="Product Offering"
                  clearable
                  clear-icon="tabler-x"
                  item-title="ItemName"
                  item-value="ItemCode"
                  return-object
                  autocorrect="off"
                  spellcheck="false"
                  autocomplete="off"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextarea              
                  v-model="productReport.product_issue"                  
                  label="Product Issues"
                  placeholder="Product Issues"
                  clearable
                  clear-icon="tabler-x"
                />
              </VCol>
              </VRow>
              <VRow>
              <VCol cols="12">
                <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                  <VBtn                    
                    variant="tonal"
                    @click="currentStep--"
                  >
                    <VIcon
                      icon="tabler-arrow-left"
                      start
                      class="flip-in-rtl"
                    />
                    Previous
                  </VBtn>

                  <VBtn type="submit">
                    Next
                    <VIcon
                      icon="tabler-arrow-right"
                      end
                      class="flip-in-rtl"
                    />
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VWindowItem>
        <VWindowItem>
          <VForm ref="notesRef"
           @submit.prevent="() => validateForm(notesRef)"
          >
             <VRow>
              <VCol cols="12" md="6">
                <AppTextarea              
                  v-model="notesReport.next_action"
                  label="Next actions"
                  placeholder="Next actions"
                  clearable
                  clear-icon="tabler-x"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextarea             
                  label="Additional notes"
                  v-model="notesReport.additional_note"
                  placeholder="Additional notes"
                  clearable
                  clear-icon="tabler-x"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                  <VBtn
                    variant="tonal"
                    @click="currentStep--"
                  >
                    <VIcon
                      icon="tabler-arrow-left"
                      start
                      class="flip-in-rtl"
                    />
                    Previous
                  </VBtn>

                  <VBtn type="submit">
                    Next
                    <VIcon
                      icon="tabler-arrow-right"
                      end
                      class="flip-in-rtl"
                    />
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VWindowItem>
        <VWindowItem>
          <VForm ref="competitorsRef"
           @submit.prevent="() => validateForm(competitorsRef)"
          >
             <VRow>
              <VCol cols="12" md="6">
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
                            v-model="competitors[index].address"
                            label="Address"
                            placeholder="Address"
                            @update:model-value="val => {
                              competitors[index].address = val
                            }"
                            :rules="[requiredValidator]"
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
                          label="Quantity (Kg)"
                          type="number"
                          placeholder="Quantity (Kg)"          
                          @update:model-value="(val) => competitors[index].qty = Number(val)"
                        />
                      </VCol>
                    </VRow>
                    <VRow>
                      <VCol cols="12" lg="6" md="6" sm="12" class="d-flex gap-2">
                        <VBtn icon color="error" @click="handleRemoveCompetitor(index)" v-if="competitors?.length > 0" >
                          <VIcon icon="tabler-trash" />
                        </VBtn>
                        <VBtn icon color="success" @click="handleAddCompetitor" v-if="index === competitors.length - 1">
                          <VIcon icon="tabler-plus" /> 
                        </VBtn>
                      </VCol>
                    </VRow>
                  </VCol>
                </VRow>
                <VRow v-if="competitors?.length === 0">
                  <VCol>
                    <VBtn icon color="success" @click="handleAddCompetitor">
                      <VIcon icon="tabler-plus" />
                    </VBtn>
                  </VCol>
                </VRow>
              </VCol>
              </VRow>
              <VRow>
                <VCol cols="12">
                  <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                    <VBtn
                      variant="tonal"
                      @click="currentStep--"
                    >
                      <VIcon
                        icon="tabler-arrow-left"
                        start
                        class="flip-in-rtl"
                      />
                      Previous
                    </VBtn>

                    <VBtn type="submit">
                      Next
                      <VIcon
                        icon="tabler-arrow-right"
                        end
                        class="flip-in-rtl"
                      />
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VForm>
        </VWindowItem>
        <VWindowItem>
          <template v-if="activityStore.activity.image_path !== null">
            <VRow>
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
            </VRow>
          </template> 
          <VRow>
            <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start">
              <VBtn color="warning" type="button" @click="handleSaveAsDraft">
                Save As Draft <VIcon end icon="tabler-pencil-check" />
              </VBtn>
            </VCol>
            <VCol cols="12" md="6" v-if="activityStore.activity.image_path === null">
              <VBtn color="warning" type="button" @click="showCheckIn = true">
                Take Photo <VIcon end icon="tabler-camera" />
              </VBtn>              
            </VCol>
             <VCol cols="12" lg="2" md="2" sm="12" class="d-flex justify-start" :loading="activityStore.loadingId === Number(props.assignmentId)" v-if="activityStore.activity.image_path !== null && activityStore.activity.check_out === null">
              <VBtn color="success" type="button" @click="handleCheckOut">
                Check Out <VIcon end icon="tabler-home-check" />
              </VBtn>
            </VCol>            
          </VRow>
          <VRow>
            <VCol cols="12">
              <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
                <VBtn
                  variant="tonal"
                  @click="currentStep--"
                >
                  <VIcon
                    icon="tabler-arrow-left"
                    start
                    class="flip-in-rtl"
                  />
                  Previous
                </VBtn>

                <VBtn v-if="activityStore.activity.image_path !== null  && activityStore.activity.check_out !== null" @click="handleSubmit">
                  Submit<VIcon end icon="tabler-device-floppy" class="flip-in-rtl" />                  
                </VBtn>
                <VBtn v-else disabled>
                  Submit<VIcon end icon="tabler-device-floppy" class="flip-in-rtl" />                  
                </VBtn>
              </div>
            </VCol>
          </VRow>
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>
  <CheckIn :show="showCheckIn" :assignmentId="Number(props.assignmentId)" @update:show="showCheckIn = $event" />
</template>


<style lang="scss" scoped>
body .app-autocomplete .v-autocomplete .v-field .v-field__input > input {
  align-self: baseline !important;
}
</style>
