<script setup lang="ts">
import { useActivityStore, useConfigStore } from '@/@core/stores';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const modalProps = defineProps<{
  show: boolean
  assignmentId: number 
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const toggleModal = () => emit('update:show', !modalProps.show)

const activityStore = useActivityStore()
const configStore = useConfigStore()

const isCameraOpen = ref(false)
const isPhotoTaken = ref(false)
const isShotPhoto = ref(false)
const isLoading = ref(false)
const hasMultipleCameras = ref(false)
const isCameraAvailable = ref(false)
const isCheckingCamera = ref(false)
const cameraErrorMessage = ref('')

const camera = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFacingMode = ref<'user' | 'environment'>('user')
const location = ref<GeolocationPosition | null>(null)
const router = useRouter()

let stream: MediaStream | null = null

const isCameraSupported = computed(() =>
  !!navigator.mediaDevices?.getUserMedia
)
const isMobileDevice = computed(() => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || navigator.maxTouchPoints > 1
})

const stopCameraStream = () => {
  if (camera.value?.srcObject) {
    (camera.value.srcObject as MediaStream).getTracks().forEach(track => track.stop())
    camera.value.srcObject = null
  }
}

const createCameraElement = async () => {
  configStore.overlay = true
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: selectedFacingMode.value },
      audio: false
    })
    stream = mediaStream
    isCameraAvailable.value = true
    if (!camera.value) await nextTick()
    if (camera.value) {
      camera.value.srcObject = stream
      camera.value.muted = true
      camera.value.setAttribute('playsinline', 'true')
      await camera.value.play().catch(() => {})
    }
  } catch (error) {
    console.warn('Failed to open camera:', error)
    isCameraAvailable.value = false
    cameraErrorMessage.value = 'Camera not accessible, please try to upload an image'
  } finally {
    configStore.overlay = false
  }
}

const detectMultipleCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputs = devices.filter(device => device.kind === 'videoinput')
    hasMultipleCameras.value = videoInputs.length > 1
  } catch {
    hasMultipleCameras.value = false
  }
}

const getLocation = async (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      location.value = pos
      resolve(pos)
    }, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })
  })
}

const finalizeCapturedPhoto = (source: HTMLImageElement | HTMLVideoElement) => {
  if (!canvas.value) return
  drawToCanvasWithResize(source, canvas.value)
  isShotPhoto.value = true
  isPhotoTaken.value = true
  setTimeout(() => {
    isShotPhoto.value = false
  }, 180)
}

const takePhoto = async () => {
  if (!camera.value) return
  finalizeCapturedPhoto(camera.value)
}

const toggleCameraFacing = async () => {
  selectedFacingMode.value = selectedFacingMode.value === 'user' ? 'environment' : 'user'
  stopCameraStream()
  await createCameraElement()
}

const handlePhoto = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = e => {
    const img = new Image()
    img.onload = () => {
      finalizeCapturedPhoto(img)
    }
    img.onerror = () => {
      cameraErrorMessage.value = 'File gambar tidak bisa dibaca. Coba gunakan format JPG atau PNG.'
    }
    img.src = e.target?.result as string
  }
  reader.onerror = () => {
    cameraErrorMessage.value = 'Gagal membaca file gambar.'
  }

  reader.readAsDataURL(file)
}

const dataUrlToBlob = (dataUrl: string) => {
  const byteString = atob(dataUrl.split(',')[1])
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  return new Blob([ab], { type: mimeString })
}

const currentDate = computed(() => {
 const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const localDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  return localDateTime
})

const handleSubmit = async () => {
  if (!canvas.value) return
  configStore.overlay = true

  try {
    await activityStore.storeActivityReport(true)
    const blob = dataUrlToBlob(canvas.value.toDataURL('image/jpeg'))
    const file = new File([blob], `${Date.now()}.jpg`, { type: 'image/jpeg' })
    const body = new FormData()
    body.append('assignment_id', modalProps.assignmentId.toString())
    body.append('file', file)
    body.append('lat', location.value?.coords.latitude?.toString() ?? '')
    body.append('lng', location.value?.coords.longitude?.toString() ?? '')
    body.append('accuracy', location.value?.coords.accuracy?.toString() ?? '')

    const result = await activityStore.photoUpload(body)
    if (result) {
      toggleModal()
      await activityStore.fetchActivityReport(modalProps.assignmentId.toString())
      await activityStore.fetchActivityById(modalProps.assignmentId.toString())
      await router.push(`/activity/${modalProps.assignmentId}/report`)
    }
  } catch (err) {
    console.error(err)
  } finally {
    configStore.overlay = false
  }
}

