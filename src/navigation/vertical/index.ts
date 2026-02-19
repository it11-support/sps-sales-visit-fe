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
  }
]

export const getNavItems = (isAdmin: boolean) => {
  const items = defaultNavItems.map(item => {
    if (item.title === 'Activity') {
      return {
        ...item,
        children: isAdmin
          ? item.children
          : item.children?.filter(
              child => child.to.name !== 'activity-deleted'
            ),
      }
    }

    return item
  })

  return isAdmin ? [userMenu, ...items] : items
}

export default getNavItems
