import { cookieRef, useLayoutConfigStore } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'
import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'

// SECTION Store
export const useConfigStore = defineStore('config', () => {

  const overlay = cookieRef('overlay', false)
  const loading = cookieRef('loading', false)
  const toggleLoading = () => {
    loading.value = !loading.value
  }

  const toggleOverlay = () => {
    overlay.value = !overlay.value
  }



  const salesPersonId = () => {
    const userData = useCookie('userData') as { value: { sales_person: { SlpCode: number } } };
    return userData?.value?.sales_person?.SlpCode
  }
  
  // 👉 Theme
  const userPreferredColorScheme = usePreferredColorScheme()
  const cookieColorScheme = cookieRef<'light' | 'dark'>('color-scheme', 'light')

  watch(
    userPreferredColorScheme,
    val => {
      if (val !== 'no-preference')
        cookieColorScheme.value = val
    },
    { immediate: true },
  )

  const theme = cookieRef('theme', themeConfig.app.theme)

  // 👉 isVerticalNavSemiDark
  const isVerticalNavSemiDark = cookieRef('isVerticalNavSemiDark', themeConfig.verticalNav.isVerticalNavSemiDark)

  // 👉 isVerticalNavSemiDark
  const skin = cookieRef('skin', themeConfig.app.skin)

  // ℹ️ We need to use `storeToRefs` to forward the state
  const {
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
  } = storeToRefs(useLayoutConfigStore())

  return {
    theme,
    isVerticalNavSemiDark,
    skin,

    // @layouts exports
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
    overlay,
    toggleOverlay,
    loading,
    toggleLoading,
    salesPersonId,
  }
})
// !SECTION

// SECTION Init
export const initConfigStore = () => {
  const userPreferredColorScheme = usePreferredColorScheme()
  const vuetifyTheme = useTheme()
  const configStore = useConfigStore()

  watch(
    [() => configStore.theme, userPreferredColorScheme],
    () => {
      vuetifyTheme.global.name.value = configStore.theme === 'system'
        ? userPreferredColorScheme.value === 'dark'
          ? 'dark'
          : 'light'
        : configStore.theme
    })

  onMounted(() => {
    if (configStore.theme === 'system')
      vuetifyTheme.global.name.value = userPreferredColorScheme.value
  })
}
// !SECTION
