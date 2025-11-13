export interface IYearOnYearStatistic {
    month: string;
    items_last_year: number;
    items_yoy_percent: number;
    items_now: number;
    items_yoy: number;
    sales_last_year: number;
    sales_now: number;
    sales_yoy: number;
    sales_yoy_percent: number;
    volume_last_year: number;
    volume_now: number;
    volume_yoy: number;
    volume_yoy_percent: number;
}

export interface IMonthlySummaryItem {
  item_code: string
  description: string
  invoice_count: number
  volume: number
  unit: string
  price: number
  contribution: number
  total_sales: number
  last_invoice_date: Date
  mom_growth_percent: number | null
}
export interface IMonthlySummary {
    month: string
    items: IMonthlySummaryItem[]
}

export interface IFilter {
  rank: number
  range: number | undefined
}

export type IYoYSummary = {
  monthly_summary: IMonthlySummary[];
  top_items: IMonthlySummaryItem[];
  total_sales_all_items: number;
}

export interface MonthlySalesItem {
  total_sales: number;
  items: number;
  total_days: number;
}

export interface MissingProduct {
  ItemCode: string;
  ItemName: string;
  ItemGroup: string;
  last_purchased: Date;
  volume_kg: number;
}

export interface CompanyMonthlySales {
  [yearMonth: string]: MonthlySalesItem | number | MissingProduct[];

  // helper for known keys
  growth: number;
  missing_items: MissingProduct[];
}

export interface MonthlySales {
  [companyCode: string]: CompanyMonthlySales;
}

export const useStatisticStore = defineStore('statistic', {
    state: () => ({
        yoy_summary: [] as IYearOnYearStatistic[],
        maxItems: 0,
        maxSales: 0,
        avgItems: 0,
        avgSales: 0,
        monthly_sales: {} as MonthlySales,
        monthly_summary: [] as IMonthlySummary[],
        top_items: [] as IMonthlySummaryItem[],
        total_sales_all_items: 0,
        summary: {} as IYoYSummary,
        loadingState: false,
        filter: {
          rank: 5,
          range: 12
        } as IFilter
    }),
    actions: {
      async fetchYoySummary(id: string) {
        this.loadingState = true
        try {         
          const response = await useApi<any>(createUrl(`customer/sales-summary-yearly/${id}`))
          this.yoy_summary = response.data.value.data.yoy_summary
          this.maxItems = response.data.value.data.maxItems
          this.maxSales = response.data.value.data.maxSales
          this.avgItems = response.data.value.data.avgItems
          this.avgSales = response.data.value.data.avgSales          
        } catch (error) {
          if (error) {
            console.error('Error fetching yoy summary:', error)
          }
        }
        this.loadingState = false
      },
      async fetchMoMSummary(id: string) {
        this.loadingState = true
        try {
          const response = await useApi<any>(createUrl(`customer/sales-summary-monthly/${id}`, { query: { range: this.filter.range, rank: this.filter.rank } }))
          this.summary = response.data.value.data
          this.monthly_summary = response.data.value.data.monthly_summary
          this.top_items = response.data.value.data.top_items
          this.total_sales_all_items = response.data.value.data.total_sales_all_items

        } catch (error) {
          if (error) {
            console.error('Error fetching yoy summary:', error)
          }
        }
         this.loadingState = false
      },

      async fetchMonthlySales(id: string){
        this.loadingState =true
        try {
          const response = await useApi<any>(createUrl(`customer/monthly-sales/${id}`))
          this.monthly_sales = response.data.value.data
        } catch (error) {
          if (error) {
            console.error('Error fetching mtd summary:', error)
          }
        }
         this.loadingState = false
      },
      updateFilters(id:string, newFilters: Partial<IFilter>) {
        this.filter = {
          ...this.filter,
          ...newFilters
        }
        
        this.fetchMoMSummary(id)        
      },
    },
    
})
