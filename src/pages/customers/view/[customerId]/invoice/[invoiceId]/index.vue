
<script lang="ts" setup>

const router = useRoute('customers-view-customerId-invoice-invoiceId' as any)

const { data: salesInvoices } = await useApi<any>(createUrl(`invoice`, {
  query: {
    id: router.params.customerId,
    invoiceId: router.params.invoiceId,
   
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
