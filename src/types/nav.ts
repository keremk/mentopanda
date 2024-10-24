export type NavItem = {
  title: string
  url: string
  iconKey: string
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}
