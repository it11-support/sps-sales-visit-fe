<script lang="ts">
import { useConfigStore } from '@core/stores/config';

const configStore = useConfigStore()

export default {
  data() {
    return {
      selectedRole: -1,
      userData: useCookie<any>('userData'),
      select: shallowRef({role: 'Admin', id:1 }),
      items: [],
      isLoading: false,
      isAdmin: useCookie<any>('userData')?.value?.role?.role === 'admin',
      salesPerson: useCookie<any>('userData')?.value?.sales_person ?? null
    };
  },
  async mounted() {
    try {
      this.toggleOverlay()
     
      // Mendapatkan data roles dari API
      const { data: rolesData } = await useApi<any>(createUrl('role'), {
        method: 'GET',
      });
     
      const roleOptions = rolesData.value.data.map((role: any) => ({
        role: role.role[0].toUpperCase() + role.role.slice(1),
        id: role.id
      }))     

      this.items = roleOptions
      // Update roleOptions dari API response
      // Mengatur selectedRole berdasarkan userData

    } catch (error) {
      this.toggleOverlay()
    } finally {
      this.toggleOverlay()
    }
  },
  methods: {
    toggleOverlay() {
      this.isLoading = !this.isLoading
      configStore.toggleOverlay()
    }
  }
};
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="User Profile">
        <VCardText>
          <VForm @submit.prevent="() => {}">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Name"
                  v-model="userData.name"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Username"
                  v-model="userData.username"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  label="Email"
                  v-model="userData.email"
                  type="text"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  disabled
                  v-model="select"                 
                  :items="items"
                  item-title="role"
                  item-value="id"
                  label="Role"
                  persistent-hint
                  return-object
                  single-line
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VRow v-if="salesPerson !== null">
    <VCol cols="12">
      <VCard title="Linked Sales Person">
        <VCardSubtitle class="text-h5 ml-2 mb-2">
          {{ salesPerson.SlpName }}
        </VCardSubtitle>
        <VCardActions>
          <VBtn text="View" variant="text"></VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
