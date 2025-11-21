import { ICustomerData } from '@/@core/typedefs'
import { SortItem } from '@/@core/types'
import { defineStore } from 'pinia'

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Filters {
  search?: string
  status?: string
  sales_person_id: number[]
  team_id?: number
  group_name?: string | null
  payment_term?: string | null
  price_list?: string
  city?: string | null
  per_page: number
  page: number
  sort_options: SortItem[]
  hideZeroInvoice: boolean
  dormantMonth?: number,
  companyIds: string[]
}

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    isReady: false,
    customers: [] as ICustomerData[],
    customerDetail: {} as ICustomerData,
    customer: {} as ICustomerData,
    meta: {} as Meta,
    loadingList: false,
    loadingDetail: false,
    groupFilters: {} as any,
    groupNameOptions: [] as { value: string; title: string }[],
    paymentTermOptions: [] as { value: string; title: string }[],
    priceListOptions: [] as { value: string; title: string }[],
    cityOptions: [] as { value: string; title: string }[],
    selectedRows: [] as ICustomerData[],
    customerOptions: [] as { value: number; title: string, companyId: string }[],
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
      status: undefined,
      sales_person_id: [],
      group_name: undefined,
      payment_term: undefined,
      price_list: undefined,
      city: undefined,
      per_page: 10,
      page: 1,
      sort_options: [],
      hideZeroInvoice: false,
      dormantMonth: undefined,
      companyIds: [COMPANIES.SPS]
    } as Filters,
  }),

  actions: {

    async fetchCustomerOptions(companyId: string | null = null, salesPersonId: string | null = null) {
     try {
      this.loadingList = true
      const url = createUrl(`customer/get-options`, {query: { companyId, salesPersonId }})
      const { data } = await useApi<any>(url)

      this.customerOptions = data.value.data.map((company: any) => ({
        value: company.id,
        title: `${company.CardName} (${company.CardCode})` || company.CardName,
        companyId: company.CompanyId
      }))


     } catch (error) {
       console.error('Error fetching customer options:', error)
       this.loadingList = false
       return
     } finally {
      this.loadingList = false
     }
    },

    async fetchCustomers() {
      this.loadingList = true
     
      const url = createUrl('customer', { query: this.filters })
      const { data, error } = await useApi<any>(url)

      if (error.value) {
        console.error('Error fetching customers:', error.value)
        this.loadingList = false
        return
      }

      this.customers = data.value.data.data
      this.pagination = { ...this.pagination, ...data.value.data }
      this.loadingList = false

    },

    async fetchCustomerById(id: string) {
      this.loadingDetail = true
      const { data, error } = await useApi<any>(`customer/${id}`)

      if (error.value) {
        console.error('Error fetching customer detail:', error.value)
        this.loadingDetail = false
        return
      }

      this.customerDetail = data.value.data
      this.customer = data.value.data
      this.loadingDetail = false
    },
    async fetchFilters() {
      this.loadingList = true
      const { data, error } = await useApi<any>(createUrl('customer/get-fitlers'))
      if (error.value) {
        console.error('Error fetching filters:', error.value)
        this.loadingList = false
        return
      }
      this.groupFilters = data.value.data
      this.groupNameOptions = data.value.data.groupName.map((group: any) => ({
        title: group.GroupName,
        value: group.GroupName
      }))
      this.paymentTermOptions = data.value.data.paymentTerm.map((term: any) => ({
        title: term.PaymentTerm,
        value: term.PaymentTerm
      }))
      this.priceListOptions = data.value.data.priceList.map((list: any) => ({
        title: list.PriceList,
        value: list.PriceList
      }))
      this.cityOptions = data.value.data.cities
      .filter((city: any) => city.City !== null)
      .map((city: any) => ({
        title: city.City,
        value: city.City
      }))
      this.loadingList = false
    },
     async initialize(salesPersonIds?: number[], teamId?: number) {

      if(salesPersonIds) {
        await this.updateFilters({ sales_person_id: salesPersonIds }, false)
      }
      if(teamId) {
        await this.updateFilters({ team_id: teamId }, false)
      }
      // await this.fetchCustomers()
      this.isReady = true
    },
    updateSortOptions(options: any) {
      if (!this.isReady) return
      this.updateFilters({
        sort_options: options.sortBy
      })
    },

    async updateFilters(newFilters: Partial<Filters>, shouldFetch = true) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }
      if (shouldFetch) {
        this.fetchCustomers()
      }
    },

    setPage(page: number) {
     this.updateFilters({page})
    },

    setPerpage(perpage: number) {
      this.pagination.per_page = perpage
      this.updateFilters({per_page: perpage})
    },

    setSelectedRows(rows: ICustomerData[]) {
      this.selectedRows = rows
    },

    clearSelectedRows() {
      this.selectedRows = []
    },
  }
})
