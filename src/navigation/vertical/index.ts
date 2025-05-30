export const userMenu = {
    title: 'Users',
    icon: { icon: 'tabler-users' },
    children: [
      {
        title: 'Users List',        
        to: { name: 'users-list' },
        icon: { icon: 'tabler-users' },
      },
      {
        title: 'Sales Person',
        to: { name: 'sales-list' },
        icon: { icon: 'tabler-users' },
      }
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
      }
    ]
  }
]

export const getNavItems = (isAdmin: boolean) => {
  return isAdmin ? [userMenu, ...defaultNavItems] : [...defaultNavItems];
}

export default getNavItems
