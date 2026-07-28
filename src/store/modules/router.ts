import { defineStore } from "pinia"
import { store } from "@/store"

const ConstantMenus = [
  { name: "首页", path: "/", icon: "House" },
  { name: "事项管理", path: "/example/formkit", icon: "Document" },
  {
    name: "电子监察",
    path: "/government",
    icon: "Monitor",
    children: [
      { name: "监察总览", path: "/government/monitor-dashboard", icon: "DataAnalysis" },
      { name: "时效异常台账", path: "/government/time-limit", icon: "Clock" },
      { name: "风险疑点台账", path: "/government/risk-control", icon: "Shield" },
      { name: "流程审计检索", path: "/government/process-audit", icon: "List" },
      { name: "督办调度中心", path: "/government/supervise-dispatch", icon: "Bell" }
    ]
  },
  { name: "个人中心", path: "/profile", icon: "User" }
];

export const routerStore = defineStore("router", () => {
  const whiteList: Array<string> = [],
    SidebarMenus: any = ref([ ...ConstantMenus ]),
    routers: any = ref([]);

  const setRoutes = (data: Array<object> | any) => routers.value = data

  return { routers, setRoutes, whiteList, SidebarMenus }
})

export function useRouterStoreHook() {
  return routerStore(store)
}