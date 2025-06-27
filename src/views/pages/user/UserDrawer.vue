<script setup lang="ts">
import { useSalesPersonStore } from '@/@core/stores/sales-person';
import { IUser } from '@core/typedefs';
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { VForm } from 'vuetify/components/VForm';

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'userData', value: IUser): void
}
interface Props {
  isDrawerOpen: boolean
  isEditMode: boolean
  user?: IUser
  roleOptions: {
    role: string
    id: number
  }[]
  salesPersonsOptions: {
    label: string
    value: number
  }[]
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const salesPersonStore = useSalesPersonStore()
const isFormValid = ref(false)
const form = ref<VForm>()
const formData = ref<any>({
  name: '',
  email: '',
  password: '',
  confirm_password: '',
  role_id: undefined,
  sales_person_id: undefined,
  username: ''
})
const localSalesPersons = ref<{label: string, value: number}[]>([...props.salesPersonsOptions])

const isPasswordVisible = ref(false)
// Close drawer
const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    form.value?.reset()
    form.value?.resetValidation()
  })
}

const onSubmit = async () => {
  if (!props.isEditMode) {
    await form.value?.validate()
  }

  if (!form.value?.errors.length) {
    emit('userData', formData.value)
  }
}

const handleDrawerModelValueUpdate = (val: boolean) => {
  emit('update:isDrawerOpen', val)
  if (!val) {
    nextTick(() => {
      form.value?.reset()
      form.value?.resetValidation()
    })
  }
}

watch(props, async (newVal) => {
  
  if (newVal.isDrawerOpen) {
    formData.value = props.isEditMode && props.isDrawerOpen ? props.user : {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      role_id: undefined,
      sales_person_id: undefined,
      username: ''
    }
    nextTick(() => {
      form.value?.resetValidation()
    })
  }
  if (formData.value.sales_person_id) {
    const exists = localSalesPersons.value.some(
      sp => sp.value === formData.value.sales_person_id
    )
    if (!exists) {
      const match = salesPersonStore.salesPersons.find(sp => sp.SlpCode === formData.value.sales_person_id)
      if (match) {
        localSalesPersons.value.unshift({
          label: match.SlpName,
          value: match.SlpCode,
        })
      }
    }
  }
})

</script>
<template>
  <VNavigationDrawer data-allow-mismatch temporary :width="400" location="end" class="scrollable-content"
    :model-value="props.isDrawerOpen" @update:model-value="handleDrawerModelValueUpdate">
    <AppDrawerHeaderSection title="Add User" @cancel="closeDrawer" />
    <VDivider />
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm ref="form" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <!-- 👉 Full name -->
              <VCol cols="12">
                <AppTextField v-model="formData.name" :rules="[requiredValidator]" label="Full Name"
                  placeholder="John Doe" />
              </VCol>

              <!-- 👉 Username -->
              <VCol cols="12">
                <AppTextField v-model="formData.username" :rules="[requiredValidator]" label="Username"
                  placeholder="Johndoe" />
              </VCol>

              <!-- 👉 Email -->
              <VCol cols="12">
                <AppTextField v-model="formData.email" :rules="[requiredValidator, emailValidator]" label="Email"
                  placeholder="johndoe@email.com" />
              </VCol>
              <!-- 👉 password -->
              <!-- <template v-if="!props.isEditMode"> -->
              <VCol cols="12">
                <AppTextField v-model="formData.password" label="Password" placeholder="············"
                  :rules="formData.password ? [requiredValidator, passwordValidator] : []"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol><!-- 👉 confirm password -->
              <VCol cols="12">
                <AppTextField v-model="formData.confirm_password" label="Password" placeholder="············"
                  :rules="[confirmedValidator(formData.confirm_password, formData.password)]"
                  :type="isPasswordVisible ? 'text' : 'password'" autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>
              <!-- </template> -->
              <!-- 👉 Role -->
              <VCol cols="12">
                <AppSelect 
                  v-model="formData.role_id"
                  label="Select Role" 
                  placeholder="Select Role" 
                  item-title="role"
                  item-value="id"
                  :rules="[requiredValidator]" 
                  :items="props.roleOptions" 
                />
              </VCol>
              <VCol cols="12">
                <AppSelect 
                  v-model="formData.sales_person_id" 
                  label="Bind Sales Person"
                  placeholder="Select Sales Person" 
                  item-title="label" 
                  item-value="value" 
                  :rules="[]"
                  :items="localSalesPersons" 
                />
              </VCol>

              <!-- 👉 Submit and Cancel -->
              <VCol cols="12">
                <VBtn type="submit" class="me-3">
                  Submit
                </VBtn>
                <VBtn type="reset" variant="tonal" color="error" @click="closeDrawer">
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

  </VNavigationDrawer>
</template>
