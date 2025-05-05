<script setup lang="ts">

const route = useRoute('customers-view-id')

const userTab = ref(null)

const tabs = [
  { icon: 'tabler-users', title: 'Account' },
  { icon: 'tabler-lock', title: 'Security' },
  { icon: 'tabler-bookmark', title: 'Billing & Plan' },
  { icon: 'tabler-bell', title: 'Notifications' },
  { icon: 'tabler-link', title: 'Connections' },
]

const { data: customerData } = await useApi<any>(`customer/${route.params.id}`)
</script>

<template>
  <VRow v-if="customerData">    
    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      {{ customerData }}
    </VCol>
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Invoice with ID  {{ route.params.id }} not found!
    </VAlert>
  </div>
</template>
