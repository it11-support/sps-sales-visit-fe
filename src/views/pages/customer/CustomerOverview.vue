<script lang="ts" setup>
  import type { CustomerData } from '@core/types';
import CustomerItemList from './CustomerItemList.vue';
  const props = defineProps<{ data: CustomerData }>()
  const {data} = props

  const balance = data.Balance ? formatMoney(data.Balance) : '0.00'
  const checksBal = data.ChecksBal ? formatMoney(data.ChecksBal) : '0.00'
  const dnotesBal = data.DNotesBal ? formatMoney(data.DNotesBal) : '0.00'
  const ordesrBal = data.OrdersBal ? formatMoney(data.OrdersBal) : '0.00'
  const createDate = data.CreateDate ? formatDate(data.CreateDate) : '-'
  const updateDate = data.UpdateDate ? formatDate(data.UpdateDate) : '-'
  const salesPersonName = data.sales_person ? data.sales_person.SlpName : '-'

  const items = [
    {title: 'Customer Name', value: data.CardName, icon: 'tabler-buildings'},
    {title: 'Address', value: `${data.Address} ${data.ZipCode ?? ''} , ${data.City ?? ''}`, icon: 'tabler-map'},
    {title: 'Mailing Address', value: `${data.MailAddres} ${data.MailZipCode ?? ''} , ${data.MailCity ?? ''}` , icon: 'tabler-mailbox'},
    {title: 'Phone 1', value: `${data.Phone1}`, icon: 'tabler-phone'},
    {title: 'Phone 2', value: `${data.Phone2 ?? '-'}`, icon: 'tabler-phone'},
    {title: 'Fax', value: `${data.Fax ?? '-'}`, icon: 'tabler-phone'},
    {title: 'Cellular', value: `${data.Cellular ?? '-'}`, icon: 'tabler-device-mobile'},
    {title: 'Email', value: `${data.E_Mail ?? '-'}`, icon: 'tabler-mail', isEmail: true},
    {title: 'Contact Person', value: `${data.CntctPrsn ?? '-'}`, icon: 'tabler-message-user'},
    {title: 'Customer Type', value: `${data.CardType ?? '-'}`, icon: 'tabler-checkbox'},
    {title: 'Balance', value: `${balance}`, icon: 'tabler-report-money'},
    {title: 'Checks Balance', value: `${checksBal}`, icon: 'tabler-report-money'},
    {title: 'Notes Balance', value: `${dnotesBal}`, icon: 'tabler-report-money'},
    {title: 'Orders Balance', value: `${ordesrBal}`, icon: 'tabler-report-money'},
    {title: 'Date Created', value: `${createDate}`, icon: 'tabler-calendar'},
    {title: 'Last Updated', value: `${updateDate}`, icon: 'tabler-calendar'},
    {title: 'Sales Person', value: `${salesPersonName}`, icon: 'tabler-user'},
  ]
</script>

<template>
  <VCard>
    <VCardText>
      <p class="text-lg text-disabled">
        CUSTOMER OVERVIEW - {{ data.CardCode }}
      </p>
      <span class="d-flex gap-2 pb-2">
        <VChip        
          :color="data.ValidFor === 'N' ? 'error' : 'success'"
          label
          size="small"
        >
        Valid
        </VChip>
        <VChip 
          :color="data.FrozenFor === 'N' ? 'error' : 'success'"
          label
          size="small"
        >
        Frozen
        </VChip>      
      </span>
      <VList class="card-list text-medium-emphasis">
        <CustomerItemList v-for="item in items" :key="item.title" :data="item" />
      </VList>
    </VCardText>
  </VCard>
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
