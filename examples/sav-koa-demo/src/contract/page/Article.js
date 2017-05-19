// @NOTICE This file is generated by sav-cli.

/* eslint quotes: ["off"] */
module.exports = {
  moduleName: "Article",
  moduleGroup: "Page",
  props: {
    view: "vue",
    layout: "UserLayout"
  },
  routes: [
    {
      actionName: "posts",
      middlewares: [
        {
          name: "meta",
          props: {
            keywords: "关键字列表",
            description: "页面描述"
          }
        },
        {
          name: "title",
          props: "文章列表"
        },
        {
          name: "route",
          props: {
            methods: [
              "GET"
            ]
          }
        },
        {
          name: "res",
          props: {
            name: "ResArticleList",
            props: {
              articles: "Array<ArticleItem>"
            },
            refs: {
              ArticleItem: {
                name: "ArticleItem",
                props: {
                  id: "Number",
                  title: "String",
                  content: "String"
                }
              }
            }
          }
        }
      ]
    },
    {
      actionName: "view",
      middlewares: [
        {
          name: "req",
          props: {
            props: {
              aid: "String"
            }
          }
        },
        {
          name: "route",
          props: {
            methods: [
              "GET"
            ],
            path: "view/:aid"
          }
        },
        {
          name: "res",
          props: {
            name: "ResArtilceView",
            props: {
              article: "ArticleItem"
            }
          }
        }
      ]
    },
    {
      actionName: "modify",
      middlewares: [
        {
          name: "vue",
          props: {
            component: "Article/ArticleModify"
          }
        },
        {
          name: "auth"
        },
        {
          name: "route",
          props: {
            methods: [
              "GET"
            ],
            path: "modify/:id?"
          }
        }
      ]
    },
    {
      actionName: "update",
      middlewares: [
        {
          name: "vue",
          props: {
            component: "Article/ArticleModify"
          }
        },
        {
          name: "auth"
        },
        {
          name: "route",
          props: {
            methods: [
              "POST"
            ],
            path: "update/:aid"
          }
        }
      ]
    }
  ],
  SavRoute: {
    uri: "ArticlePage",
    path: "/article",
    childs: [
      {
        uri: "ArticlePage.posts",
        path: "/article/posts",
        methods: [
          "GET"
        ],
        relative: "posts"
      },
      {
        uri: "ArticlePage.view",
        path: "/article/view/:aid",
        methods: [
          "GET"
        ],
        relative: "view/:aid"
      },
      {
        uri: "ArticlePage.modify",
        path: "/article/modify/:id?",
        methods: [
          "GET"
        ],
        relative: "modify/:id?"
      },
      {
        uri: "ArticlePage.update",
        path: "/article/update/:aid",
        methods: [
          "POST"
        ],
        relative: "update/:aid"
      }
    ],
    parents: []
  },
  VueRoute: {
    component: "Article/Article",
    path: "/article",
    children: [
      {
        component: "Article/ArticlePosts",
        name: "ArticlePosts",
        path: "posts"
      },
      {
        component: "Article/ArticleView",
        name: "ArticleView",
        path: "view/:aid"
      },
      {
        component: "Article/ArticleModify",
        name: "ArticleModify",
        path: "modify/:id?"
      },
      {
        component: "Article/ArticleModify",
        name: "ArticleUpdate",
        path: "update/:aid"
      }
    ]
  }
}
