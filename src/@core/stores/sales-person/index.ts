import { ISalesPerson } from "@/@core/typedefs";

export const useSalesPersonStore = defineStore('salesPersonStore', {
  state: () => ({
    loading: false,
    salesPersons: [] as ISalesPerson[],
    query: {
      per_page: -1,
      page: 1
    },
    salesPersonOptions: [] as { label: string, value: number }[]
  }),
  actions:{
    async fetchSalesPersons() {
      const { data } = await useApi<any>(createUrl('sales',{ query: this.query }))
      this.salesPersons = data.value.data.data
    },
    async updateSalesPersonOptions() {
      await this.fetchSalesPersons()
      this.salesPersonOptions = this.salesPersons
        .filter((sales: ISalesPerson) => sales.user == null)
        .filter((sales: ISalesPerson) => sales.user?.role?.role !== 'admin')
        .map((sales: ISalesPerson) => ({
          label: sales.SlpName,
          value: sales.SlpCode
        }))
    }
  }
})
