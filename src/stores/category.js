import {
    ref
} from 'vue'
import {
    defineStore
} from 'pinia'

export const useCategoryStore = defineStore('category', () => {
    // 分类列表
    const categoryList = ref([{
        id: 0,
        name: '首页',
        to: '/home',
        categoryKey: 'home'
    }, {
        id: 1,
        name: '高数',
        to: '/article/math/1.1 函数',
        categoryKey: 'math'
    }, {
        id: 2,
        name: '英语',
        to: '/article/english/词汇手册',
        categoryKey: 'english'
    }, {
        id: 3,
        name: '数据结构',
        to: '/article/dataStructure/串的基本操作-C',
        categoryKey: 'dataStructure'
    }, {
        id: 4,
        name: '计组',
        to: '/article/computerStructure/1.2 计算机系统层次结构',
        categoryKey: 'computerStructure'
    }, {
        id: 5,
        name: '计网',
        to: '/article/computerNetwork/01_前言_计算机和因特网',
        categoryKey: 'computerNetwork'
    },{
        id: 6,
        name: '思维导图',
        to: '/mindMap'
    }])
// 文章列表
    const articleMap = ref({
        math: [{
                id: 1,
                title: '1.1 函数',
                to: '/article/math/1.1 函数'
            },
            {
                id: 2,
                title: '1.2 数列的极限',
                to: '/article/math/1.2 数列的极限'
            },
            {
                id: 3,
                title: '1.3 函数的极限',
                to: '/article/math/1.3 函数的极限'
            },
            {
                id: 4,
                title: '1.4 无穷小量与无穷大量',
                to: '/article/math/1.4 无穷小量与无穷大量'
            },
            {
                id: 5,
                title: '1.5 极限的计算',
                to: '/article/math/1.5 极限的计算'
            },
            {
                id: 6,
                title: '1.6 极限的存在准则和两个重要极限',
                to: '/article/math/1.6 极限的存在准则和两个重要极限'
            },
            {
                id: 7,
                title: '1.7 无穷小的比较',
                to: '/article/math/1.7 无穷小的比较'
            },
            {
                id: 8,
                title: '1.8 函数的连续性',
                to: '/article/math/1.8 函数的连续性'
            },
            {
                id: 9,
                title: '1.9 闭区间上连续函数的性质',
                to: '/article/math/1.9 闭区间上连续函数的性质'
            },
            {
                id: 10,
                title: '2.1 导数的概念',
                to: '/article/math/2.1 导数的概念'
            },
            {
                id: 11,
                title: '2.2 求导法则',
                to: '/article/math/2.2 求导法则'
            },
            {
                id: 12,
                title: '2.3 高阶导数',
                to: '/article/math/2.3 高阶导数'
            },
            {
                id: 13,
                title: '2.4 隐函数及参数方程求导',
                to: '/article/math/2.4 隐函数及参数方程求导'
            },
            {
                id: 14,
                title: '2.5 函数的微分',
                to: '/article/math/2.5 函数的微分'
            }

        ],
        english: [{
                id: 1,
                title: '词汇手册',
                to: '/article/english/词汇手册'
            },{
                id: 2,
                title: '语法攻坚',
                to: '/article/english/语法攻坚'
            },{
                id: 3,
                title: '写作模板',
                to: '/article/english/写作模板'
            },],
        dataStructure: [
            {
                id: 1,
                title: '串的基本操作-C',
                to: '/article/dataStructure/串的基本操作-C'
            },
            {
                id: 2,
                title: '二叉树的基本操作-C',
                to: '/article/dataStructure/二叉树的基本操作-C'
            },
            {
                id: 3,
                title: '堆的基本操作-C',
                to: '/article/dataStructure/堆的基本操作-C'
            },
            {
                id: 4,
                title: '算法与数据结构笔记',
                to: '/article/dataStructure/算法与数据结构笔记'
            },
            {
                id: 5,
                title: '常用数据结构和技巧',
                to: '/article/dataStructure/常用数据结构和技巧'
            },
            {
                id: 6,
                title: '高级数据结构',
                to: '/article/dataStructure/高级数据结构'
            }
        ],
        computerStructure: [{
                id: 1,
                title: '1.2 计算机系统层次结构',
                to: '/article/computerStructure/1.2 计算机系统层次结构'
            },{
                id: 2,
                title: '2.1 数据的表示和运算',
                to: '/article/computerStructure/2.1 数据的表示和运算'
            },{
                id: 3,
                title: '2.2 运算方法和运算电路',
                to: '/article/computerStructure/2.2 运算方法和运算电路'
            },{
                id: 4,
                title: '2.3 浮点数的表示和运算',
                to: '/article/computerStructure/2.3 浮点数的表示和运算'
            },],
        computerNetwork: [{
                id: 1,
                title: '01_前言_计算机和因特网',
                to: '/article/computerNetwork/01_前言_计算机和因特网'
            },{
                id: 2,
                title: '02_应用层',
                to: '/article/computerNetwork/02_应用层'
            },{
                id: 3,
                title: '03_运输层',
                to: '/article/computerNetwork/03_运输层'
            },]
    })
    return {
        categoryList,
        articleMap
    }
})