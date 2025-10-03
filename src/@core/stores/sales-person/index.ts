import { ISalesPerson, IUser } from "@/@core/typedefs";

export const useSalesPersonStore = defineStore('salesPersonStore', {
  state: () => ({
    loading: false,
    salesPersons: [] as ISalesPerson[],
    query: {
      per_page: -1,
      page: 1
    },
    spsSalesPersons: [] as { title: string, value: string, user: any, type: string }[],
    bbsSalesPersons: [] as { title: string, value: string, user: any, type: string }[],
    salesPersonOptions: [] as { title: string, value: string, user: IUser[], type: string }[],
    filteredSalesPersonOptions: [] as { title: string, value: string, user: any, type: string }[],
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
      const allOptions = this.salesPersons.map((sales: ISalesPerson) => ({
        title: sales.SlpName,
        value: sales.id,
        user: sales.user ?? [],
        type: sales.CompanyId // SPS / BBS
      }))

      this.spsSalesPersons = allOptions.filter(opt => opt.type === COMPANIES.SPS)
      this.bbsSalesPersons = allOptions.filter(opt => opt.type === COMPANIES.BBS)
      this.salesPersonOptions = allOptions
      this.loading = false
    },
    async updateQuery(query: any) {
      this.query = { ...this.query, ...query }     
    },
    async updateSalesPersonOptions() {
      await this.fetchSalesPersons()

      // Filter sales yang user array kosong atau tidak punya admin
      const filtered = this.salesPersons
        .filter((sales: ISalesPerson) => !sales.user || sales.user.length === 0 || !sales.user.some(u => u.role?.role === 'admin'))

      // Buat options dengan tipe CompanyId
      const options = filtered.map((sales: ISalesPerson) => ({
        title: sales.SlpName,
        value: sales.id,
        user: sales.user ?? [],
        type: sales.CompanyId
      }))

      
      this.spsSalesPersons = options.filter(opt => opt.type === COMPANIES.SPS)
      this.bbsSalesPersons = options.filter(opt => opt.type === COMPANIES.BBS)

      this.filteredSalesPersonOptions = options
    }
  }
})
