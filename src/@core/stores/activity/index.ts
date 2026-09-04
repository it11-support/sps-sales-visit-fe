import { IActivity, IActivityReport, ICompetitor, ICompetitorOption, ICustomerData, IProduct, IReasonQtyDrop, SortItem } from "@/@core/types"
import dayjs from "dayjs"
import { useStatisticStore } from "../statistic"

type NonActiveItemPayload = {
  id?: unknown
  product_id?: unknown
  ItemCode?: unknown
  ItemName?: unknown
  ItemGroup?: unknown
  last_purchased: unknown
  volume_kg: number
  product?: unknown
}

const normalizeNonActiveItems = (items?: unknown[]): NonActiveItemPayload[] => {
  if (!Array.isArray(items)) return []

  return items.map((item: any) => {
    const product = item?.product ?? {}

    return {
      ...item,
      id: item?.id ?? item?.product_id,
      product_id: item?.product_id ?? item?.id,
      ItemCode: item?.ItemCode ?? product?.ItemCode ?? item?.item_code,
      ItemName: item?.ItemName ?? product?.ItemName ?? item?.description,
      ItemGroup: item?.ItemGroup ?? product?.ItemGroup,
      last_purchased: item?.last_purchased ?? item?.last_transaction_date ?? item?.last_invoice_date ?? null,
      volume_kg: Number(item?.volume_kg ?? item?.last_transaction_volume ?? item?.volume ?? 0),
      product: item?.product,
    }
  })
}

export interface Filters {
  search?: string
  sales_person_id?: number | null
  customer_id?: number | null
  per_page: number
  page: number
  sort_options: SortItem[]
  status?: string | null
  start_date?: Date | string
  end_date?: Date | string
  activity_type_id?: number,
  team_id?: number
  deleted?: boolean
  assigned_to?: number
}


