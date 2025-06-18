import { ISalesSummary } from "@/@core/typedefs";

export const useSalesSummaryStore = defineStore('salesSummary', {
  state: () => ({
    summary:  {
      mom: [] as Partial<ISalesSummary>[],
      yoy: [] as Partial<ISalesSummary>[]
    },
    loading: false
  }),
  actions: {
    async fetchSalesSummary() {
      this.loading = true
      try {
        const url = createUrl(`sales/summary`)
        const response = await useApi<any>(url)
        this.summary = response.data.value.data
      } catch (error) {
        if (error) {
          console.error('Error fetching sales summary:', error)
          this.loading = false
          return
        }
      }
      this.loading = false
    }
  }
})
