const role = useCookie<any>('userData').value?.role?.role

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

  {
    title: 'Customers',
    icon: { icon: 'tabler-users' },
    children: [
      {
        title: 'Customers List',
        to: { name: 'customers-list' },
        icon: { icon: 'tabler-users' },
      }
    ]
  }
  
]
