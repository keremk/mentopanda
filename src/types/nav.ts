import { AppPermission } from "@/data/user"

export type NavItem = {
  title: string
  url: string
  iconKey: string
  isActive?: boolean
  permissions?: AppPermission[]
  items?: {
    title: string
    url: string
  }[]
}
