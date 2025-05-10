const role = useCookie<any>('userData').value?.role?.role
export const isAdmin = () => {
  const userData = useCookie('userData') as { value: { role: { role: string } } };
  return userData?.value?.role?.role === 'admin';
}

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

export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
  },
  ...(isAdmin() ? [userMenu] : []),
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
  }
]
