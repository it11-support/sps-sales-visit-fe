import { useConfigStore } from "@core/stores/config";

const configStore = useConfigStore()
export const handleUserBinding = async(params: any) => {
  const { type, userId, salesPersonId, callback, onFinish } = params
  configStore.overlay = true;
  try {
    if (type === 'unlink') {
      await $api(`user/unbind`, {
        method: 'POST',
        body: {
          user_id: userId,
        },
      })
    } else {
      await $api(`user/bind`, {
        method: 'POST', 
        body: {
          user_id: userId,
          sales_person_id: salesPersonId,
        },
      })
    }
    await callback?.()
  } catch (error) {
    console.error('[handleUserBinding error]', error)
  } finally {
    await onFinish?.()
    configStore.overlay = false;
  }
}
