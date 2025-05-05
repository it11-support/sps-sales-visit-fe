<script setup lang="ts">
 const UserProfileForm = defineAsyncComponent(() => import('../layouts/components/profile/UserProfileForm.vue'))
</script>

<template>
  <div>
    <UserProfileForm />
  </div>
</template>
