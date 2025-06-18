<script lang="ts" setup>
import { useActivityStore, useConfigStore, useCustomerStore, useProductStore, useStatisticStore } from '@/@core/stores';
import { ICompetitor, IProduct } from '@/@core/typedefs';
import { VForm } from 'vuetify/components/VForm';

interface Props {
  assignmentId: string  
}

const props = defineProps<Props>()
const router = useRouter()
const form = ref<VForm>()
const loading = ref(true)
const activityStore = useActivityStore()
const customerStore = useCustomerStore()
const statStore = useStatisticStore()
const configStore = useConfigStore()
const productStore = useProductStore()

const competitors = ref<ICompetitor[]>([
  {name: '', address: '', product: '', price: undefined, qty: undefined},
])

const selectedProducts = ref<IProduct[]>([])
const search = ref('')
const isSelecting = ref(false)

const loadAll = async () => {
  await activityStore.fetchActivityById(props.assignmentId)
  await statStore.fetchMoMSummary(activityStore.activity.customer_id)
  await customerStore.fetchCustomerById(activityStore.activity.customer_id)
  await activityStore.fetchAllOptions()
  await activityStore.fetchActivityReport(props.assignmentId)
  await productStore.fetchProductOptions()

  competitors.value = activityStore.report.competitors
  selectedProducts.value = activityStore.report.products ?? []
  loading.value = false
}

onMounted(() => {
  loadAll()
})

console.log(activityStore.activity)
const activity = computed(() => activityStore.activity)
const monthly_summary = computed(() => statStore.monthly_summary)
const customer = computed(() => customerStore.customerDetail)


watch(competitors, (newValue) => {
  if(newValue.length > 0) {
    activityStore.updateForm({competitors: newValue})
  }
}, {deep: true})

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
    await activityStore.updateReport(props.assignmentId as unknown as number).then(() => {
      router.push({ path: createUrl(`/activity/list`).value })
    })
  } catch (error) {
    console.log(error)
  }
  configStore.overlay = false
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
        name: `+ Add "${trimmed}"`,
        address: '',
        isNew: true,
        rawName: trimmed,
      }
    ]
  }

  return baseItems
})

const onSelect = (val: ICompetitor, index: number) => {
  isSelecting.value = true
  const newName = val.name.split(' - ')[0]
  console.log(val)
  if (val?.isNew) {
    const newItem: ICompetitor = {
      // id: Date.now(),
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

const handleRemoveCompetitor = (index: number) => {
  activityStore.activityReport.competitors.splice(index, 1)
  if(activityStore.activityReport.competitors.length === 0) {
    activityStore.activityReport.competitors.push({name: '', address: '', product: '', price: undefined, qty: undefined})      
  }
}

const handleAddCompetitor = () => {
  activityStore.activityReport.competitors.push({name: '', address: '', product: '', price: undefined, qty: undefined})
}

const shouldShowRemoveButton = (index: number) => {
  const competitors = activityStore.activityReport.competitors;

  if (competitors.length > 1) return true;

  const c = competitors[0];
  const hasValue = c?.name || c?.address || c?.product || c?.price || c?.qty;
  return !!hasValue;
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
              v-model="activityStore.activityReport.reason_qty_drop_id"
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
              v-model="activityStore.activityReport.activity_purpose_id"
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
              v-model="selectedProducts"
              :items="productStore.products"
              label="Product Offering"
              placeholder="Product Offering"
              clearable
              clear-icon="tabler-x"
              item-title="ItemName"
              item-value="ItemCode"              
              :rules="[requiredValidator]"
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
              :rules="[requiredValidator]"
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
              :rules="[requiredValidator]"
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
     <VRow v-for="(item, index) in activityStore.activityReport.competitors" :key="index">
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
                  activityStore.activityReport.competitors[index] = {name: '', address: '', product: '', price: undefined, qty: undefined}
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
                v-model="activityStore.activityReport.competitors[index].address"
                label="Address"
                placeholder="Address"
                @update:model-value="val => {
                  activityStore.activityReport.competitors[index].address = val
                }"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol cols="12" lg="3" md="4" sm="12">
              <VTextField
                v-model="activityStore.activityReport.competitors[index].product"
                label="Product"
                placeholder="Product"
                @update:model-value="val => {
                  activityStore.activityReport.competitors[index].product = val
                }"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="12" lg="4" md="4" sm="12">              
              <CurrencyInput
                :model-value="Number(activityStore.activityReport.competitors[index].price) ?? undefined"
                label="Price"
                placeholder="Price"
                :options="{ locale: 'id-ID', currency: 'IDR'}"
                @update:model-value="(val: number) => {
                  activityStore.activityReport.competitors[index].price = val
                }"
                :rules="[(val:number) => regexValidator(val, /^Rp\s?\d{1,3}(\.\d{3})*$/)]"

              />
            </VCol>
            <VCol cols="12" lg="4" md="4" sm="12">
              <VTextField
                :model-value="activityStore.activityReport.competitors[index].qty ?? undefined"
                hide-details="auto"
                label="Quantity"
                type="number"
                placeholder="Quantity"          
                @update:model-value="(val) => activityStore.activityReport.competitors[index].qty = Number(val)"
              />
            </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" lg="6" md="6" sm="12" class="d-flex gap-2">
                <VBtn icon color="error" @click="handleRemoveCompetitor(index)" v-if="shouldShowRemoveButton" >
                  <VIcon icon="tabler-trash" />
                </VBtn>
                <VBtn icon color="success" @click="handleAddCompetitor" v-if="index === activityStore.activityReport.competitors.length - 1">
                  <VIcon icon="tabler-plus" /> 
                </VBtn>
              </VCol>             
            </VRow>
        </VCol>
    </VRow>
    <template v-if="activityStore.activityReport.competitors.length === 0">
      <VBtn icon color="success" @click="handleAddCompetitor">
        <VIcon icon="tabler-plus" />
      </VBtn>
    </template>
   </VCardText>
    <VCardText>
      <VRow>
        <VCol cols="12" lg="6" md="6" sm="12">
          <VBtn color="success" type="submit">
            Submit Report <VIcon end icon="tabler-device-floppy" />
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</VForm>
</template>
