// @NOTICE This file is generated by sav-cli.

/* eslint quotes: ["off"] */
import Article from './Article/Article.vue'
import ArticlePosts from './Article/ArticlePosts.vue'
import ArticleView from './Article/ArticleView.vue'
import ArticleModify from './Article/ArticleModify.vue'
import Home from './Home/Home.vue'
import HomeIndex from './Home/HomeIndex.vue'
import HomeAbout from './Home/HomeAbout.vue'

export default [
  {
    component: Article,
    path: "/article",
    children: [
      {
        component: ArticlePosts,
        name: "ArticlePosts",
        path: "posts"
      },
      {
        component: ArticleView,
        name: "ArticleView",
        path: "/articles/:aid"
      },
      {
        component: ArticleModify,
        name: "ArticleModify",
        path: "modify/:id?"
      },
      {
        component: ArticleModify,
        name: "ArticleUpdate",
        path: "update/:aid"
      }
    ]
  },
  {
    component: Home,
    path: "/",
    children: [
      {
        component: HomeIndex,
        name: "HomeIndex",
        path: "/"
      },
      {
        component: HomeAbout,
        name: "HomeAbout",
        path: "about"
      }
    ]
  }
]
