// @NOTICE This file is generated by sav.

module.exports = {
  path: "",
  view: true,
  routes: {
    index: {
      method: "GET",
      path: "/",
      title: "主页",
      keywords: "关键字列表",
      description: "页面描述"
    },
    about: {
      method: "GET",
      keywords: "关键字列表",
      description: "页面描述",
      title: "关于我们"
    },
    profile: {
      method: "GET",
      path: "profile/:uid"
    },
    userInfo: {
      method: "GET",
      view: false
    },
    navMenu: {
      method: "GET",
      view: false
    }
  }
}
