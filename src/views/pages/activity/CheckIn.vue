<script setup lang="ts">
import { useActivityStore, useConfigStore } from '@/@core/stores';
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

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
    if (camera.value) camera.value.srcObject = stream
  } catch (error) {
    console.warn('Failed to open camera:', error)
    triggerFileInput()
  } finally {
    configStore.overlay = false
  }
}

const checkCameraSupport = async (): Promise<boolean> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())

    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputs = devices.filter(device => device.kind === 'videoinput')
    hasMultipleCameras.value = videoInputs.length > 1

    return true
  } catch (e) {
    return false
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

const takePhoto = async () => {
  drawToCanvasWithResize(camera.value!, canvas.value!)
  isPhotoTaken.value = true
}

const toggleCameraFacing = async () => {
  selectedFacingMode.value = selectedFacingMode.value === 'user' ? 'environment' : 'user'
  stopCameraStream()
  await createCameraElement()
}

const handlePhoto = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !canvas.value) return

  const reader = new FileReader()
  reader.onload = async e => {
    const img = new Image()
    img.onload = () => {
      if (canvas.value) {
        drawToCanvasWithResize(img, canvas.value)
      }
    }
    img.src = e.target?.result as string
  }

  reader.readAsDataURL(file)
  isPhotoTaken.value = true
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
      await router.push(`/activity/${modalProps.assignmentId}/report/edit`)
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
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support camera access.')
    return
  }

  fileInput.value?.click()
}

onMounted(async () => {
  if (isCameraSupported.value) await checkCameraSupport()
})

onBeforeUnmount(stopCameraStream)

watch(
  () => modalProps.show,
  async (newVal) => {
    if (newVal === true) {
      isCameraOpen.value = true
      await getLocation()

      const cameraSupported = await checkCameraSupport()

      if (!cameraSupported) {
        alert('Your browser does not support camera access.')
        isCameraOpen.value = false
        toggleModal()
        return
      }

      configStore.overlay = true
      await createCameraElement()
      configStore.overlay = false
    } else {
      isCameraOpen.value = false
      isPhotoTaken.value = false
      isShotPhoto.value = false
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
    capture="environment"
    @change="handlePhoto"
    hidden
  />

  <VDialog :model-value="modalProps.show" @click:outside="toggleModal" max-width="680">
    <VCard>
      <VCardText>
        <VSkeletonLoader type="button" v-if="isLoading" />
        <div class="web-camera-container">
          <div v-if="isCameraOpen" class="camera-box" :class="{ flash: isShotPhoto }">
            <div class="camera-shutter" :class="{ flash: isShotPhoto }" />
            <video v-show="!isPhotoTaken" ref="camera" autoplay playsinline></video>
            <canvas v-show="isPhotoTaken" ref="canvas" />
          </div>

          <div v-if="isCameraOpen" class="camera-shoot d-flex gap-2">
            <VBtn @click="triggerFileInput" v-if="!checkCameraSupport() && !isPhotoTaken">
              <VIcon icon="tabler-camera" />
            </VBtn>
            <VBtn
              v-if="hasMultipleCameras && !isPhotoTaken"
              icon
              @click="toggleCameraFacing"
              title="Switch Camera"
            >
              <VIcon icon="tabler-refresh" />
            </VBtn>

            <VBtn v-if="!isPhotoTaken" icon :loading="isLoading" @click="takePhoto">
              <VIcon icon="tabler-camera" />
            </VBtn>

            <template v-else>
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
