
<script setup lang="ts">
import { useActivityStore, useConfigStore, useProductStore, useStatisticStore } from '@/@core/stores';
import { ICustomerData } from '@/@core/typedefs';
import ActivityTabForm, { ActivityTabFormExpose } from './ActivityTabForm.vue';

interface Props {
  assignmentId: string  
}

const configStore = useConfigStore()
const isDraft = ref(false)
const activityStore = useActivityStore()
const statStore = useStatisticStore()
const productStore = useProductStore()
const props = defineProps<Props>()
const loading  = ref(false)
const formRef = reactive<Record<string, ActivityTabFormExpose | null>>({})


const router = useRouter()
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

const validateAndScrollAllTabs = async () => {
  const results: { tab: string; valid: boolean }[] = []

  for (const tabName of activityStore.tabs) {
    const form = formRef[tabName]
    if (!form?.validate) {
      results.push({ tab: tabName, valid: false })
      continue
    }

    const result = await form.validate()
    const isValid = typeof result === 'boolean' ? result : result.valid

    results.push({ tab: tabName, valid: isValid })
  }

  const allValid = results.every(r => r.valid)

  if (!allValid) {
    const firstInvalid = results.find(r => !r.valid)
    if (firstInvalid) {
      activityStore.activeTab = firstInvalid.tab
      await nextTick()
      formRef[firstInvalid.tab]?.scrollToFirstError?.()
    }
  }

  return allValid
}


const handleSaveAsDraft = async () => {
  try {  
    const isValid = await validateAndScrollAllTabs()

    if (isValid) {
      isDraft.value = true
      configStore.overlay = true
      await activityStore.storeActivityReport(true)
      router.push({ path: createUrl(`/activity/${props.assignmentId}/report/edit`).value })
    }
  } catch (error) {
    console.log(error)
  } finally {
    configStore.overlay = false
  }
}

const missingItems = computed(() => {
   if (!monthly_summary.value || monthly_summary.value.length < 3) {
    return []
  }

  const items = [...monthly_summary.value].reverse().slice(1, 3).map(item => item.items)

  const itemsSet = new Set(items[0].map(item =>item.item_code))
  const missing = items[1].filter(item => !itemsSet.has(item.item_code))
  return missing
})

const loadAll = async () => {
  await activityStore.fetchActivityById(props.assignmentId)
  const defaultCustomerId = Number(activityStore.activity.customers.find((c) => c.CompanyId === activityStore.activeTab)?.id)
  await statStore.fetchMoMSummary(defaultCustomerId.toString())
  // await customerStore.fetchCustomerById(defaultCistomerId.toString())
  await activityStore.fetchAllOptions()

  loading.value = false
  
}


onMounted(() => {
  productStore.fetchProductOptions()
  loadAll()
  activityStore.currentReport.assignment_id = Number(props.assignmentId)
  activityStore.currentReport.customer = activeCustomer.value as ICustomerData
})

watch(activityStore, (val) => {
  if (val.activeTab) {
    activityStore.activityReport[val.activeTab].assignment_id = Number(props.assignmentId)
  }
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
  <VWindowItem
    v-for="name in activityStore.tabs"
    :key="name"
    :value="name"
    :eager="true"
  >
    <div v-show="true">
      <ActivityTabForm
        :tab="name"
        :assignment-id="assignmentId"
        :ref="el => { 
          formRef[name] = el as unknown as ActivityTabFormExpose
        }"
      >
        <template #saveAsDraft>
          <VBtn color="warning" type="button" @click="handleSaveAsDraft">
            Save As Draft <VIcon end icon="tabler-pencil-check" />
          </VBtn>
        </template>
      </ActivityTabForm>
    </div>
  </VWindowItem>
</VWindow>
</template>