export const useActivityStore = defineStore('activity', {
  state: () => ({
    isReady: false,
    hasActiveVisit: false,
    activeVisit: [] as IActivity[],
    tabs: [] as string[],
    activityTypes: [] as {value: number, label: string}[],
    activity: {} as IActivity,
    report: {} as IActivityReport, 
    loadingId: null as number | null,
    loadingEditableUntilId: null as number | null,
    activities: [] as IActivity[],
    loadingList: false,
    loadingAssignment: false,
    loading: false,
    loadingReport:'',
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
      assigned_to: undefined,
    } as Filters,
    activityReport: {} as IActivityReport,
    activeTab: 'SPS' as string,
    customers: [] as ICustomerData[],
    allCompetitorOptions: [] as ICompetitorOption[],
    competitorOptions: [] as ICompetitorOption[],
  }),
   getters: {
    currentReport(state): IActivityReport {
      if (!state.activityReport) {
        state.activityReport = {
          products: [],
          customer: {} as ICustomerData,
          assignment_id: 0,
          assignment: {} as IActivity,
          reason_qty_drop_ids: [],
          activity_purpose_ids: [],
          missing_items: [],
          sales_growth: [],
          product_issue: '',
          next_action: '',
          additional_note: '',
          competitors: [],
        }
      }

      return state.activityReport
    },
  },

  actions: {
    initReport() {
      if (!this.activityReport) {
        this.activityReport = this.createDefaultReport()
      }
      return this.activityReport
    },
    createDefaultReport(): IActivityReport {
      return  {
        products: [],
        customer: {} as any,
        assignment_id: 0,
        assignment: {} as any,
        reason_qty_drop_ids: [],
        activity_purpose_ids: [],
        missing_items: [],
        sales_growth: [],
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
        reason_qty_drop_ids: [],
        activity_purpose_ids: [],
        missing_items: [],
        sales_growth: [],
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
    async deleteActivity(id: number, force: boolean = false) {
      this.loadingList = true
      const { data, error } = await useApi<any>(`activity/${id}`, {
        method: 'POST',
        body: JSON.stringify({ force: force ? 1 : 0 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (error.value) {
        console.error('Error deleting activity:', error.value)
        this.loadingList = false
        return
      }
      this.fetchActivities()
    },
    async restoreActivity(id: number) {
      this.loadingList = true
      const { data, error } = await useApi<any>(`activity/${id}/restore`, {
        method: 'POST',
      })
      if (error.value) {
        console.error('Error restoring activity:', error.value)
        this.loadingList = false
        return
      }
      this.fetchActivities()
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
      this.currentReport.assignment = this.activity
      this.tabs = this.activity.customers.map((customer: any) => (
        customer.CompanyId
      ))

      const report = data.value.data.assignment_details?.[0]



      let reports = {} as IActivityReport

      if (report) {
        this.activityReport = {
          assignment_id: report.assignment_id,
          assignment: this.activity,
          customer: report.customer,
          products: report.products ?? [],
          reason_qty_drop_ids: report.reason_qty_drops?.map((drop: any) => drop.id),
          activity_purpose_ids: report.activity_purposes?.map((purpose: any) => purpose.id),
          reason_qty_drops: report.reason_qty_drops,
          missing_items: JSON.parse(JSON.stringify(report.non_active_items ?? [])),
          activity_purposes: report.activity_purposes,
          sales_growth: report.assignment_detail_sales,
          product_issue: report.product_issue,
          next_action: report.next_action,
          additional_note: report.additional_note,
          competitors: report.competitors ?? []
        }
      }

      await nextTick()      
      this.loadingAssignment = false
    },
    async exportReport(id: string, customerName?: string, date?: string) {

      const reportDate = dayjs(date).format('YYYY-MM-DD')
      this.loadingReport = `loading${id}`

      try {
        const fileName =  `Sales Visit Report - ${customerName || 'Customer'} - ${reportDate}`
        await downloadApi(
          `activity/${id}/export`,
          `${fileName}.xlsx`,
        )
      }
      catch (error) {
        console.error(error)
      }
      finally {
        this.loadingReport = ''
      }
    },
    async fetchActivityReport(id: string) {
      this.loadingAssignment = true;
      const { data, error } = await useApi<any>(`activity/${id}/report`);
      if (error.value) {
        console.error(error.value);
        this.loadingAssignment = false;
        return;
      }

      const payload = data.value.data ?? this.emptyActivityReport()

      let reports = { ...payload } as IActivityReport

      if (data.value.data.assignment_details?.length) {
        const report = data.value.data.assignment_details[0]

        reports = {
          ...reports,
          assignment_id: report.assignment_id,
          assignment: this.activity,
          customer: report.customer,
          products: report.products ?? [],
          reason_qty_drop_ids: report.reason_qty_drops?.map((drop: any) => drop.id),
          activity_purpose_ids: report.activity_purposes?.map((purpose: any) => purpose.id) ?? [],
          missing_items: JSON.parse(JSON.stringify(report.non_active_items ?? [])),
          sales_growth: report.assignment_detail_sales,
          reason_qty_drops: report.reason_qty_drops,
          activity_purposes: report.activity_purposes,
          group_growth: report.grouped_growth,
          product_issue: report.product_issue,
          next_action: report.next_action,
          additional_note: report.additional_note,
          competitors: report.competitors ?? [],
          image_path: data.value.data.image_path,
          accuracy: data.value.data.accuracy,
          check_in: data.value.data.check_in,
          check_out: data.value.data.check_out,
          editable_until: data.value.data.editable_until,
          editable: data.value.data.editable,
          lat: data.value.data.lat,
          lng: data.value.data.lng,
        }
      }

      this.report = { ...reports }
      this.activityReport = reports
      this.tabs = data.value.data.customers.map((customer: any) => (
        customer.CompanyId
      ))
      this.customers = data.value.data.customers

      this.loadingAssignment = false;
    },
    async updateActivityStatus(id: number, status: string, isEdit: boolean = false) {
      this.loadingId = id
      await $api(`/activity/status/update/${id}`, {
        method: 'PUT',
        body: JSON.parse(JSON.stringify({
          status,
          isEdit: isEdit
        })),
      })
      this.fetchActivityById(id.toString())
      this.loadingId = null
    },
    async updateActivity(data: any) {
      this.loadingId = data.id
      const payloads = {
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        customers: data.customers,
        activity_type_id: data.activity_type_id
      }
      await $api(`/activity/${data.id}`, {
        method: 'PUT',
        body: JSON.parse(JSON.stringify(payloads)),
      })
      this.fetchActivities()
      this.loadingId = null
    },
    async checkOut(id: number) {
      this.loadingId = id
      const { error } = await useApi<any>(`/activity/check-out/${id}`, {
        method: 'PUT',
      })
      if (error.value) {
        this.loadingId = null
        throw new Error(error.value?.message ?? 'Failed to check out')
      }
      this.loadingId = null
      this.fetchActivityById(id.toString())
    },
    async updateEditableUntil(id: number, editableUntil: string | null): Promise<boolean> {
      this.loadingEditableUntilId = id
      const payload = JSON.stringify({        
        editable_until: editableUntil,
      })

      try {
        const { error } = await useApi<any>(`activity/${id}/editable-until`, {
          method: 'PUT',
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (error.value) {
          console.error('Error updating editable_until:', error.value)
          this.loadingEditableUntilId = null
          return false
        }

        await this.fetchActivities()
        this.loadingEditableUntilId = null
        return true
      } catch (error) {
        console.error('Unexpected error updating editable_until:', error)
        this.loadingEditableUntilId = null
        return false
      }
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

      this.allCompetitorOptions = Array.from(uniqueCompetitors.values()).map(
        (competitor): ICompetitorOption => ({
          value: competitor.id,
          title: competitor.name,
          name: `${competitor.name} - ${competitor.address}`,
          address: competitor.address,
          product: competitor.product,
          price: competitor.price,
          qty: competitor.qty,
        })
      );


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
      const statStore = useStatisticStore()

       const growth: Record<string, Record<string, any>> = {};
       for (const [company, periods] of Object.entries(statStore.monthly_sales ?? {})) {
        growth[company] = {};
        growth[company].growth = periods.growth ?? null;
        for (const [period, data] of Object.entries(periods)) {
          if(period === 'growth' || period === 'missing_items') continue
          const { invoices, ...rest } = data as any;
          growth[company][period] = rest;
        }
      }

      const reportPayload = {
        ...this.activityReport,
        assignment_id: this.activityReport.assignment_id ?? 0,
        activity_purpose_ids: this.activityReport.activity_purpose_ids ?? [],
        status: isDraft ? 'draft' : 'completed',
        growth,
        nonActive: normalizeNonActiveItems(this.activityReport.nonActive ?? this.activityReport.missing_items),
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
        console.error('storeActivityReport error.value:', error.value)
        console.error('storeActivityReport error type:', typeof error.value)
        this.loading = false
        let errorMessage = 'Failed to save report'
        if (typeof error.value === 'string') {
          errorMessage = error.value
        } else if (error.value?.message) {
          errorMessage = error.value.message
        } else if (error.value?.data?.message) {
          errorMessage = error.value.data.message
        } else if (error.value?.statusText) {
          errorMessage = error.value.statusText
        }
        throw new Error(errorMessage)
      }
      if(!isDraft && data.value?.status === 'success') {
        removeLocalItem(this.activityReport.assignment_id)
      }
      this.loading = false
    },
    async updateReport(id: number, final: boolean = false) {
      this.loading = true
      const reportPayload = {
        ...this.activityReport,
        nonActive: normalizeNonActiveItems(this.activityReport.nonActive ?? this.activityReport.missing_items),
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
        this.loading = false
        throw new Error(error.value?.message ?? error.value?.data?.message ?? 'Failed to update report')
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
      this.activityReport = this.emptyActivityReport()
      this.report = this.emptyActivityReport()
    },
    async updateFilters(newFilters: Partial<Filters>, shouldFetch = true) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }

      // if (newFilters.sales_person_id) {
      //   const filterCustomerOptions = this.customers
      //     .filter((customer: any) =>
      //       Number(customer.sales_person_id) === Number(newFilters.sales_person_id)
      //     )
      //     .map((customer: any) => ({
      //       value: customer.id,
      //       title: customer.CardName,
      //       sales_person_id: Number(customer.sales_person_id)
      //     }));

      //   this.customerOptions = filterCustomerOptions;
      // } else {
      //   this.customerOptions = this.customers.map((customer: any) => ({
      //     value: customer.id,
      //     title: customer.CardName,
      //     sales_person_id: Number(customer.sales_person_id)
      //   }));
      // }

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
      if (!this.activityReport) {
        this.activityReport = this.createDefaultReport()
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
    async fetchSalesPersonOptions(teamId?: number) {
      this.loading = true
      const url = createUrl(`activity/get-filters`, {
        query: {
          team_id: teamId,
        },
      })
      const { data: salesPersonsData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }

      const salesPersons = teamId
        ? salesPersonsData.value.data.salesPersons.filter((item: any) => {
          const users = Array.isArray(item.user) ? item.user : item.user ? [item.user] : []

          return users.some((user: any) => Number(user.team_id) === Number(teamId))
        })
        : salesPersonsData.value.data.salesPersons

      const distinctSalesPersons = Object.values(
        salesPersons.reduce((acc: any, item: any) => {
          acc[item.SlpName] = item;
          return acc;
        }, {})
      )

      this.salesPersonsOptions = distinctSalesPersons.map((sales: any) => ({
        title: `${sales.SlpName}`,
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
        sales_person_id: customer.sales_person.id
      }))

      this.loading = false
    },
    
    updateForm(form: Partial<IActivityReport>) {
      const current = this.currentReport
      this.activityReport = {
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

       const option: ICompetitorOption = {
         value: competitor.id,
         title: competitor.name,
         name: competitor.name,
         address: competitor.address,
         product: competitor.product,
         price: competitor.price,
         qty: competitor.qty
       }

       if (!this.allCompetitorOptions.some(opt => opt.name === competitor.name)) {
         this.allCompetitorOptions.push(option)
       }
     },
    async checkActiveVisit(itemId: number) {
      
      this.loadingId = itemId
      const url = createUrl(`activity/check-active-visit`)
      
      const { data, error } = await useApi<any>(url)
      
      if (error.value) {
        console.error('Error fetching active visit:', error.value)
        return
      }

      this.hasActiveVisit = data.value.data.has_active_visit
      this.activeVisit = data.value.data.active_visit
      this.loadingId = null
    }

  }
})
