import { ISalesSummary } from "@/@core/typedefs";

export const useSalesSummaryStore = defineStore('salesSummary', {
  state: () => ({
    monthList: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].map((label, index) => ({
      label,
      value: index + 1
    })),
    month: { value: new Date().getMonth() + 1, label: new Date().toLocaleString('default', { month: 'long' }) },
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
        const url = createUrl(`sales/summary`, {query: {month: this.month.value}})
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
    },
    setMonth(month: number) {
      this.month = {
        value: month,
        label: this.monthList[month - 1].label
      }

      console.log(this.month)
    }    
  }
})
