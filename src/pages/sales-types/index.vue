<script setup lang="ts">
import { useSalesTypeStore } from '@/@core/stores'
import type { ISalesType, SalesTypePayload } from '@core/types'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const salesTypeStore = useSalesTypeStore()

const searchQuery = ref('')
const isConfirmDialogVisible = ref(false)
const selectedDeleteItem = ref<ISalesType | null>(null)

const form = reactive<SalesTypePayload>({
  code: '',
  name: '',
  is_active: true,
})

const headers = [
  { title: 'Code', key: 'code' },
  { title: 'Name', key: 'name' },
  { title: 'Users', key: 'users_count', sortable: false },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const paginationItems = [
  { title: '10', value: 10 },
  { title: '25', value: 25 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
]

const page = computed({
  get: () => salesTypeStore.query.page,
  set: value => {
    salesTypeStore.query.page = value
  },
})

const perPage = computed({
  get: () => salesTypeStore.query.per_page,
  set: value => {
    salesTypeStore.query.per_page = value
  },
})

const selectedId = computed(
  () => salesTypeStore.selectedSalesType?.id,
)

const isFormValid = computed(
  () => form.code.trim() !== '' && form.name.trim() !== '',
)

let searchTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  salesTypeStore.fetchSalesTypes()
})

onUnmounted(() => {
  if (searchTimeout)
    clearTimeout(searchTimeout)
})

function handleSearch(value: string | null) {
  searchQuery.value = value ?? ''

  if (searchTimeout)
    clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    salesTypeStore.updateQuery({
      search: searchQuery.value,
      page: 1,
    })
  }, 500)
}

function handleTableOptions(options: {
  page: number
  itemsPerPage: number
  sortBy: Array<{
    key: string
    order: 'asc' | 'desc'
  }>
}) {
  const sort = options.sortBy[0]

  const sortBy = (
    ['id', 'code', 'name', 'is_active', 'created_at']
      .includes(sort?.key)
      ? sort.key
      : 'id'
  ) as typeof salesTypeStore.query.sort_by

  const sortOrder = sort?.order ?? 'desc'

  const changed =
    salesTypeStore.query.page !== options.page ||
    salesTypeStore.query.per_page !== options.itemsPerPage ||
    salesTypeStore.query.sort_by !== sortBy ||
    salesTypeStore.query.sort_order !== sortOrder

  if (!changed)
    return

  salesTypeStore.updateQuery({
    page: options.page,
    per_page: options.itemsPerPage,
    sort_by: sortBy,
    sort_order: sortOrder,
  })
}

function openCreate() {
  Object.assign(form, {
    code: '',
    name: '',
    is_active: true,
  })

  salesTypeStore.openCreateDrawer()
}

function openEdit(item: ISalesType) {
  Object.assign(form, {
    code: item.code,
    name: item.name,
    is_active: item.is_active,
  })

  salesTypeStore.openEditDrawer(item)
}

async function saveSalesType() {
  if (!isFormValid.value || salesTypeStore.saving)
    return

  const payload: SalesTypePayload = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    is_active: form.is_active,
  }

  try {
    if (salesTypeStore.isEditMode && selectedId.value) {
      await salesTypeStore.updateSalesType(
        selectedId.value,
        payload,
      )
    }
    else {
      await salesTypeStore.storeSalesType(payload)
    }

    salesTypeStore.closeDrawer()
  }
  catch {
    // Error sudah disimpan di store.
  }
}

function confirmDelete(item: ISalesType) {
  selectedDeleteItem.value = item
  isConfirmDialogVisible.value = true
}

async function deleteSalesType() {
  if (!selectedDeleteItem.value)
    return

  try {
    await salesTypeStore.destroySalesType(
      selectedDeleteItem.value.id,
    )

    isConfirmDialogVisible.value = false
    selectedDeleteItem.value = null
  }
  catch {
    // Error ditampilkan melalui store.
  }
}
</script>

