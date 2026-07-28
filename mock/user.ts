import { MockMethod } from 'vite-plugin-mock'
import { v4 as uuidV4 } from 'uuid'

const menus = [
  {
    "id": 1,
    "name": "首页",
    "path": "/",
    "icon": "House",
    "children": []
  },
  {
    "id": 2,
    "name": "事项管理",
    "path": "/example/formkit",
    "icon": "Document",
    "children": []
  },
  {
    "id": 3,
    "name": "电子监察",
    "path": "/government",
    "icon": "Monitor",
    "children": [
      { "id": 35, "name": "监察总览", "path": "/government/monitor-dashboard", "icon": "DataAnalysis", "children": [] },
      { "id": 31, "name": "时效异常台账", "path": "/government/time-limit", "icon": "Clock", "children": [] },
      { "id": 33, "name": "风险疑点台账", "path": "/government/risk-control", "icon": "Shield", "children": [] },
      { "id": 32, "name": "流程审计检索", "path": "/government/process-audit", "icon": "List", "children": [] },
      { "id": 34, "name": "督办调度中心", "path": "/government/supervise-dispatch", "icon": "Bell", "children": [] }
    ]
  },
  {
    "id": 4,
    "name": "个人中心",
    "path": "/profile",
    "icon": "User",
    "children": []
  }
]

export default [
  // 更新用户信息
  {
    url: '/api/user/update',
    method: 'put',
    response: (xhr: any) => {
      return {
        code: 200,
        message: '更新成功',
        data: xhr.body
      }
    }
  },
  // 修改密码
  {
    url: '/api/user/change-password',
    method: 'put',
    response: (xhr: any) => {
      const { oldPassword, newPassword } = xhr.body || {}
      if (oldPassword === 'admin123') {
        return {
          code: 200,
          message: '密码修改成功'
        }
      }
      return {
        code: 400,
        message: '原密码错误'
      }
    }
  },

  {
    url: '/api/user/info',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: '获取成功',
        data: {
          id: 1,
          role: 28,
          token: uuidV4(),
          avatar: 'https://meichuangyx-test.oss-cn-hangzhou.aliyuncs.com/ADMIN/bdb3da5c-b6a8-42c2-82ea-8e9ef32ab78b.png',
          name: '张三',
          menus,
          email: 'zhangsan@example.com'
        }
      }
    }
  },
  {
    url: '/api/login',
    method: 'post',
    response: () => {
      return {
        code: 200,
        message: '获取成功',
        data: {
          id: 1,
          token: uuidV4(),
          name: '张三',
          email: 'zhangsan@example.com'
        }
      }
    }
  },
  {
    url: '/api/user/menus',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: '获取成功',
        data: menus
      }
    }
  },
  {
    url: '/api/user/searchMenu',
    method: 'get',
    response: (xhr: any) => {
      const { id } = xhr.query || {}
      const result = findMenuRow(Number(id))
      return {
        code: 200,
        message: '获取成功',
        data: result || {}
      }
    }
  },
  {
    url: '/api/user/roles',
    method: 'get',
    response: (xhr: any) => {
      return {
        code: 200,
        message: '获取成功',
        data: {
          total: 2,
          items: [
            {
              id: 1,
              name: '超级管理员',
              description: '拥有所有权限',
              menus: menus.map(menu => menu.id)
            },
            {
              id: 2,
              name: '普通用户',
              description: '只能访问公共资源',
              menus: [1, 2]
            }
          ]
        }
      }
    }
  },
  {
    url: '/api/user/users',
    method: 'get',
    response: (xhr: any) => {
      return {
        code: 200,
        message: '获取成功',
        data: {
          total: 2,
          items: [
            {
              id: 1,
              avatar: '',
              name: '超级管理员',
              accountNo: 'admin',
              email: 'google@123.com',
              state: 'NORMAL',
              description: '拥有所有权限'
            },
            {
              id: 2,
              avatar: 'https://meichuangyx-test.oss-cn-hangzhou.aliyuncs.com/ADMIN/bdb3da5c-b6a8-42c2-82ea-8e9ef32ab78b.png',
              name: '张三',
              accountNo: 'zhangsan',
              email: 'zhangsan@123.com',
              state: 'NORMAL',
              description: '拥有所有权限'
            }
          ]
        }
      }
    }
  },
  // 短信验证码 - 发送
  {
    url: '/api/sms/send',
    method: 'post',
    response: (xhr: any) => {
      const { phonenumber } = xhr.body || {}
      if (!phonenumber) {
        return { code: 400, message: '手机号不能为空' }
      }
      console.log(`[Mock] 短信验证码已发送至 ${phonenumber}: 123456`)
      return { code: 200, message: '验证码发送成功' }
    }
  },
  // 短信验证码 - 登录
  {
    url: '/api/sms/login',
    method: 'post',
    response: (xhr: any) => {
      const { phonenumber } = xhr.body || {}
      if (!phonenumber) {
        return { code: 400, message: '手机号不能为空' }
      }
      return {
        code: 200,
        message: '登录成功',
        data: {
          id: 1,
          token: uuidV4(),
          name: '张三',
          phonenumber
        }
      }
    }
  },
  // 短信验证码 - 注册
  {
    url: '/api/sms/register',
    method: 'post',
    response: (xhr: any) => {
      const { phonenumber, account } = xhr.body || {}
      if (!phonenumber) {
        return { code: 400, message: '手机号不能为空' }
      }
      return {
        code: 200,
        message: '注册成功',
        data: {
          id: 2,
          token: uuidV4(),
          name: account || '新用户',
          phonenumber
        }
      }
    }
  }
] as MockMethod[]

function findMenuRow(id: number) {
  const traverse = (nodes: any): any => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = traverse(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  return traverse(menus);
}