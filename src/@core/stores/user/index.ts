import { IRole, IUser } from "@/@core/typedefs";
import { useConfigStore } from "../config";

const configStore = useConfigStore()

export const useUserStore = defineStore('userStore', {
  state: () => ({
    loadingList: false,
    user: {
      id: 0,
      name: '',
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      role_id: undefined,
      role: undefined as IRole | undefined,
    } as IUser,
    selectedUser: {
      id: 0,
      name: '',
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      role_id: undefined,
      role: undefined as IRole | undefined,
    } as IUser,
    users: [] as IUser[],
    isEditMode: false,
    isAddNewUserDrawerVisible: false,
    query: {
      search: '',
      role: undefined,
      per_page: 10,
      page: 1,
      sort_options: []
    },
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
    selectedRows: [] as IUser[],
    userOptions: [] as {label: string, value: number}[],
  }),
  actions: {
    async fetchUsers() {
      this.loadingList = true
      const url = createUrl('user', { query: this.query })
      const { data, error } = await useApi<any>(url)
      if (error.value) {
        console.error('Error fetching users:', error.value)
        this.loadingList = false
        return
      }
      this.users = data.value.data.data
      this.pagination = { ...this.pagination, ...data.value.data }
      this.loadingList = false
    },
    async updateUserOptions() {
      await this.fetchUsers()
      this.userOptions = this.users.filter((user: IUser) => user.sales_person == null)
      .filter((user: IUser) => !['admin', 'coordinator'].includes(user.role?.role ?? ''))
      .map((user: IUser) => ({
        label: user.name,
        value: user.id
      }))
    },
    async storeUser (userData: IUser) {
      configStore.overlay = true
      try {
        const url = this.isEditMode ? `/user/update/${userData.id}` : '/user/register'
        await $api(url, {
          method: this.isEditMode ? 'PUT' : 'POST',
          body: userData,
        })
        // Refetch User
        this.fetchUsers()
      } catch (error) {

      } finally {
        configStore.overlay = false
        this.setAddNewUserDrawerVisible(false)
      }
    },
    updateQuery(query: any) {
      this.query = { ...this.query, ...query }
      this.fetchUsers()
    },
    setPerpage(perpage: number) {
      this.pagination.per_page = perpage
      this.updateQuery({per_page: perpage, page: 1})
    },

    setSelectedRows(rows: IUser[]) {
      this.selectedRows = rows
    },
    updateSortOptions(options: any) {
      this.updateQuery({
        sort_options: [options.sortBy]
      })
    },
    setEditMode(editMode: boolean) {
      this.isEditMode = editMode
    },
    setAddNewUserDrawerVisible(visible: boolean) {
      this.isAddNewUserDrawerVisible = visible
    },
    setSelectedUser(user: IUser) {
      this.selectedUser = user
    },  
  }
})
