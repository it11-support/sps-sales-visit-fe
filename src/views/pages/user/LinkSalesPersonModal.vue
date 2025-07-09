

<script lang="ts" setup>
import { useConfigStore, useUserStore } from '@/@core/stores';
import { IUser } from '@/@core/typedefs';
import { SortItem } from '@/@core/types';
import { handleUserBinding } from '@/utils/user/binding';

const modalProps = defineProps<{
  show: boolean,
  salesPersonId?: number,
  type: 'link' | 'unlink'
  onFinish?: () => void
}>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()
const toggleModal = () => {
  emit('update:show', !modalProps.show)
}
const sortOptions = ref<SortItem[]>([])
const page = ref(1)
const selectedSalesPerson = ref()
const configStore = useConfigStore()
const selectedUser = ref()
const usersOptions = ref<{label: string, value: number}[]>([])
const userStore = useUserStore()

const handleSalesPersonLink = async () => {
  await handleUserBinding({
    type: modalProps.type,
    userId: selectedUser.value, 
    salesPersonId: modalProps.salesPersonId,
    callback: () => {}, 
    onFinish: () => {
      emit('update:show', false)
      selectedUser.value = null
      selectedSalesPerson.value = null
      modalProps.onFinish && modalProps.onFinish()
    }
  })
}

const updateUsersOptions = async () => {
  userStore.updateQuery({page, per_page: -1, sort_options: sortOptions.value})
  await userStore.fetchUsers()
  usersOptions.value = userStore.users
    .filter((user: IUser) => user.sales_person == null)
    .filter((user: IUser) => !['admin', 'spv'].includes(user.role?.role ?? ''))
    .map((user: IUser) => ({
      label: user.name,
      value: user.id
    }))
}

watch(modalProps, async(newVal) => {
  newVal.show && newVal.type === 'link' && await updateUsersOptions()
}, { deep: true })
</script>

<template>
  <VDialog :model-value="modalProps.show" max-width="500" @click:outside="toggleModal">
    <VCard>
      <div v-if="modalProps.type === 'link'">
        <VCardTitle> Sales Person is not linked to any user </VCardTitle>
        <VCardSubtitle class="text-h5 mb-2">Link sales person to user</VCardSubtitle>
        <VCardText>
          <AppSelect
            :disabled="configStore.loading"
            :loading="configStore.loading"
            v-model="selectedUser"
            clearable
            clear-icon="tabler-x"
            item-title="label"
            item-value="value"
            :items="usersOptions"          
            label="User"
            retun-object
          />
        </VCardText>
      </div>
      <div v-else-if="modalProps.type === 'unlink'">
        <VCardTitle> Unlink User from Sales Person </VCardTitle>
        <VCardText>
          Are you sure you want to unlink this user from the sales person?
        </VCardText>
      </div>
      <VCardActions>
        <VSpacer />
        <VBtn @click="toggleModal"> Cancel </VBtn>
        <VBtn 
          :prepend-icon="modalProps.type === 'unlink' ? 'tabler-link-off' : 'tabler-link'" 
          :color="modalProps.type === 'unlink' ? 'error' : 'success'" 
          @click="handleSalesPersonLink"
        > 
          {{ modalProps.type === 'unlink' ? 'Unlink' : 'Link' }} 
        </VBtn>
      </VCardActions>
    </VCard>      
  </VDialog>
</template>
