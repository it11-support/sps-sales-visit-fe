<script setup lang="ts">
import Summary from '@/views/pages/analytic/Summary.vue';

</script>

<template>
  <div>
  <VBreadcrumbs
    class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top"
    :items="[
      {
        title: 'Home',
        to : { name: '' },
        class: 'text-primary'
      },
    ]"
    >
    <template v-slot:prepend>
      <v-icon icon='tabler-home' size="small"></v-icon>
    </template>
  </VBreadcrumbs>
    <VCard title="SALES SUMMARY" subtitle="Monthly and Yearly Sales Summary">
      <VCardText>
        <Summary />
      </VCardText>
    </VCard>
  </div>
</template>
