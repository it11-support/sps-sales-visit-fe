<script setup lang="ts">
import { useConfigStore } from '@/@core/stores/config';
import { ISalesInvoice, ISalesInvoiceData } from '@/@core/typedefs/salesinvoice';

interface Props {  
  salesInvoicesData: ISalesInvoiceData,
  groupBy?: string
  headers: {
    title: string;
    value: string;
    sortable?: boolean;
  }[]
  itemsLength: number
  loading?: boolean
  itemValue?: string
  page?: number
  itemsPerPage?: number
  selectedRows?: ISalesInvoice[]
  onUpdateOptions?: (options: any) => void
  onUpdateSelectedRows?: (selectedRows: ISalesInvoice[]) => void
  customerId?: string
  grouped: boolean
}

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:itemsPerPage', value: number): void
  (e: 'update:modelValue', value: any[]): void
}>()


const configStore = useConfigStore()
const props = defineProps<Props>()


const localPage = ref(props.page)
const localItemsPerPage = ref(props.itemsPerPage)

watch(localPage, (val) => {
  if (val !== undefined) {
    emit('update:page', val)
  }
})

watch(localItemsPerPage, (val) => {
  if (val !== undefined) {
    emit('update:itemsPerPage', val)
  }
})

const computedHeaders = computed(() => {
  if(props.groupBy){
    if(props.groupBy === 'ItemCode') {
      return props.headers.filter(header => header.value !== 'ItemCode')
    }
    // return headers.filter(header => header.value !== 'DocNum')
    return props.headers.filter(header => header.value !== 'DocNum')
  }
  return props.headers
})

const calculateTotalSales = (items: any): string => {
  const totalSales = items.reduce((sum: number, item: any) => sum + parseFloat(item.value.TotalSales), 0);
  return formatMoney(totalSales)
}

const calculateTotalWeight = (items: any): string => {
  const totalWeight = items.reduce((sum: number, item: any) => sum + parseFloat(item.value.total_weight), 0);
  return totalWeight.toFixed(2)
}

</script>

<template>
  <VCol
    cols="12"
  >
    <VCard class="mb-6">
      <VDivider />
      <VDataTableServer 
      :loading="configStore.loading" 
      v-model:items-per-page="localItemsPerPage"
      v-model:model-value="props.selectedRows"
      v-model:page="localPage"
      :items="props.salesInvoicesData.data"
      :items-length="props.itemsLength"
      :item-value="props.grouped ? props.groupBy === 'DocNum' ? 'DocNum_ItemCode' : 'ItemCode_DocNum' : 'DocNum'"
      :group-by="props.grouped ? [props.groupBy === 'DocNum' ? { key: 'DocNum' } : { key: 'Dscription' }] : []"
      :headers="computedHeaders"
      class="text-no-wrap"      
      :select-strategy="'all'"
      :items-per-page-options="PAGINATION_ITEMS.map((item) => item.value)"
      return-object 
      @update:options="(opt) => props.onUpdateOptions && props.onUpdateOptions(opt)"
      @update:model-value="(val) => props.onUpdateSelectedRows && props.onUpdateSelectedRows(val)"
      multi-sort
    >
      <template v-if="props.grouped" #group-header="{ item, isGroupOpen, toggleGroup }">
        <tr @click="toggleGroup(item)" style="cursor: pointer;" class="v-data-table__tr">
          <td colspan="1" class="font-weight-bold text-primary">
            <VIcon :icon="isGroupOpen(item) ? 'tabler-chevron-down' : 'tabler-chevron-right'" /> 
            {{ item.value }} ({{ item.items.length }})
          </td>
          <td v-if="groupBy === 'ItemCode'" :colspan="1"  class="text-left">
           {{  }}
          </td>            
          <td :colspan="groupBy === 'ItemCode' ? 2 : 3"  class="text-left">
            {{ formatDate(item.items[0].value.DocDate, false, { day: '2-digit', month: 'short', year: 'numeric'})  }}
          </td>
          
          <td  class="text-left font-weight-bold text-primary">
            {{ calculateTotalWeight(item.items) }}
          </td>

          <td></td>
          <td class="text-left font-weight-bold text-primary">
            {{ Number(item.items[0].value.DiscLine) }}
          </td>
          <td class="text-left font-weight-bold text-primary">
            {{ Number(item.items[0].value.DiscTotal) }}
          </td>
          <td  class="text-left font-weight-bold text-primary">
            {{ calculateTotalSales(item.items) }}
          </td>
        </tr>        
      </template>
      <template #item.ItemCode="{ item }">
        <a :href="`/customers/view/${props.customerId}/item/${item.ItemCode}`">{{ item.ItemCode }}</a>
      </template>
      <template #item.DocNum="{ item }">
        <a :href="`/customers/view/${props.customerId}/invoice/${item.DocNum}`">{{ item.DocNum }}</a>
      </template>
       <template #item.DocDate="{ item }">
         {{ formatDate(item.DocDate, false , { day: '2-digit', month: 'short', year: 'numeric'})  }}
       </template>
       <template #item.QtyKg="{ item }">
         {{ Number(item.QtyKg).toFixed(2) }}
       </template>
        <template #item.total_weight="{ item }">
         {{ Number(item.total_weight).toFixed(2) }}
       </template>
       <template #item.PriceBefDisc="{ item }">
         {{ formatMoney(item.PriceBefDisc) }}
       </template>
       <template #item.DiscLine="{ item }">
         {{ Number(item.DiscLine) }}
       </template>
        <template #item.DiscTotal="{ item }">
         {{ Number(item.DiscTotal) }}
       </template>
       <template #item.TotalSales="{ item }">
         {{ formatMoney(item.TotalSales) }}
       </template>
    </VDataTableServer>
    </VCard>
  </VCol>
</template>
