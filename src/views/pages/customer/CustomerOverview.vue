<script lang="ts" setup>
  import type { ICustomerData } from '@core/types';
import CustomerItemList from './CustomerItemList.vue';
  const props = defineProps<{ data: ICustomerData }>()
  const { data } = props

  const salesPersonName = data.sales_person ? data.sales_person.SlpName : '-'

  const items = [
    {title: 'Customer Name', value: data.CardName, icon: 'tabler-buildings'},
    {title: 'Group Name', value: data.GroupName, icon: 'tabler-users-group'},
    {title: 'Address', value: `${data.Address} ${data.ZipCode ?? ''} , ${data.City ?? ''}`, icon: 'tabler-map'},
    {title: 'Phone', value: `${data.Phone1}`, icon: 'tabler-phone'},
    {title: 'Cellular', value: `${data.Cellular ?? '-'}`, icon: 'tabler-device-mobile'},
    {title: 'Contact Person', value: `${data.CntctPrsn ?? '-'}`, icon: 'tabler-message-user'},
    {title: 'Sales Person', value: `${salesPersonName}`, icon: 'tabler-user'},
  ]
</script>

<template>
   <VCol
      cols="12"
    >
    <VCard>
      <VCardText>
        <p class="text-lg text-disabled">
          CUSTOMER OVERVIEW - {{ data.CardCode }}
        </p>
        <span class="d-flex gap-2 pb-2">
          <VChip 
            :color="data.NonActive === 'Y' ? 'error' : 'success'"
            label
            size="small"
          >
          {{ data.NonActive === 'Y' ? 'Inactive' : 'Active' }}
          </VChip>      
        </span>
        <VList class="card-list text-medium-emphasis">
          <CustomerItemList v-for="item in items" :key="item.title" :data="item" />
        </VList>
      </VCardText>
    </VCard>
  </VCol>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;

  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card-list > * {
  flex-basis: 48%;
  margin-block-end: 10px;
}

@media (max-width: 768px) {
  .card-list > * {
    flex-basis: 100%;
  }
}
</style>
