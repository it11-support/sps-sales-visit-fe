import { ICustomerData } from '@/@core/typedefs'
import { SortItem } from '@/@core/types'
import { defineStore } from 'pinia'

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface Filters {
  search?: string
  status?: string
  sales_person_id?: number
  group_name?: string
  payment_term?: string
  price_list?: string
  city?: string
  per_page: number
  page: number
  sort_options: SortItem[]
  hideZeroInvoice: boolean
  dormantMonth?: number
}

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [] as ICustomerData[],
    customerDetail: {} as ICustomerData,
    meta: {} as Meta,
    loadingList: false,
    loadingDetail: false,
    selectedRows: [] as ICustomerData[],
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
      sales_person_id: undefined,
      group_name: undefined,
      payment_term: undefined,
      price_list: undefined,
      city: undefined,
      per_page: 10,
      page: 1,
      sort_options: [],
      hideZeroInvoice: false,
      dormantMonth: undefined
    } as Filters,
  }),

  actions: {
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

      console.log(data.value.data)
      this.customerDetail = data.value.data.customer
      this.loadingDetail = false



      console.log(this.customerDetail)
    },

    updateSortOptions(options: any) {

      this.updateFilters({
        sort_options: [options.sortBy]
      })
    },

    updateFilters(newFilters: Partial<Filters>) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }
      this.fetchCustomers()      
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
