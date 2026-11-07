<script setup lang="ts">
import { useActivityStore } from '@/@core/stores';
import { IProductDisplay } from '@/@core/typedefs';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type DisplayType = 'own_product' | 'competitor'



interface PendingImage {
  id: number
  file: File
  preview: string
  status: 'uploading' | 'failed'
}

const props = withDefaults(defineProps<{
  assignmentId: string | number
  type: DisplayType
  existingImages?: IProductDisplay[]
  disabled?: boolean
  readOnly?: boolean
}>(), {
  existingImages: () => [],
  disabled: false,
  readOnly: false,
})

const emit = defineEmits<{
  (e: 'uploaded'): void
  (e: 'delete', id: number): void
}>()

const activityStore = useActivityStore()

const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

const hasCamera = ref(false)
const uploading = ref(false)
const pendingImages = ref<PendingImage[]>([])
const error = ref('')

const MAX_IMAGES = 20
const MAX_SIZE = 5 * 1024 * 1024
const previewDialog = ref(false);
const previewIndex = ref(0);

let nextId = 0

const title = computed(() =>
  props.type === 'own_product'
    ? 'Own Product Display'
    : 'Competitor Product Display',
)

const existing = computed(() =>
  props.existingImages.filter(
    image => image.type === props.type,
  ),
)

const previewImages = computed(() => [
  ...existing.value.map(image => ({
    id: `existing-${image.id}`,
    src: image.image_path,
  })),
  ...pendingImages.value.map(image => ({
    id: `pending-${image.id}`,
    src: image.preview,
  })),
]);

const openPreview = (index: number) => {
  previewIndex.value = index;
  previewDialog.value = true;
};

const totalImages = computed(() =>
  existing.value.length + pendingImages.value.length,
)

const canAdd = computed(() =>
  !props.disabled
  && !uploading.value
  && totalImages.value < MAX_IMAGES,
)

onMounted(async () => {
  try {
    if (!navigator.mediaDevices?.enumerateDevices)
      return

    const devices = await navigator.mediaDevices.enumerateDevices()

    hasCamera.value = devices.some(
      device => device.kind === 'videoinput',
    )
  }
  catch {
    hasCamera.value = false
  }
})

const photoInput = ref<HTMLInputElement | null>(null)

const openPhoto = () => {
  if (!canAdd.value) return

  photoInput.value?.click()
}


const removePending = (id: number) => {
  const index = pendingImages.value.findIndex(
    image => image.id === id,
  )

  if (index === -1)
    return

  URL.revokeObjectURL(pendingImages.value[index].preview)
  pendingImages.value.splice(index, 1)
}

const clearPending = () => {
  pendingImages.value.forEach(image => {
    URL.revokeObjectURL(image.preview)
  })

  pendingImages.value = []
}

const sendImages = async (images: PendingImage[]) => {
  if (!images.length || uploading.value)
    return

  uploading.value = true
  error.value = ''

  images.forEach(image => {
    image.status = 'uploading'
  })

  try {
    const body = new FormData()

    body.append('assignment_id', String(props.assignmentId))
    body.append('type', props.type)

    images.forEach(image => {
      body.append('images[]', image.file)
    })

    const result = await activityStore.uploadProductDisplays(body)

    if (!result)
      throw new Error('Upload failed.')

    images.forEach(image => removePending(image.id))

    // Parent memperbarui existingImages dari store.
    await activityStore.fetchActivityReport(
      String(props.assignmentId),
    )

    emit('uploaded')
  }
  catch (err) {
    console.error('Product display upload failed:', err)

    images.forEach(image => {
      image.status = 'failed'
    })

    error.value = err instanceof Error
      ? err.message
      : 'Failed to upload photos.'
  }
  finally {
    uploading.value = false
  }
}

const addFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  input.value = ''

  if (!files.length || !canAdd.value)
    return

  error.value = ''

  const available = MAX_IMAGES - totalImages.value

  if (files.length > available) {
    error.value = `Maximum ${MAX_IMAGES} photos allowed.`
    return
  }

  const invalid = files.find(file =>
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    || file.size > MAX_SIZE,
  )

  if (invalid) {
    error.value = `Invalid image: ${invalid.name}. JPG, PNG, WebP only, maximum 5 MB.`
    return
  }

  const previews: PendingImage[] = files.map(file => ({
    id: ++nextId,
    file,
    preview: URL.createObjectURL(file),
    status: 'uploading',
  }))

  pendingImages.value.push(...previews)

  // Upload otomatis setelah gambar dipilih.
  await sendImages(previews)
}

const retryImage = async (id: number) => {
  const image = pendingImages.value.find(
    item => item.id === id && item.status === 'failed',
  )

  if (!image || uploading.value || props.disabled)
    return

  await sendImages([image])
}

onBeforeUnmount(() => {
  clearPending()
})
</script>

