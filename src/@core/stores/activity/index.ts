import { IActivity, IActivityReport, ICompetitor, ICustomerData, IProduct, IReasonQtyDrop, SortItem } from "@/@core/types"

interface Filters {
  search?: string
  sales_person_id?: number
  customer_id?: number
  per_page: number
  page: number
  sort_options: SortItem[]
  status?: string
  start_date?: Date | string
  end_date?: Date | string
  activity_type_id?: number,
  team_id?: number
}


export const useActivityStore = defineStore('activity', {
  state: () => ({
    isReady: false,
    tabs: [] as string[],
    activityTypes: [] as {value: number, label: string}[],
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
    customerOptions: [] as { title: string; value: number, sales_person_id?: number }[],
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
      customer_id: undefined,
      per_page: 10,
      page: 1,
      sort_options: [],
      status: undefined,
      start_date: '',
      end_date: '',
      team_id: undefined,
      activity_type_id: undefined,
    } as Filters,
    activityReport: {} as Record<string, IActivityReport>,
    activeTab: 'SPS' as string,
    customers: [] as ICustomerData[],
    allCompetitorOptions: ref<Record<string, ICompetitor[]>>({}) 
  }),
   getters: {
    currentReport(state): IActivityReport {
      if (!state.activityReport[state.activeTab]) {
        state.activityReport[state.activeTab] = {
          products: [],
          customer: {} as any,
          assignment_id: 0,
          assignment: {} as any,
          reason_qty_drop_id: undefined,
          activity_purpose_id: undefined,
          non_active_product: '',
          product_issue: '',
          next_action: '',
          additional_note: '',
          competitors: [],
        }
      }
      return state.activityReport[state.activeTab]
    },
  },
  actions: {
    initReport(tab: string) {
      if (!this.activityReport[tab]) {
        this.activityReport[tab] = this.createDefaultReport()
      }
      return this.activityReport[tab]
    },
    createDefaultReport(): IActivityReport {
      return  {
        products: [],
        customer: {} as any,
        assignment_id: 0,
        assignment: {} as any,
        reason_qty_drop_id: undefined,
        activity_purpose_id: undefined,
        non_active_product: '',
        product_issue: '',
        next_action: '',
        additional_note: '',
        competitors: [],
      }
    },
    emptyActivityReport(): IActivityReport {
      return {
        products: [] as IProduct[],
        customer: {} as ICustomerData,
        assignment_id: 0,
        assignment: {} as IActivity,
        reason_qty_drop_id: undefined,
        activity_purpose_id: undefined,
        non_active_product: '',
        product_issue: '',
        next_action: '',
        additional_note: '',
        competitors: [] as ICompetitor[],        
      }
    },
    async fetchActivityTypes() {      
      const { data, error } = await useApi<any>(createUrl('activity/activity-types'), {})
      if (error.value) {
        console.error('Error fetching activity types:', error.value)
        return
      }
      this.activityTypes = data.value.data.map((type: any) => ({
        value: type.id,
        title: type.name
      }))
    },
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
      this.customers = this.activity.customers
      this.tabs = this.activity.customers.map((customer: any) => (
        customer.CompanyId
      ))

      const reports: Record<string, IActivityReport> = {}
      
      data.value.data.assignment_details?.forEach((report: any) => {
        const companyId = report.CompanyId       
      })

      data.value.data.assignment_details?.forEach((report: any) => {
        const companyId = report.CompanyId
        return reports[companyId] = {
          assignment_id: report.assignment_id,
          assignment: this.activity,
          customer: report.customer,
          products: report.products ?? [],
          reason_qty_drop_id: report.reason_qty_drop_id,
          activity_purpose_id: report.activity_purpose_id,
          reason_qty_drop: report.reason_qty_drop,
          activity_purpose: report.activity_purpose,
          non_active_product: report.non_active_product,
          product_issue: report.product_issue,
          next_action: report.next_action,
          additional_note: report.additional_note,
          competitors: report.competitors ?? []
        }
      })

      this.activityReport = reports
      await nextTick()      
      this.loadingAssignment = false
    },

    async fetchActivityReport(id: string) {
      this.loadingAssignment = true;
      const { data, error } = await useApi<any>(`activity/${id}/report`);
      if (error.value) {
        console.error(error.value);
        this.loadingAssignment = false;
        return;
      }

      const payload = data.value.data ?? this.emptyActivityReport();

      const reports: Record<string, IActivityReport> = {}

      this.report = { ...payload };
      this.activityReport = { ...payload };
      this.tabs = data.value.data.customers.map((customer: any) => (
        customer.CompanyId
      ))

      data.value.data.assignment_details?.forEach((report: any) => {
        const companyId = report.CompanyId
        return reports[companyId] = {
          assignment_id: report.assignment_id,
          assignment: this.activity,
          customer: report.customer,
          products: report.products ?? [],
          reason_qty_drop_id: report.reason_qty_drop_id,
          activity_purpose_id: report.activity_purpose_id,
          reason_qty_drop: report.reason_qty_drop,
          activity_purpose: report.activity_purpose,
          non_active_product: report.non_active_product,
          product_issue: report.product_issue,
          next_action: report.next_action,
          additional_note: report.additional_note,
          competitors: report.competitors ?? []
        }
      })

      this.activityReport = reports
      this.customers = data.value.data.customers

      this.loadingAssignment = false;
    },
    async updateActivityStatus(id: number, status: string) {
      this.loadingId = id
      await $api(`/activity/status/update/${id}`, {
        method: 'PUT',
        body: JSON.parse(JSON.stringify({
          status
        })),
      })
      this.fetchActivityById(id.toString())
      this.loadingId = null
    },
    async checkOut(id: number) {
      this.loadingId = id
      await $api(`/activity/check-out/${id}`, {
        method: 'PUT',
      })
      this.loadingId = null
      this.fetchActivityById(id.toString())
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

      this.allCompetitorOptions[this.activeTab] = Array.from(uniqueCompetitors.values()).map((competitor: ICompetitor) => ({
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
        reports: this.activityReport,
        status: isDraft ? 'draft' : 'completed'
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
    async updateReport(id: number, final: boolean = false) {
      this.loading = true
      const reportPayload = {
        ...this.activityReport,
        status: final ? 'completed' : 'draft',
      }
      const payload = JSON.stringify(reportPayload);
      const { data, error } = await useApi<any>(`activity/report/${id}`, {
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if(final) {
        await this.clearActivityReport()
      }

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
    async clearActivityReport() {
      const tab = this.activeTab
      this.activityReport[tab] = this.emptyActivityReport()
      this.report = this.emptyActivityReport()
    },
    async updateFilters(newFilters: Partial<Filters>, shouldFetch = true) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }

      if (newFilters.sales_person_id) {
        const filterCustomerOptions = this.customers
          .filter((customer: any) =>
            Number(customer.id) === Number(newFilters.sales_person_id)
          )
          .map((customer: any) => ({
            value: customer.id,
            title: customer.CardName,
            sales_person_id: Number(customer.id)
          }));

        this.customerOptions = filterCustomerOptions;
      } else {
        this.customerOptions = this.customers.map((customer: any) => ({
          value: customer.id,
          title: customer.CardName,
          sales_person_id: Number(customer.sales_person_id)
        }));
      }

      if (shouldFetch) {
        await this.fetchActivities();
      }
    },
    async initialize(salesPersonId?: number, teamId?: number) {
      if(salesPersonId) {
        await this.updateFilters({ sales_person_id: salesPersonId }, false)
      }      
      if(teamId) {
        await this.updateFilters({ team_id: teamId }, false)
      }
      await this.fetchActivities()
      await this.fetchCustomer()
      this.isReady = true
    },
    setActiveTab(tab: string) {
      this.activeTab = tab
      if (!this.activityReport[tab]) {
        this.activityReport[tab] = this.createDefaultReport()
      }
    },
    updateSortOptions(options: any) {
      if (!this.isReady) return
      this.updateFilters({
        sort_options: options.sortBy
      }, true)
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
      const url = createUrl(`activity/get-filters`)
      const { data: salesPersonsData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }

      this.salesPersonsOptions = salesPersonsData.value.data.salesPersons.map((sales: any) => ({
        title: `${sales.SlpName} (${sales.CompanyId})`,
        value: sales.id
      }))
      this.loading = false
    },
    async fetchCustomer() {
      this.loading = true
      const url = createUrl(`activity/get-customers`)
      const { data: customerData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }


      this.customers = customerData.value.data
      
      this.customerOptions = this.customers.map((customer: any) => ({
        title: customer.CardName,
        value: customer.id,
        sales_person_id: customer.id
      }))

      this.loading = false
    },
    
    updateForm(form: Partial<IActivityReport>) {
      const current = this.currentReport

      this.activityReport[this.activeTab] = {
        ...current,
        ...form,
        products: form.products
          ? form.products.map(p => ({ ...p }))
          : current.products,
        competitors: form.competitors
          ? form.competitors.map(c => ({ ...c }))
          : current.competitors,
      }
    },
    addCompetitor(competitor: ICompetitor) {
      const report = this.currentReport

      if (!report.competitors.some(c => c.name === competitor.name)) {
        report.competitors.push(competitor)
      }

      if (!this.allCompetitorOptions[this.activeTab].some(opt => opt.name === competitor.name)) {
        this.allCompetitorOptions[this.activeTab].push(competitor)
      }
    }
  }
})
