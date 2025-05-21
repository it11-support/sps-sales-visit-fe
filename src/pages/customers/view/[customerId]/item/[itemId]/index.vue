
<script lang="ts" setup>

const router = useRoute('customers-view-customerId-item-itemId' as any)

const { data: salesInvoices } = await useApi<any>(createUrl(`invoice`, {
  query: {
    id: router.params.customerId,
    itemId: router.params.itemId,
   
    per_page: DEFAULT_PER_PAGE,
    page: 1,
    // sort_options: sortOptions,
    // start_date: startDate,
    // end_date: endDate,
    // group_by: groupBy
  }
}))

console.log(salesInvoices.value)
</script>

<template>
  <section>
    <h1>{{ salesInvoices.value?.data }}</h1>
  </section>
</template>
