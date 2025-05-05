<script>
export default {
  name: 'UnauthorizedPage',
}
</script>

<template>
  <div class="unauthorized-page">
    <h1>Unauthorized</h1>
    <p>You are not authorized to view this page</p>
    <button @click="$router.push({ name: 'login' })">Login</button>
  </div>
</template>

<style>
.unauthorized-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 100vh;
}
</style>
