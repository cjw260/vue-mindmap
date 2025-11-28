import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
    path: '/',
    name: 'Layout',
    redirect: '/home',
    component: () => import('../views/layout/index-layout.vue'),
    children: [
      {
        path: '/home',
        component: () => import('../views/home/index-home.vue'),

      },{
        path: '/article/:category/:title',
        component: () => import('../views/article/index-article.vue'),
      },{
        path: '/mindMap',
        component: () => import('../views/mindMap/index-mindMap.vue'),
      }
    ]
  }],
})

export default router
