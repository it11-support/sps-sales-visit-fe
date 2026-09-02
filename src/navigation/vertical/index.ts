export const userMenu = {
    title: 'Users',
    icon: { icon: 'tabler-users' },
    children: [
      {
        title: 'Users List',        
        to: { name: 'users-list' },
        icon: { icon: 'tabler-users' },
      },
    ]
  }

export const defaultNavItems =  [
  {
    title: 'Customers',
    icon: { icon: 'tabler-users-group' },
    children: [
      {
        title: 'Customers List',
        to: { name: 'customers-list' },
        icon: { icon: 'tabler-user-square' },
      }
    ]
  },
  {
    title: 'Activity',
    icon: { icon: 'tabler-calendar' },
    children: [
      {
        title: 'Activity List',
        to: { name: 'activity-list' },
        icon: { icon: 'tabler-calendar' },
      },
       {
        title: 'Deleted Activities',
        to: { name: 'activity-deleted' },
        icon: { icon: 'tabler-trash' },
      }
    ]
  },
  {
    title: 'Logs Viewer',
    icon: { icon: 'tabler-logs' },
    children: [
      {
        title: 'Error Logs',
        to: { name: 'admin-error-logs' },
        icon: { icon: 'tabler-bug' },
      },
    ]
  }
]

export const getNavItems = (isAdmin: boolean) => {
  const items = defaultNavItems.map(item => {  
    return item
  })

  if (isAdmin) {
    return [userMenu, ...items]
  }
  return items
}

export default getNavItems
