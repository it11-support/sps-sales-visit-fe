import { ISalesInvoice } from "@/@core/typedefs"

export interface IItemName {
  ItemCode: string
  Dscription: string
}

export const useSalesInvoiceStore = defineStore('salesinvoice', {
  
  state: () => ({
    loading: false,
    salesInvoicesOptions: [] as IItemName[],
    salesInvoices: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      next_page_url: null,
      prev_page_url: null,
      first_page_url: null,
      last_page_url: null,
      path: '',
      links: [],
      data: [] as ISalesInvoice[]
    }, 
    query: {
      id: null,
      invoiceId: null,
      per_page: 10,
      page: 1,
      sort_options: [],
      start_date: null,
      end_date: null
    }
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
    }, 
    async fetchSalesInvoices() {
      this.loading = true
      const { data, error } = await useApi<any>(createUrl(`invoice`, { query: this.query }))
       if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }
      console.log(data)
      this.salesInvoices = data.value.data
      this.loading = false
    },
    updateQuery(query: any) {
      this.query = { ...this.query, ...query }
    }
  }
})
