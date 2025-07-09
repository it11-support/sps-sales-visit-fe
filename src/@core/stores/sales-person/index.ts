import { ISalesPerson } from "@/@core/typedefs";

export const useSalesPersonStore = defineStore('salesPersonStore', {
  state: () => ({
    loading: false,
    salesPersons: [] as ISalesPerson[],
    query: {
      per_page: -1,
      page: 1
    },
    salesPersonOptions: [] as { title: string, value: number, user: any }[],
    filteredSalesPersonOptions: [] as { title: string, value: number }[],
    teamOptions: [] as { title: string, value: number }[]
  }),
  actions:{
    async fetchTeamOptions() {      
      const { data } = await useApi<any>(createUrl('team'))
      this.teamOptions = data.value.data.map((team: any) => ({
        title: team.name,
        value: team.id
      }))      
    },
    async fetchSalesPersons() {
      this.loading = true
      const { data } = await useApi<any>(createUrl('sales',{ query: this.query }))
      this.salesPersons = data.value.data.data
      this.salesPersonOptions = data.value.data.data.map((sales: ISalesPerson) => ({
        title: sales.SlpName,
        value: sales.SlpCode,
        user: sales.user ?? null
      }))

      this.loading = false
    },
    async updateQuery(query: any) {
      this.query = { ...this.query, ...query }     
    },
    async updateSalesPersonOptions() {
      await this.fetchSalesPersons()
      this.filteredSalesPersonOptions = this.salesPersons
        .filter((sales: ISalesPerson) => sales.user == null)
        .filter((sales: ISalesPerson) => sales.user?.role?.role !== 'admin')
        .map((sales: ISalesPerson) => ({
          title: sales.SlpName,
          value: sales.SlpCode
        }))
    }
  }
})
