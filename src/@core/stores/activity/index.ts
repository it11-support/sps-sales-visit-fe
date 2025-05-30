import { IActivity, SortItem } from "@/@core/types"

interface Filters {
  search?: string
  sales_person_id?: number  
  per_page: number
  page: number
  sort_options: SortItem[]
  status?: string
  start_date?: Date | string
  end_date?: Date | string
  activity_type_id?: number,
}

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [] as IActivity[],
    loadingList: false,
    loading: false,
    loadingDetail: false,
    selectedRows: [] as IActivity[],
    salesPersonsOptions: [] as { title: string; value: number }[],
    pagination: {
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
    },
    filters: {
      search: '',
      sales_person_id: undefined,
      per_page: 10,
      page: 1,
      sort_options: [],
      status: undefined,
      start_date: '',
      end_date: '',
      activity_type_id: undefined,
    } as Filters
  }),
  actions: {
    async fetchActivities() {
      this.loadingList = true
      const url = createUrl('activity', { query: this.filters })
      const { data, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching activities:', error.value)
        this.loadingList = false
        return
      }
      this.activities = data.value.data.data
      this.pagination = { ...this.pagination, ...data.value.data }
      this.loadingList = false
    },
    async fetchActivityById(id: string) {
      this.loadingDetail = true
      const { data, error } = await useApi<any>(`activity/${id}`)
      if (error.value) {
        console.error('Error fetching activity detail:', error.value)
        this.loadingDetail = false
        return
      }
      this.loadingDetail = false
    },
     updateFilters(newFilters: Partial<Filters>) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }
      
      this.fetchActivities()      
      console.log(newFilters)
    },
    updateSortOptions(options: any) {
      this.updateFilters({
        sort_options: [options.sortBy]
      })
    },
    setPage(page: number) {
     this.updateFilters({page})
    },
    setPerpage(perpage: number) {
      this.pagination.per_page = perpage
      this.updateFilters({per_page: perpage})
    },
    setSelectedRows(rows: IActivity[]) {
      this.selectedRows = rows
    },
    clearSelectedRows() {
      this.selectedRows = []
    },
    async fetchSalesPersonOptions() {
      this.loading = true
      const url = createUrl(`activity/get-fitlers`)
      const { data: salesPersonsData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }
  
      console.log(salesPersonsData.value.data.salesPersons)
      this.salesPersonsOptions = salesPersonsData.value.data.salesPersons.map((sales: any) => ({
        title: sales.SlpName,
        value: sales.SlpCode
      }))
      this.loading = false
    }
  }
})
