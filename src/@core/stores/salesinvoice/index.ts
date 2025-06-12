export interface IItemName {
  ItemCode: string
  Dscription: string
}

export const useSalesInvoiceStore = defineStore('salesinvoice', {
  
  state: () => ({
    loading: false,
    salesInvoicesOptions: [] as IItemName[]
  }),
  actions: {
  
    async fetchSalesInvoiceOptions() {
      this.loading = true
      const url = createUrl(`invoice/get-fitlers`)
      const { data: invoicesData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }
  
      this.salesInvoicesOptions = invoicesData.value.data.itemNames
      .map((sales: any) => ({
        value: sales.ItemCode,
        title: sales.Dscription
      })).filter((item: { value: string; title: string; }, index: number, self: { value: string; title: string; }[]) => 
        index === self.findIndex((t) => t.value === item.value)
      )
      this.loading = false
    }
  }
})
