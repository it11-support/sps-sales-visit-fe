import { IProduct } from "@/@core/typedefs"

export const useProductStore = defineStore('products', {
  
  state: () => ({
    loading: false,
    products: [] as IProduct[],
    productOptions: [] as { title: string; value: string }[]
  }),
  actions: {
  
    async fetchProductOptions() {
      this.loading = true
      const url = createUrl(`product/get-options`)
      const { data: invoicesData, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching sales person options:', error.value)
        return
      }

      if(invoicesData.value.data) {
        this.products = invoicesData.value.data
  
        this.productOptions = invoicesData.value.data
        .map((product: IProduct) => ({
          value: product.ItemCode,
          title: product.ItemName
        })).filter((item: { value: string; title: string; }, index: number, self: { value: string; title: string; }[]) => 
          index === self.findIndex((t) => t.value === item.value)
        )
      }
      
      this.loading = false
    }
  }
})