<template>
  <section>
    <VBreadcrumbs class="px-0 pb-2 pt-0 help-center-breadcrumbs sticky-top" :items="[
      { title: 'Home', to: '/' },
      { title: 'Sales Types' },
    ]">
      <template #prepend>
        <VIcon icon="tabler-home" size="small" />
      </template>
    </VBreadcrumbs>

    <VCard class="mb-6">
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="me-3">
          <AppSelect v-model="perPage" :items="paginationItems" style="inline-size: 6.25rem;" />
        </div>

        <VSpacer />

        <div class="d-flex align-center flex-wrap gap-4">
          <div style="inline-size: 15.625rem;">
            <AppTextField :model-value="searchQuery" placeholder="Search sales types..." clearable clear-icon="tabler-x"
              @update:model-value="handleSearch" />
          </div>

          <VBtn prepend-icon="tabler-plus" @click="openCreate">
            Add Sales Type
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <VDataTableServer v-model:page="page" v-model:items-per-page="perPage" :headers="headers"
        :items="salesTypeStore.salesTypes" :items-length="salesTypeStore.pagination.total"
        :loading="salesTypeStore.loading" :items-per-page-options="paginationItems" item-value="id" class="text-no-wrap"
        @update:options="handleTableOptions">
        <template #item.code="{ item }">
          <VChip size="small" variant="tonal">
            {{ item.code }}
          </VChip>
        </template>

        <template #item.users_count="{ item }">
          {{ item.users_count ?? 0 }}
        </template>

        <template #item.is_active="{ item }">
          <VChip size="small" label :color="item.is_active ? 'success' : 'secondary'">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn icon variant="text" color="medium-emphasis">
            <VIcon icon="tabler-dots-vertical" />

            <VMenu activator="parent">
              <VList>
                <VListItem @click="openEdit(item)">
                  <template #prepend>
                    <VIcon icon="tabler-edit" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
                </VListItem>

                <VListItem :disabled="(item.users_count ?? 0) > 0" @click="confirmDelete(item)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Delete</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Add / Edit Dialog -->
    <VDialog v-model="salesTypeStore.isDrawerVisible" max-width="500" :persistent="salesTypeStore.saving">
      <VCard>
        <VCardTitle class="pa-6">
          {{ salesTypeStore.isEditMode
            ? 'Edit Sales Type'
            : 'Add Sales Type' }}
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-6">
          <VForm @submit.prevent="saveSalesType">
            <VRow>
              <VCol cols="12">
                <AppTextField v-model="form.code" label="Code" placeholder="GENERAL" :disabled="salesTypeStore.saving"
                  required />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="form.name" label="Name" placeholder="General" :disabled="salesTypeStore.saving"
                  required />
              </VCol>

              <VCol cols="12">
                <VSwitch v-model="form.is_active" label="Active" color="primary" :disabled="salesTypeStore.saving" />
              </VCol>

              <VCol v-if="salesTypeStore.error" cols="12">
                <VAlert type="error" variant="tonal" closable @click:close="salesTypeStore.error = null">
                  {{ salesTypeStore.error }}
                </VAlert>
              </VCol>
            </VRow>

            <div class="d-flex justify-end gap-3 mt-6">
              <VBtn variant="tonal" color="warning" :disabled="salesTypeStore.saving"
                @click="salesTypeStore.closeDrawer()">
                Cancel
              </VBtn>

              <VBtn type="submit" :loading="salesTypeStore.saving" :disabled="!isFormValid">
                {{ salesTypeStore.isEditMode
                  ? 'Save Changes'
                  : 'Create' }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation -->
    <VDialog v-model="isConfirmDialogVisible" max-width="420">
      <VCard>
        <VCardTitle class="pa-6">
          Delete Sales Type
        </VCardTitle>

        <VCardText>
          Are you sure you want to delete
          <strong>{{ selectedDeleteItem?.name }}</strong>?
          This action cannot be undone.

          <VAlert v-if="salesTypeStore.error" type="error" variant="tonal" class="mt-4">
            {{ salesTypeStore.error }}
          </VAlert>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />

          <VBtn variant="tonal" color="secondary" @click="isConfirmDialogVisible = false">
            Cancel
          </VBtn>

          <VBtn color="error" :loading="salesTypeStore.saving" @click="deleteSalesType">
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>
