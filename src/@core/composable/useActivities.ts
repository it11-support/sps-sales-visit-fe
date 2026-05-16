import { $api } from "@/utils/api";
import { refDebounced } from "@vueuse/core";
import useSWRV from "swrv";
import { computed, ref, watch } from "vue";
import { Filters } from "../stores";
import { IActivity, ICustomerData, ISalesPerson } from "../types";

interface SalesPersonOptions {
  title: string
  value: number
}
export function useActivities(
  localKey: string,
  initialFilters?: Partial<Filters>,
  defaultFilters?: Partial<Filters>,
) {
  const filters = ref<Filters>({
    search: "",
    sales_person_id: null,
    customer_id: null,
    per_page: 10,
    page: 1,
    sort_options: [],
    status: null,
    start_date: "",
    end_date: "",

    ...defaultFilters,
    ...initialFilters,
  });

  const selectedRows = ref<IActivity[]>([]);

  watch(
    filters,
    (newFilters) => {
      const existingData = localStorage.getItem(localKey);

      const parsedExisting = existingData
        ? JSON.parse(existingData)
        : {};

      localStorage.setItem(
        localKey,
        JSON.stringify({
          ...parsedExisting,

          search: newFilters.search,
          sales_person_id: newFilters.sales_person_id,
          customer_id: newFilters.customer_id,
          per_page: newFilters.per_page,
          page: newFilters.page,
          status: newFilters.status,
          start_date: newFilters.start_date,
          end_date: newFilters.end_date,
          sort_options: newFilters.sort_options,
        }),
      );
    },
    { deep: true },
  );

  const debouncedSearch = refDebounced(
    computed(() => filters.value.search),
    500,
  );

  const formatDate = (
    date: Date | string | undefined | null,
  ): string => {
    if (!date) return "";

    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return date;
  };

  const swrvKey = computed(() => {
    const params = new URLSearchParams({
      search: debouncedSearch.value || "",
      sales_person_id: filters.value.sales_person_id
        ? String(filters.value.sales_person_id)
        : "",
      customer_id: filters.value.customer_id
        ? String(filters.value.customer_id)
        : "",
      per_page: String(filters.value.per_page),
      page: String(filters.value.page),
      status: filters.value.status || "",
      sort_options: JSON.stringify(filters.value.sort_options),
      start_date: formatDate(filters.value.start_date),
      end_date: formatDate(filters.value.end_date),
    });

    if (filters.value.deleted !== undefined) {
      params.append(
        "deleted",
        String(filters.value.deleted),
      );
    }

    if (filters.value.assigned_to) {
      params.append(
        "assigned_to",
        String(filters.value.assigned_to),
      );
    }

    return `/activity?${params.toString()}`;
  });

  const {
    data: activityResponse,
    error,
    mutate,
    isValidating,
  } = useSWRV(
    swrvKey,
    (url: string) => $api(url),
    {
      dedupingInterval: 1000 * 10,
      revalidateOnFocus: false,
    },
  );

  const { data: customerData } = useSWRV(
    'activity/get-customers',
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    }
  )

  const { data: salesPersonData, isValidating: isSalesPersonLoading } = useSWRV(
    'activity/get-filters',
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    }
  )


  const { data: activityTypeData, isValidating: isActivityTypeLoading } = useSWRV(
    'activity/activity-types',
    (url: string) => $api(url),
    {
      revalidateOnFocus: false,
    }
  )

  const activityTypes = computed(() => {
    return activityTypeData.value.data.map((type: any) => ({
      value: type.id,
      title: type.name
    })) || []
  })

  const distinctSalesPersons = computed<ISalesPerson[]>(() => {
    const salesPersons =
      (salesPersonData.value?.data?.salesPersons ||
        []) as ISalesPerson[]

    const grouped = salesPersons.reduce<
      Record<string, ISalesPerson>
    >((acc, item) => {
      acc[item.SlpName] = item

      return acc
    }, {})

    return Object.values(grouped)
  })

  const salesPersonOptions = computed(() =>
    distinctSalesPersons.value.map((sp: any) => ({
      title: sp.SlpName,
      value: sp.SlpCode,
    }))
  )

  const customerOptions = computed(() =>
    customerData.value?.data.map(
      (customer: ICustomerData) => ({
        title: customer.CardName,
        value: customer.id,
        sales_person_id: customer.sales_person?.id,
      }),
    ) || [],
  )

  const updateFilters = (
    newFilters: Partial<Filters>,
  ) => {
    const shouldResetPage =
      newFilters.search !== undefined ||
      newFilters.sales_person_id !== undefined ||
      newFilters.customer_id !== undefined ||
      newFilters.status !== undefined ||
      newFilters.start_date !== undefined ||
      newFilters.end_date !== undefined ||
      newFilters.per_page !== undefined;

    filters.value = {
      ...filters.value,
      ...newFilters,

      page: shouldResetPage
        ? 1
        : (newFilters.page ?? filters.value.page),
    };
  };

  const setSelectedRows = (rows: IActivity[]) => {
    selectedRows.value = rows;
  };

  return {
    filters,
    updateFilters,

    selectedRows,
    setSelectedRows,

    loadingList: isValidating,

    activities: computed(() => {
      return (
        activityResponse.value?.data?.data || []
      ) as IActivity[];
    }),

    pagination: computed(() => {
      if (!activityResponse.value?.data) {
        return {
          current_page: filters.value.page,
          last_page: 1,
          per_page: filters.value.per_page,
          total: 0,
        };
      }

      const meta =
        activityResponse.value.data.meta ||
        activityResponse.value.data;

      return {
        current_page: Number(
          meta.current_page || filters.value.page,
        ),

        last_page: Math.max(
          1,
          Number(meta.last_page || 1),
        ),

        per_page: Number(
          meta.per_page || filters.value.per_page,
        ),

        total: Number(meta.total || 0),
      };
    }),

    error,
    mutate,

    isLoading: computed(
      () =>
        !activityResponse.value &&
        !error.value,
    ),

    isRefetching: isValidating,
    customerOptions,
    salesPersonOptions,
    isSalesPersonLoading,
    activityTypes
  };
}
