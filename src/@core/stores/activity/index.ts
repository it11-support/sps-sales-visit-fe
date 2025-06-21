import { IActivity, IActivityReport, ICompetitor, ICustomerData, IProduct, IReasonQtyDrop, SortItem } from "@/@core/types"

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
    activity: {} as IActivity,
    report: {} as IActivityReport,
    loadingId: null as number | null,
    activities: [] as IActivity[],
    loadingList: false,
    loadingAssignment: false,
    loading: false,
    loadingDetail: false,
    selectedRows: [] as IActivity[],
    salesPersonsOptions: [] as { title: string; value: number }[],
    reasonQtyDropOptions: [] as { title: string; value: number }[],
    activityPuposesOptions: [] as { title: string; value: number }[],
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
    } as Filters,
    activityReport: {
      products: [] as IProduct[],
      customer: {} as ICustomerData,
      assignment_id: 0,
      assignment: {} as IActivity,
      reason_qty_drop_id: 0,
      activity_purpose_id: 0,
      non_active_product: '',
      product_issue: '',
      next_action: '',
      additional_note: '',
      competitors: [] as ICompetitor[],
      reason: undefined,
      purpose: undefined
    } as IActivityReport,
    allCompetitorOptions: ref<ICompetitor[]>([])
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
      this.loadingAssignment = true
      const { data, error } = await useApi<any>(`activity/${id}`)
      if (error.value) {
        console.error('Error fetching activity detail:', error.value)
        this.loadingAssignment = false
        return
      }
      this.activity = data.value.data
      this.loadingAssignment = false
    },

    async fetchActivityReport(id: string) {
      this.loadingAssignment = true
      const { data, error } = await useApi<any>(`activity/${id}/report`)
      if (error.value) {
        console.error('Error fetching activity detail:', error.value)
        this.loadingAssignment = false
        return
      }
      this.report = data.value.data
      this.activityReport = data.value.data

      console.log(this.report.products)
      this.loadingAssignment = false
    },
    async updateActivityStatus(id: number, status: string) {
      this.loadingId = id
      await $api(`/activity/status/update/${id}`, {
        method: 'PUT',
        body: JSON.parse(JSON.stringify({
          status
        })),
      })
      this.loadingId = null
      this.fetchActivities()
    },
    async fetchAllOptions() {
      this.loading = true
      const url = createUrl(`activity/get-options`)
      const { data: competitorsData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }
  
      const uniqueCompetitors = new Map<string, ICompetitor>();
      competitorsData.value.data.competitors.forEach((competitor: ICompetitor) => {
        const key = `${competitor.name}-${competitor.address}`;
        if (!uniqueCompetitors.has(key)) {
          uniqueCompetitors.set(key, competitor);
        }
      });

      this.allCompetitorOptions = Array.from(uniqueCompetitors.values()).map((competitor: ICompetitor) => ({
        value: competitor.id,
        title: `${competitor.name}`,
        name: `${competitor.name} - ${competitor.address}`,
        address: competitor.address,
        product: competitor.product,
        price: competitor.price,
        qty: competitor.qty
      }));

      this.reasonQtyDropOptions = competitorsData.value.data.reasonQtyDrops.map((reason: IReasonQtyDrop) => ({
        value: reason.id,
        title: `${reason.reason}`
      }))

      this.activityPuposesOptions = competitorsData.value.data.purposes.map((activityPupose: any) => ({
        value: activityPupose.id,
        title: `${activityPupose.purpose}`
      }))
      this.loading = false
    },
    async storeActivityReport(isDraft = false) {
      this.loading = true
      
      const reportPayload = {
        ...this.activityReport,
        status: isDraft ? 'draft' : 'submitted'
      }

      const payload = JSON.stringify(reportPayload);

      const { data, error } = await useApi<any>(`activity/report`, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (error.value) {
        console.error('Error fetching activity detail:', error.value)
        this.loading = false
        return
      }
      this.loading = false
    },
    async updateReport(id: number) {
      this.loading = true
      const payload = JSON.stringify(this.activityReport);
      const { data, error } = await useApi<any>(`activity/report/${id}`, {
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (error.value) {
        console.error('Error fetching activity detail:', error.value)
        this.loading = false
        return
      }
      this.loading = false
    },
    async photoUpload(formData: FormData): Promise<boolean> {
      try {
        const { data, error } = await useApi<any>('activity/photoUpload', {
          method: 'POST',
          body: formData,
        });
        if (error.value) {
          console.error('Check-in error:', error.value);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Unexpected error:', err);
        return false;
      }
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
    },
    
    updateForm(form: Partial<IActivityReport>) {
      console.log(form)
      this.activityReport = {
        ...this.activityReport,
        ...form
      }

      console.log(this.activityReport)
    }, 
    addCompetitor(competitor: ICompetitor) {
      this.activityReport.competitors?.push(competitor)
      if (!this.allCompetitorOptions.some(opt => opt.name === competitor.name)) {
        this.allCompetitorOptions.push(competitor)
      }
    }
  }
})
