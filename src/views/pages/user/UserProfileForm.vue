<script lang="ts" setup>
import { useCustomerStore } from '@/@core/stores/customer';
import { useRoleStore } from '@/@core/stores/role';
import { useConfigStore } from '@core/stores/config';
import avatar1 from '@images/avatars/user-default.png';
import { VForm } from 'vuetify/components/VForm';

const configStore = useConfigStore()
const customerStore = useCustomerStore()

const userData = useCookie<any>('userData')
const form = ref<VForm>()
const salesPerson = useCookie<any>('userData')?.value?.sales_person ?? null
const password = ref('')
const confirm_password = ref('')
const errors = ref([])
const isPasswordVisible = ref(false)
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 400)
const roleStore = useRoleStore()

const user = useCookie<any>('userData')
const isAdmin = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'admin'
  } else {
    return false
  }
})
const isSpv = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'spv'
  } else {
    return false
  }
})

watch(debouncedQuery, (val) => {
  customerStore.updateFilters({ search: val })
})

customerStore.$reset()

onMounted(async() => {
  if(isAdmin.value) {
    await customerStore.initialize()
  } else if(isSpv.value) {
    await customerStore.initialize(undefined, user.value.team_id)
  } else {
    await customerStore.initialize(user.value.sales_person_id)
  }
  roleStore.fetchRoles()
})

const submitUserHandler = async () => {
  try {
    const validation = await form.value?.validate()
    if (validation) {
      const { valid, errors } = validation
      if (!valid) {
        return
      }
    }
    configStore.overlay = true
    const res = await $api(`/user/update/${userData.value.id}`, {
      method: 'PUT',
      body: JSON.parse(JSON.stringify({
        ...userData.value,
        ...(password.value ? { password: password.value } : {}),
      })),
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    const { data } = res
    useCookie('userData').value = data
    configStore.overlay = false

  } catch (error) {
    configStore.overlay = false
  }
}


</script>

<template>
  <VRow v-if="salesPerson !== null">
    <VCol cols="12">
      <VBreadcrumbs
        class="px-0 pb-2 pt-0 help-center-breadcrumbs"
        :items="[{title: 'Home', to: '/', class: 'text-primary' },{ title: 'Profile', class: 'text-primary' }]"
      >
      <template v-slot:prepend>
        <v-icon icon='tabler-home' size="small"></v-icon>
      </template>
      </VBreadcrumbs>
      <VCard title="Linked Sales Person">
        <VCardSubtitle class="text-h5 ml-2 mb-4">
          <VAvatar size="30" :image="avatar1"></VAvatar>
          {{ salesPerson[0].SlpName }}
        </VCardSubtitle>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard title="User Profile">
        <VCardText>
          <VForm ref="form" @submit.prevent="submitUserHandler">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField label="Name" v-model="userData.name" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField :disabled="!isAdmin" label="Username" v-model="userData.username" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField :disabled="!isAdmin" label="Email" v-model="userData.email" type="text" />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect :disabled="!isAdmin" v-model="userData.role_id" :items="roleStore.roleOptions" item-title="role"
                  item-value="id" label="Role" persistent-hint single-line />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField v-model="password" label="Password" placeholder="············"
                  :rules="password ? [requiredValidator, passwordValidator] : []"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField v-model="confirm_password" label="Password Confirmation" placeholder="············"
                  :rules="[confirmedValidator(confirm_password, password)]"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>
              <VCol cols="12">
                <VBtn type="submit" class="me-3">
                  Submit
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.trim-text-wrapper {
  overflow: hidden;
  inline-size: 200px;
  max-inline-size: 200px;
  white-space: normal;

  .trim-text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
  }
}
</style>