const drawToCanvasWithResize = (
  source: HTMLImageElement | HTMLVideoElement,
  canvas: HTMLCanvasElement
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const originalWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const originalHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight

  const TARGET_WIDTH = 780
  const aspectRatio = originalHeight / originalWidth
  const TARGET_HEIGHT = Math.round(TARGET_WIDTH * aspectRatio)

  canvas.width = TARGET_WIDTH
  canvas.height = TARGET_HEIGHT

  ctx.drawImage(source, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)

  // Optional: Add watermark/location
  const padding = 10
  const lineHeight = 24
  const fontSize = 24
  const lat = location.value?.coords.latitude?.toFixed(6) ?? '-'
  const lng = location.value?.coords.longitude?.toFixed(6) ?? '-'
  const acc = location.value?.coords.accuracy?.toFixed(1) ?? '-'
  const line1 = `Lat: ${lat}, Lng: ${lng} (±${acc}m)`
  const line2 = currentDate.value

  ctx.font = `${fontSize}px Arial`
  ctx.textBaseline = 'top'

  const line1Width = ctx.measureText(line1).width
  const line2Width = ctx.measureText(line2).width
  const boxWidth = Math.max(line1Width, line2Width) + padding * 2
  const boxHeight = lineHeight * 2 + padding * 2
  const boxX = padding
  const boxY = TARGET_HEIGHT - boxHeight - padding

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight)

  ctx.fillStyle = 'white'
  ctx.fillText(line1, boxX + padding, boxY + padding)
  ctx.fillText(line2, boxX + padding, boxY + padding + lineHeight)
}

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

onBeforeUnmount(stopCameraStream)

watch(
  () => modalProps.show,
  async (newVal) => {
    if (newVal === true) {
      isLoading.value = true
      isCameraOpen.value = true
      isCheckingCamera.value = true
      cameraErrorMessage.value = ''
      await nextTick()
      void getLocation().catch(() => {})

      try {
        if (isCameraSupported.value) {
          await createCameraElement()
          if (isCameraAvailable.value) {
            void detectMultipleCameras()
          }
        } else {
          isCameraAvailable.value = false
          cameraErrorMessage.value = 'Camera not accessible'
        }
      } finally {
        isCheckingCamera.value = false
        isLoading.value = false
      }
    } else {
      isLoading.value = false
      isCameraOpen.value = false
      isPhotoTaken.value = false
      isShotPhoto.value = false
      isCameraAvailable.value = false
      isCheckingCamera.value = false
      cameraErrorMessage.value = ''
      stopCameraStream()
    }
  }
)


</script>


<template>
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    @change="handlePhoto"
    hidden
  />

  <VDialog :model-value="modalProps.show" @click:outside="toggleModal" max-width="500">
    <VCard>
      <VCardText>
        <VSkeletonLoader type="image, actions" v-if="isLoading" />
        <div class="web-camera-container" v-show="!isLoading">
          <div v-if="isCameraOpen" class="camera-box" :class="{ flash: isShotPhoto }">
            <div class="camera-shutter" :class="{ flash: isShotPhoto }" />
            <video v-show="!isPhotoTaken && isCameraAvailable" ref="camera" autoplay playsinline muted></video>
            <canvas v-show="isPhotoTaken" ref="canvas" />
          </div>
          <VAlert
            v-if="isCameraOpen && !isCheckingCamera && !isCameraAvailable && !isPhotoTaken"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            {{ cameraErrorMessage || 'Camera is not available, please try to upload an image' }}
          </VAlert>

          <div v-if="isCameraOpen" class="camera-shoot d-flex gap-2">
            <VBtn
              @click="triggerFileInput"
              v-if="!isPhotoTaken && (isMobileDevice || (!isCheckingCamera && !isCameraAvailable))"
              title="Upload Image"
            >
              <VIcon icon="tabler-photo-up" />
            </VBtn>
            <VBtn
              v-if="isCameraAvailable && hasMultipleCameras && !isPhotoTaken"
              icon
              @click="toggleCameraFacing"
              title="Switch Camera"
            >
              <VIcon icon="tabler-refresh" />
            </VBtn>

            <VBtn v-if="isCameraAvailable && !isPhotoTaken" icon :loading="isLoading" @click="takePhoto">
              <VIcon icon="tabler-camera" />
            </VBtn>

            <template v-if="isPhotoTaken">
              <VBtn @click="handleSubmit" color="success">
                <VIcon icon="tabler-device-floppy" /> Save
              </VBtn>
              <VBtn @click="isPhotoTaken = false" color="error">
                <VIcon icon="tabler-trash" /> Remove
              </VBtn>
            </template>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>


<style scoped >
.web-camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.camera-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 1rem;
}

.camera-shutter {
  position: absolute;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 30%);
  block-size: 100%;
  inline-size: 100%;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

video,
canvas {
  border-radius: 6px;
  block-size: auto;
  max-inline-size: 100%;
}
</style>