<template>
  <VCard variant="outlined" class="rounded-lg mb-4">
    <VCardText>

      <div class="mb-4">
        <div class="d-flex align-center justify-space-between ga-2">
          <div class="d-flex align-center ga-2 min-width-0">
            <VAvatar color="primary" variant="tonal" rounded="lg" size="36">
              <VIcon :icon="type === 'own_product'
                ? 'tabler-package'
                : 'tabler-building-store'" size="20" />
            </VAvatar>

            <div class="text-subtitle-2 font-weight-semibold">
              {{ title }}
            </div>
          </div>

          <VChip size="small" variant="tonal" color="primary" class="flex-shrink-0">
            {{ totalImages }}/{{ MAX_IMAGES }}
          </VChip>
        </div>
      </div>


      <!-- Camera input -->
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden @change="addFiles">

      <!-- Gallery input -->
      <input ref="galleryInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="addFiles">

      <div class="d-flex flex-wrap ga-2 mb-4">

        <VBtn v-if="!props.readOnly" color="warning" type="button" :disabled="!canAdd" @click="openPhoto">
          Add Photo
          <VIcon end icon="tabler-camera" />
        </VBtn>

        <input ref="photoInput" type="file" accept="image/*" capture="environment" multiple hidden @change="addFiles" />
      </div>

      <!-- Photos -->
      <VRow v-if="existing.length || pendingImages.length">
        <!-- Existing photos -->
        <VCol v-for="image in existing" :key="`existing-${image.id}`" cols="12" sm="4" md="3" lg="2">
          <div class="position-relative">
            <VImg :src="image.image_path" aspect-ratio="1" cover class="rounded-lg cursor-pointer"
              @click="openPreview(existing.findIndex(item => item.id === image.id))" />

            <VBtn v-if="!disabled && !props.readOnly" icon="tabler-trash" size="x-small" color="error" class="remove-button"
              :disabled="uploading" @click="emit('delete', image.id)" />
          </div>
        </VCol>

        <!-- Uploading / failed photos -->
        <VCol v-for="image in pendingImages" :key="`pending-${image.id}`" cols="12" sm="4" md="3" lg="2">
          <div class="position-relative">
            <VImg :src="image.preview" aspect-ratio="1" cover class="rounded-lg cursor-pointer" @click="openPreview(
              existing.length +
              pendingImages.findIndex(item => item.id === image.id)
            )" />

            <div v-if="image.status === 'uploading'" class="upload-overlay d-flex align-center justify-center">
              <VProgressCircular indeterminate color="white" size="28" />
            </div>

            <template v-else>
              <VChip size="x-small" color="error" class="status-chip">
                Failed
              </VChip>

              <VBtn icon="tabler-refresh" size="x-small" color="primary" class="retry-button"
                :disabled="uploading || disabled" @click="retryImage(image.id)" />
            </template>

            <VBtn v-if="image.status === 'failed'" icon="tabler-x" size="x-small" color="error" class="remove-button"
              :disabled="uploading || disabled" @click="removePending(image.id)" />
          </div>
        </VCol>
      </VRow>

      <div v-else class="text-center text-medium-emphasis py-6">
        <VIcon icon="tabler-photo" size="36" class="mb-2" />

        <div class="text-body-2">
          No photos added yet
        </div>
      </div>

      <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ error }}
      </VAlert>
    </VCardText>
  </VCard>
  <VDialog v-model="previewDialog" fullscreen transition="dialog-bottom-transition">
    <VCard color="black" class="d-flex flex-column">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-white text-body-2">
          {{ previewIndex + 1 }} / {{ previewImages.length }}
        </span>

        <VBtn icon="tabler-x" variant="text" color="white" @click="previewDialog = false" />
      </div>

      <!-- Image slider -->
      <VCarousel v-if="previewImages.length" v-model="previewIndex" hide-delimiters show-arrows="hover"
        class="preview-carousel flex-grow-1">
        <VCarouselItem v-for="image in previewImages" :key="image.id">
          <VImg :src="image.src" contain height="100%" width="100%" />
        </VCarouselItem>
      </VCarousel>
    </VCard>
  </VDialog>
</template>

<style scoped>
.remove-button {
  position: absolute;
  z-index: 3;
  top: 5px;
  right: 5px;
}

.retry-button {
  position: absolute;
  z-index: 3;
  right: 5px;
  bottom: 5px;
}

.status-chip {
  position: absolute;
  z-index: 2;
  bottom: 5px;
  left: 5px;
}

.upload-overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  border-radius: 8px;
  background: rgb(0 0 0 / 40%);
}

.cursor-pointer {
  cursor: pointer;
}

.preview-carousel {
  height: calc(100dvh - 64px) !important;
}

.preview-carousel :deep(.v-carousel-item) {
  height: 100% !important;
}

.preview-carousel :deep(.v-img) {
  height: 100%;
}
</style>
