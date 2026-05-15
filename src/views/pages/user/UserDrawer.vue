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
    title: string
    value: string
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
  bbs_sales_person_id: undefined,
  sps_sales_person_id: undefined,
  username: '',
  team_id: undefined
})
const localTeams = computed(() => [...salesPersonStore.teamOptions]);
const user = useCookie<any>('userData')
const isAdmin = computed(() => {
  if(user.value.role){
    return user.value.role.role === 'admin'
  } else {
    return false
  }
})
const isPasswordVisible = ref(false)

const localSalesPersons = computed(() => {
  let options = [...salesPersonStore.filteredSalesPersonOptions]
  const currentUserId = user.value.id

  // Ambil selected IDs per Company (buat user yang sedang di-edit)
  let spsSelectedId = formData.value.sps_sales_person_id
  let bbsSelectedId = formData.value.bbs_sales_person_id

  // Filter: hide jika sudah terhubung dengan user lain
  options = options.filter(opt => {
    if (!opt.user || opt.user.length === 0) return true
    return opt.user.some((u: IUser) => u.id === formData.value.id)
  })

  // Auto-select jika login user ada di salesPersons
  const match = salesPersonStore.salesPersons.find(sp =>
    sp.user?.some(u => u.id === currentUserId)
  )

  if (match) {
    if (match.CompanyId === COMPANIES.SPS && !spsSelectedId) {
      spsSelectedId = match.SlpCode
      formData.value.sps_sales_person_id = spsSelectedId
    }
    if (match.CompanyId === 'BBS' && !bbsSelectedId) {
      bbsSelectedId = match.SlpCode
      formData.value.bbs_sales_person_id = bbsSelectedId
    }
  }

  // Jika selectedId belum ada di options, tambahkan manual
  if (spsSelectedId && !options.some(opt => opt.value === spsSelectedId)) {
    const matchSps = salesPersonStore.salesPersons.find(sp => sp.SlpCode === spsSelectedId)
    if (matchSps) {
      options.unshift({
        title: matchSps.SlpName,
        value: matchSps.id,
        user: matchSps.user ?? [],
        type: matchSps.CompanyId
      })
    }
  }

  if (bbsSelectedId && !options.some(opt => opt.value === bbsSelectedId)) {
    const matchBbs = salesPersonStore.salesPersons.find(sp => sp.SlpCode === bbsSelectedId)
    if (matchBbs) {
      options.unshift({
        title: matchBbs.SlpName,
        value: matchBbs.id,
        user: matchBbs.user ?? [],
        type: matchBbs.CompanyId
      })
    }
  }

  const sps = options.filter(opt => opt.type === COMPANIES.SPS)
  const bbs = options.filter(opt => opt.type === COMPANIES.BBS)

  return { sps, bbs }
})


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

onMounted(() => {
  if (user.value?.role?.role !== 'admin') {
    formData.value.team_id = user.value.team_id
  }
})

watch(() => props.isDrawerOpen, async (isOpen) => {
  if (isOpen) {
    formData.value = props.isEditMode ? {...props.user} : {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      role_id: undefined,
      bbs_sales_person_id: undefined,
      sps_sales_person_id: undefined,
      team_id: user.value.team_id,
      username: ''
    }

    if (props.isEditMode && props.user) {
      formData.value.bbs_sales_person_id = props.user.sales_person?.find(sp => sp.CompanyId === COMPANIES.BBS)?.id
      formData.value.sps_sales_person_id = props.user.sales_person?.find(sp => sp.CompanyId === COMPANIES.SPS)?.id
    }

    nextTick(() => {
      form.value?.resetValidation()
    })
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
                  v-model="formData.sps_sales_person_id"
                  label="Bind SPS Sales Person"
                  :items="localSalesPersons.sps"
                  item-title="title"
                  item-value="value"
                  clearable
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="formData.bbs_sales_person_id"
                  label="Bind BBS Sales Person"
                  :items="localSalesPersons.bbs"
                  item-title="title"
                  item-value="value"
                  clearable
                />
              </VCol>
              <VCol cols="12" v-if="isAdmin">
                <AppSelect 
                  v-model="formData.team_id" 
                  label="Select Team"
                  placeholder="Select Team" 
                  item-title="title" 
                  item-value="value" 
                  :rules="[]"
                  :items="localTeams" 
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
