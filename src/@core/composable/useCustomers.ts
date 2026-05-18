// composables/useCustomers.ts
import useSWRV from 'swrv'
import { computed, reactive, ref, watch } from 'vue'

import { ICustomerData } from '@/@core/typedefs'
import { SortItem } from '@/@core/types'

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface CustomerFilters {
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
  dormantMonth?: number
  companyIds: string[]
}

interface CustomerOption {
  value: number
  title: string
  companyId: string
  SlpCode: number
}

const defaultFilters: CustomerFilters = {
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
  companyIds: [COMPANIES.SPS],
}

export function useCustomers() {
  const isReady = ref(false)

  const filters = reactive<CustomerFilters>({
    ...defaultFilters,
  })

  const selectedRows = ref<ICustomerData[]>([])

  // =========================
  // CUSTOMERS
  // =========================

  const customerKey = computed(() => {
    if (!isReady.value)
      return null

    const query: Record<string, any> = {
      per_page: filters.per_page,
      page: filters.page,
    }

    if (filters.search) {
      query.search = filters.search
    }

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.group_name) {
      query.group_name = filters.group_name
    }

    if (filters.payment_term) {
      query.payment_term = filters.payment_term
    }

    if (filters.price_list) {
      query.price_list = filters.price_list
    }

    if (filters.city) {
      query.city = filters.city
    }

    if (filters.team_id) {
      query.team_id = filters.team_id
    }

    if (filters.dormantMonth) {
      query.dormantMonth = filters.dormantMonth
    }

    if (filters.hideZeroInvoice) {
      query.hideZeroInvoice = true
    }

    if (filters.sales_person_id.length) {
      query.sales_person_id = filters.sales_person_id
    }

    if (filters.companyIds.length) {
      query.companyIds = filters.companyIds
    }

    if (filters.sort_options.length) {
      query.sort_options = filters.sort_options
    }

    return createUrl('customer', {
      query,
    }).value
  })

  const {
    data: customerResponse,
    error: customerError,
    isValidating: loadingList,
    mutate: mutateCustomers,
  } = useSWRV(customerKey,
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    })

  console.log(customerResponse.value)

  const customers = computed<ICustomerData[]>(
    () => customerResponse.value?.data.data ?? [],
  )

  const pagination = computed(() => ({
    current_page: customerResponse.value?.data.current_page ?? 1,
    last_page: customerResponse.value?.data.last_page ?? 1,
    per_page: customerResponse.value?.data.per_page ?? 10,
    total: customerResponse.value?.data.total ?? 0,
    next_page_url: customerResponse.value?.data.next_page_url ?? null,
    prev_page_url: customerResponse.value?.data.prev_page_url ?? null,
    first_page_url: customerResponse.value?.data.first_page_url ?? null,
    last_page_url: customerResponse.value?.data.last_page_url ?? null,
    path: customerResponse.value?.data.path ?? '',
    links: customerResponse.value?.data.links ?? [],
  }))

  const meta = computed<Meta>(() => ({
    current_page: customerResponse.value?.data.current_page ?? 1,
    last_page: customerResponse.value?.data.last_page ?? 1,
    per_page: customerResponse.value?.data.per_page ?? 10,
    total: customerResponse.value?.data.total ?? 0,
  }))

  // =========================
  // CUSTOMER DETAIL
  // =========================

  const customerId = ref<string | null>(null)

  const customerDetailKey = computed(() => {
    if (!customerId.value)
      return null

    return `customer/${customerId.value}`
  })

  const {
    data: customerDetailResponse,
    error: customerDetailError,
    isValidating: loadingDetail,
    mutate: mutateCustomerDetail,
  } = useSWRV(customerDetailKey, (url: string) => $api(url), {
    revalidateOnFocus: false,
  })

  const customerDetail = computed<ICustomerData>(
    () => customerDetailResponse.value ?? {},
  )

  const customer = computed<ICustomerData>(
    () => customerDetailResponse.value ?? {},
  )

  // =========================
  // FILTER OPTIONS
  // =========================

  const {
    data: filterResponse,
    mutate: mutateFilters,
    isValidating: loadingFilters,
  } = useSWRV(
    'customer/get-fitlers',
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    },
  )

  const groupFilters = computed(() => filterResponse.value ?? {})
  console.log(groupFilters.value)

  const groupNameOptions = computed(() =>
    filterResponse.value?.data.groupName?.map((group: any) => ({
      title: group.GroupName,
      value: group.GroupName,
    })) ?? [],
  )

  const paymentTermOptions = computed(() =>
    filterResponse.value?.data.paymentTerm?.map((term: any) => ({
      title: term.PaymentTerm,
      value: term.PaymentTerm,
    })) ?? [],
  )

  const priceListOptions = computed(() =>
    filterResponse.value?.data.priceList?.map((list: any) => ({
      title: list.PriceList,
      value: list.PriceList,
    })) ?? [],
  )

  const cityOptions = computed(() =>
    filterResponse.value?.data.cities
      ?.filter((city: any) => city.City !== null)
      ?.map((city: any) => ({
        title: city.City,
        value: city.City,
      })) ?? [],
  )

  // =========================
  // CUSTOMER OPTIONS
  // =========================

  const customerOptionsKey = ref<string | null>(null)

  const {
    data: customerOptionsResponse,
    mutate: mutateCustomerOptions,
  } = useSWRV(
    customerOptionsKey,
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    },
  )

  const customerOptions = computed<CustomerOption[]>(() =>
    customerOptionsResponse.value?.map((company: any) => ({
      value: company.id,
      title: `${company.CardName} (${company.CardCode})`,
      companyId: company.CompanyId,
      SlpCode: Number(company.SlpCode),
    })) ?? [],
  )

  // =========================
  // ACTIONS
  // =========================

  async function initialize(
    salesPersonIds?: number[],
    teamId?: number,
  ) {
    if (salesPersonIds) {
      filters.sales_person_id = salesPersonIds
    }

    if (teamId) {
      filters.team_id = teamId
    }

    isReady.value = true
  }

  async function fetchCustomerById(id: string) {
    customerId.value = id

    await mutateCustomerDetail()
  }

  async function fetchCustomerOptions(
    companyId: string | null = null,
    salesPersonId: string | null = null,
  ) {
    customerOptionsKey.value = createUrl(
      'customer/get-options',
      {
        query: {
          companyId,
          salesPersonId,
        },
      },
    ).value

    await mutateCustomerOptions()
  }

  function updateSortOptions(options: any) {
    if (!isReady.value)
      return

    updateFilters({
      page: options.page,
      per_page: options.itemsPerPage,
      sort_options: options.sortBy.map((s: any) => ({
        key: s.key,
        order: s.order,
      })),
    })
  }

  function updateFilters(newFilters: Partial<CustomerFilters>) {
    Object.assign(filters, newFilters)
  }

  function setPage(page: number) {
    filters.page = page
  }

  function setPerpage(perpage: number) {
    filters.per_page = perpage
  }

  function setSelectedRows(rows: ICustomerData[]) {
    selectedRows.value = rows
  }

  function clearSelectedRows() {
    selectedRows.value = []
  }

  // reset page saat filter berubah
  watch(
    () => [
      filters.search,
      filters.status,
      filters.group_name,
      filters.payment_term,
      filters.price_list,
      filters.city,
    ],
    () => {
      filters.page = 1
    },
  )

  return {
    // state
    isReady,
    filters,

    // customers
    customers,
    pagination,
    meta,
    loadingList,
    customerError,
    mutateCustomers,

    // detail
    customer,
    customerDetail,
    loadingDetail,
    customerDetailError,

    // filter options
    groupFilters,
    groupNameOptions,
    paymentTermOptions,
    priceListOptions,
    cityOptions,

    // customer options
    customerOptions,

    // selected rows
    selectedRows,
    // actions
    initialize,
    fetchCustomerById,
    fetchCustomerOptions,
    updateFilters,
    updateSortOptions,
    setPage,
    setPerpage,
    setSelectedRows,
    clearSelectedRows,
    mutateFilters,
    loadingFilters
  }
}
