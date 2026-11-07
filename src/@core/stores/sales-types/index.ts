import type {
  ISalesType,
  ISalesTypePagination,
  ISalesTypeQuery,
  ISalesTypeResponse,
  SalesTypePayload,
} from "@core/types";
import { defineStore } from "pinia";

const endpoint = "sales-types";

export const useSalesTypeStore = defineStore("salesTypesStore", {
  state: () => ({
    salesTypes: [] as ISalesType[],
    selectedSalesType: null as ISalesType | null,
    salesTypeOptions: [] as { title: string; value: number }[],
    loadingSalesTypeOptions: false,

    query: {
      search: "",
      page: 1,
      per_page: 10,
      sort_by: "id",
      sort_order: "desc",
    } as ISalesTypeQuery,

    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    } as ISalesTypePagination,

    loading: false,
    saving: false,
    error: null as string | null,

    isDrawerVisible: false,
    isEditMode: false,
  }),

  actions: {
    async fetchSalesTypeOptions() {
      this.loadingSalesTypeOptions = true;

      try {
        const { data, error } = await useApi<ISalesTypeResponse<ISalesType[]>>(
          createUrl(endpoint, {
            query: {
              per_page: 100,
              page: 1,
              is_active: true,
            },
          }).value,
        );

        if (error.value) throw error.value;

        this.salesTypeOptions = (data.value?.data ?? [])
          .filter((item) => item.is_active)
          .map((item) => ({
            title: item.code + " - " + item.name,
            value: item.id,
          }));

        return this.salesTypeOptions;
      } catch (error) {
        console.error("Failed to fetch sales type options:", error);
        this.salesTypeOptions = [];
        return [];
      } finally {
        this.loadingSalesTypeOptions = false;
      }
    },
    async fetchSalesTypes() {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await useApi<ISalesTypeResponse<ISalesType[]>>(
          createUrl(endpoint, {
            query: { ...this.query },
          }).value,
        );

        if (error.value) throw error.value;

        if (!data.value) throw new Error("Empty API response");

        this.salesTypes = data.value.data ?? [];

        if (data.value.pagination) this.pagination = data.value.pagination;

        return this.salesTypes;
      } catch (error) {
        this.error = this.getErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchSalesType(id: number) {
      const { data, error } = await useApi<ISalesTypeResponse<ISalesType>>(
        `${endpoint}/${id}`,
      );

      if (error.value) throw error.value;

      return data.value?.data;
    },

    async storeSalesType(payload: SalesTypePayload) {
      this.saving = true;
      this.error = null;

      try {
        const { data, error } = await useApi<ISalesTypeResponse<ISalesType>>(
          endpoint,
        )
          .post(payload)
          .json();

        if (error.value) throw error.value;

        await this.fetchSalesTypes();

        return data.value?.data;
      } catch (error) {
        this.error = this.getErrorMessage(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async updateSalesType(id: number, payload: Partial<SalesTypePayload>) {
      this.saving = true;
      this.error = null;

      try {
        const { data, error } = await useApi<ISalesTypeResponse<ISalesType>>(
          `${endpoint}/${id}`,
        )
          .put(payload)
          .json();

        if (error.value) throw error.value;

        await this.fetchSalesTypes();

        return data.value?.data;
      } catch (error) {
        this.error = this.getErrorMessage(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async destroySalesType(id: number) {
      this.saving = true;
      this.error = null;

      try {
        await $api(`sales-types/${id}`, {
          method: "DELETE",
        });

        if (this.salesTypes.length === 1 && this.query.page > 1)
          this.query.page--;

        await this.fetchSalesTypes();

        this.selectedSalesType = null;

        return true;
      } catch (error) {
        this.error = this.getErrorMessage(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async updateQuery(params: Partial<ISalesTypeQuery>) {
      Object.assign(this.query, params);

      return this.fetchSalesTypes();
    },

    async setPerpage(perPage: number) {
      this.query.per_page = perPage;
      this.query.page = 1;

      return this.fetchSalesTypes();
    },

    openCreateDrawer() {
      this.selectedSalesType = null;
      this.isEditMode = false;
      this.isDrawerVisible = true;
    },

    openEditDrawer(item: ISalesType) {
      this.selectedSalesType = { ...item };
      this.isEditMode = true;
      this.isDrawerVisible = true;
    },

    closeDrawer() {
      this.isDrawerVisible = false;
    },

    getErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message;

      if (typeof error === "object" && error !== null) {
        const err = error as {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
          message?: string;
        };

        if (err.data?.errors)
          return Object.values(err.data.errors).flat().join(", ");

        return err.data?.message ?? err.message ?? "Request failed";
      }

      return "An unexpected error occurred";
    },
  },
});
