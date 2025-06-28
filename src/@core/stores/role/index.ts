import { IRole } from "@/@core/typedefs";

export const useRoleStore = defineStore('roleStore', {
  state: () => ({
    isLoading: false,
    role: {
      id: 0,
      role: '',
      description: '',
      created_at: new Date(),
      updated_at: new Date(),
    } as IRole,
    roles: [] as IRole[],
    fitler: {
      search: '',
      per_page: 10,
      page: 1,
      sort_options: []
    },
    roleOptions: [] as {role: string, id: number}[],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      next_page_url: null,
      prev_page_url: null,
      first_page_url: null,
      last_page_url: null,
    },
  }),
  actions: {
    async fetchRoles() {
      this.isLoading = true
      const { data } = await $api('/role', {
        method: 'GET',
      })
      this.roles = data
      this.roleOptions = data.map((role: any) => ({
        role: role.role[0].toUpperCase() + role.role.slice(1),
        id: role.id
      }))
      this.isLoading = false
    },
  }
})
