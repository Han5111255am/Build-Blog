import { ref } from 'vue'

export const LANGUAGE_STORAGE_KEY = 'personal-blog-language'
export const DEFAULT_LANGUAGE = 'zh'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh', label: '中文', shortLabel: '中', htmlLang: 'zh-CN', locale: 'zh-CN' },
  { code: 'en', label: 'English', shortLabel: 'EN', htmlLang: 'en', locale: 'en-US' },
]

export const currentLanguage = ref(DEFAULT_LANGUAGE)

export const STATIC_MESSAGES = {
  zh: {
    nav: {
      blog: '博客',
      notes: '琐记',
      projects: '项目',
      podcasts: '播客',
      photos: '照片',
      toggleTheme: '切换主题',
      toggleLightMode: '切换浅色模式',
      toggleDarkMode: '切换深色模式',
      toggleLanguage: '切换语言为 {language}',
    },
    site: {
      home: '首页',
      backParent: '返回上级路径',
    },
    common: {
      loading: '加载中',
      requestFailed: '请求失败',
      emptyState: '空状态',
      reload: '重新加载',
      notFoundCode: '404',
    },
    pagination: {
      previous: '上一页',
      next: '下一页',
      page: '第 {page} 页',
    },
    toc: {
      title: '目录',
    },
    content: {
      unpublished: '未发布',
      datePending: '日期待补充',
      timePending: '时间待补充',
      readingTimePending: '阅读时间待补充',
      readingTime: '{minutes} min read',
    },
    home: {
      pageTitle: '首页',
      avatarAlt: '站点头像',
      analyticsAria: '站点访问统计',
      heroGreeting: '哈喽，我是',
      heroRolePrefix: '一名',
      heroCv: '"CV"',
      heroRole: '高级工程师',
      heroWelcome: '欢迎来到我的博客(˶ᵔ ᵕ ᵔ˶)',
      introBeforeName: 'Hi，我是',
      introBeforeSchool: '，这里可以放你的',
      profileLinkLabel: '个人主页',
      introAfterSchool: '。这个开源模板适合记录技术文章、项目实践、摄影作品和阶段性想法。',
      intro1: 'Hi，我是 Blog Owner，这里可以放你的个人介绍、关注方向与当前计划。',
      intro2: '这个博客用来记录技术学习、项目实践、摄影作品和一些阶段性的想法。这里会有正经的技术文章，也会有不太正经的日常碎碎念。',
      intro3: '你可以按自己的兴趣改写这段介绍，例如计算机、数学、人工智能、音乐、运动、电影、旅行、摄影和阅读。',
      channelsLabel: '我的频道：',
      routePrefix: '你可以从',
      routeAnd: '和',
      routeSuffix: '进入各频道。',
      dream: '这里可以写下一段长期愿景、个人信念，或任何你希望读者第一眼了解的内容。',
      skillsTitle: 'My Skills',
      findMe: '你可以在以下地方找到我',
      douyin: '抖音',
      bilibili: '哔哩哔哩',
      emailLabel: '我的邮箱:',
      or: '或',
      businessWechat: '联系微信:',
      aiGateway: '示例链接:',
      analytics: {
        visitors: '访客',
        visits: '访问次数',
        pageviews: '浏览量',
        allTime: '全部时间',
        lastDays: '最近 {count} 天',
        syncing: '同步中',
        failed: '获取失败',
        waiting: '等待数据',
        noChange: '暂无变化',
      },
    },
    posts: {
      title: '我的博客',
      eyebrow: '我的博客',
      description: '这里我将会分享一些我的技术文章、一些有趣的想法和我的一些思考与感悟',
      back: '返回 Blog',
    },
    notes: {
      title: '琐记',
      eyebrow: '琐记',
      description: '这里我将会记录一些琐事和一些有意义的时刻，偶尔在这发疯发癫(╯°□°）╯︵ ┻━┻',
      back: '返回 Notes',
    },
    text: {
      listErrorTitle: '列表内容暂时不可用',
      listErrorDescription: '接口访问失败时仍保留页面框架。你可以稍后重试，或确认后端服务与代理是否已启动。',
      emptyTitle: '{title} 还没有内容',
      emptyDescription: '当前频道没有返回任何已发布内容。',
      unnamedContent: '未命名内容',
      loadingTitle: '正在加载正文',
      loadingDescription: '详情页会在客户端请求后端接口，并渲染返回的 HTML 内容。',
      notFoundTitle: '这篇内容不存在',
      notFoundDescription: '可能尚未发布，或者 slug 已经发生变化。',
      detailErrorTitle: '正文加载失败',
      detailErrorDescription: '接口返回异常时会保留详情页结构，你可以稍后再次重试。',
    },
    projects: {
      pageTitle: '我的项目',
      intro: '这里我将分享一些我创建或正在维护的项目以及一些我参与或者好玩有用的项目,如果你有兴趣可以点击项目链接查看更多信息也可以为我点点star~(´∀｀)♡',
      actionLinksAria: '项目相关链接',
      listErrorTitle: '项目列表暂时不可用',
      listErrorDescription: '接口失败时不隐藏页面结构。稍后可直接再次重试。',
      emptyTitle: '还没有项目',
      emptyDescription: '当前后端没有返回任何项目卡片。',
      noDescription: '这个项目暂时没有补充描述。',
      internalPage: '站内页',
      projectLink: '项目',
      back: '返回 Projects',
      detailLoadingTitle: '正在加载项目详情',
      detailLoadingDescription: '详情页会请求后端项目详情接口并渲染返回内容。',
      notFoundTitle: '这个项目不存在',
      notFoundDescription: '可能尚未发布，或者链接已经发生变化。',
      detailErrorTitle: '项目详情加载失败',
      detailErrorDescription: '接口异常时仍保留详情页结构，你可以稍后再次重试。',
      sectionTitle: '项目',
      address: '项目地址',
      noBody: '这个项目暂时还没有补充正文内容。',
    },
    podcasts: {
      pageTitle: '我的播客',
      intro: '这里我将分享一些我的播客作品，如果你有兴趣可以点击播客链接查看更多信息',
      listErrorTitle: '播客列表加载失败',
      listErrorDescription: '请确认后端服务已启动，或稍后再次点击重试。',
      emptyTitle: '暂无播客内容',
      emptyDescription: '当前没有可展示的播客条目。',
      back: '返回 Podcasts',
      detailLoadingTitle: '正在加载播客内容',
      detailLoadingDescription: '详情页会请求后端详情接口并渲染 HTML 正文。',
      notFoundTitle: '这条播客不存在',
      notFoundDescription: '可能尚未发布，或者 slug 已发生变化。',
      detailErrorTitle: '播客详情加载失败',
      detailErrorDescription: '接口异常时仍保留详情页结构，可直接再次重试。',
      externalLink: '外部链接',
    },
    photos: {
      pageTitle: '我的摄影作品',
      intro: '这里我将分享一些我的摄影作品，如果你有兴趣可以点击摄影作品链接查看更多信息',
      listErrorTitle: '照片列表加载失败',
      listErrorDescription: '列表失败时保留页面结构和背景，不额外展示独立详情页。',
      emptyTitle: '还没有照片',
      emptyDescription: '接口没有返回任何照片数据。',
      alt: '照片',
      unnamed: '未命名照片',
      noLocation: '暂无地点与说明',
    },
    notFound: {
      pageTitle: '页面不存在',
      title: '你访问的页面不存在',
      description: '当前站点只保留 Blog、Notes、Projects、Podcasts、Photos 以及静态首页。',
    },
  },
  en: {
    nav: {
      blog: 'Blog',
      notes: 'Notes',
      projects: 'Projects',
      podcasts: 'Podcasts',
      photos: 'Photos',
      toggleTheme: 'Toggle theme',
      toggleLightMode: 'Switch to light mode',
      toggleDarkMode: 'Switch to dark mode',
      toggleLanguage: 'Switch language to {language}',
    },
    site: {
      home: 'Home',
      backParent: 'Back to parent path',
    },
    common: {
      loading: 'Loading',
      requestFailed: 'Request failed',
      emptyState: 'Empty state',
      reload: 'Reload',
      notFoundCode: '404',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page {page}',
    },
    toc: {
      title: 'Contents',
    },
    content: {
      unpublished: 'Unpublished',
      datePending: 'Date pending',
      timePending: 'Time pending',
      readingTimePending: 'Reading time pending',
      readingTime: '{minutes} min read',
    },
    home: {
      pageTitle: 'Home',
      avatarAlt: 'Site avatar',
      analyticsAria: 'Site traffic statistics',
      heroGreeting: "Hi, I'm",
      heroRolePrefix: 'a',
      heroCv: '"CV"',
      heroRole: 'senior engineer',
      heroWelcome: 'Welcome to my blog (˶ᵔ ᵕ ᵔ˶)',
      introBeforeName: 'Hi, I am',
      introBeforeSchool: ', and this can link to your',
      profileLinkLabel: 'profile',
      introAfterSchool: '. This open-source template is ready for technical writing, project notes, photography, and personal updates.',
      intro1: 'Hi, I am Blog Owner. Replace this with your bio, focus areas, and current plans.',
      intro2: 'This blog records technical learning, project practice, photography, and thoughts from different stages. You will find serious technical notes here, along with some less serious daily fragments.',
      intro3: 'You can rewrite this section around your own interests, such as computer science, mathematics, AI, music, sports, films, travel, photography, and reading.',
      channelsLabel: 'My channels:',
      routePrefix: 'You can enter each channel from',
      routeAnd: 'and',
      routeSuffix: '.',
      dream: 'Use this paragraph for a long-term vision, personal belief, or anything you want readers to understand first.',
      skillsTitle: 'My Skills',
      findMe: 'You can find me here',
      douyin: 'Douyin',
      bilibili: 'Bilibili',
      emailLabel: 'Email:',
      or: 'or',
      businessWechat: 'WeChat:',
      aiGateway: 'Example link:',
      analytics: {
        visitors: 'Visitors',
        visits: 'Visits',
        pageviews: 'Pageviews',
        allTime: 'All time',
        lastDays: 'Last {count} days',
        syncing: 'Syncing',
        failed: 'Failed',
        waiting: 'Waiting for data',
        noChange: 'No change',
      },
    },
    posts: {
      title: 'My Blog',
      eyebrow: 'My Blog',
      description: 'I share technical articles, interesting ideas, and reflections here.',
      back: 'Back to Blog',
    },
    notes: {
      title: 'Notes',
      eyebrow: 'Notes',
      description: 'A place for small moments, meaningful fragments, and the occasional delightfully unhinged note (╯°□°）╯︵ ┻━┻',
      back: 'Back to Notes',
    },
    text: {
      listErrorTitle: 'The list is temporarily unavailable',
      listErrorDescription: 'The page shell stays visible when the API request fails. Try again later, or check that the backend service and proxy are running.',
      emptyTitle: 'No content in {title} yet',
      emptyDescription: 'This channel has not returned any published content.',
      unnamedContent: 'Untitled content',
      loadingTitle: 'Loading article',
      loadingDescription: 'The detail page requests the backend detail API on the client and renders the returned HTML content.',
      notFoundTitle: 'This content does not exist',
      notFoundDescription: 'It may be unpublished, or the slug may have changed.',
      detailErrorTitle: 'Failed to load article',
      detailErrorDescription: 'The detail page structure remains available when the API returns an error. You can try again later.',
    },
    projects: {
      pageTitle: 'My Projects',
      intro: 'I share projects I created, maintain, contributed to, or simply find fun and useful. Open a project link for more details, and maybe leave a star if you like it~(´∀｀)♡',
      actionLinksAria: 'Project links',
      listErrorTitle: 'Projects are temporarily unavailable',
      listErrorDescription: 'The page structure remains visible when the API request fails. Try again later.',
      emptyTitle: 'No projects yet',
      emptyDescription: 'The backend did not return any project cards.',
      noDescription: 'No description has been added for this project yet.',
      internalPage: 'Details',
      projectLink: 'Project',
      back: 'Back to Projects',
      detailLoadingTitle: 'Loading project details',
      detailLoadingDescription: 'The detail page requests the backend project detail API and renders the returned content.',
      notFoundTitle: 'This project does not exist',
      notFoundDescription: 'It may be unpublished, or the link may have changed.',
      detailErrorTitle: 'Failed to load project details',
      detailErrorDescription: 'The detail page structure remains available when the API fails. You can try again later.',
      sectionTitle: 'Project',
      address: 'Project link',
      noBody: 'No body content has been added for this project yet.',
    },
    podcasts: {
      pageTitle: 'My Podcasts',
      intro: 'I share my podcast work here. Open a podcast link if you want to learn more.',
      listErrorTitle: 'Failed to load podcasts',
      listErrorDescription: 'Please check that the backend service is running, or try again later.',
      emptyTitle: 'No podcasts yet',
      emptyDescription: 'There are no podcast entries to show right now.',
      back: 'Back to Podcasts',
      detailLoadingTitle: 'Loading podcast content',
      detailLoadingDescription: 'The detail page requests the backend detail API and renders the HTML body.',
      notFoundTitle: 'This podcast does not exist',
      notFoundDescription: 'It may be unpublished, or the slug may have changed.',
      detailErrorTitle: 'Failed to load podcast details',
      detailErrorDescription: 'The detail page structure remains available when the API fails. You can retry directly.',
      externalLink: 'External link',
    },
    photos: {
      pageTitle: 'My Photography',
      intro: 'I share some of my photography here. Open a photo link if you want to see more details.',
      listErrorTitle: 'Failed to load photos',
      listErrorDescription: 'The page structure and background stay visible when the list fails; there is no separate detail page.',
      emptyTitle: 'No photos yet',
      emptyDescription: 'The API did not return any photo data.',
      alt: 'Photo',
      unnamed: 'Untitled photo',
      noLocation: 'No location or description yet',
    },
    notFound: {
      pageTitle: 'Page not found',
      title: 'The page you visited does not exist',
      description: 'This site only keeps Blog, Notes, Projects, Podcasts, Photos, and the static home page.',
    },
  },
}

export function getLanguageInfo(code = currentLanguage.value) {
  return SUPPORTED_LANGUAGES.find(language => language.code === code) || SUPPORTED_LANGUAGES[0]
}

export function getCurrentLocale() {
  return getLanguageInfo().locale
}

export function getNextLanguage() {
  return currentLanguage.value === 'zh' ? 'en' : 'zh'
}

export function t(key, params = {}) {
  const messages = STATIC_MESSAGES[currentLanguage.value] || STATIC_MESSAGES[DEFAULT_LANGUAGE]
  const fallbackMessages = STATIC_MESSAGES[DEFAULT_LANGUAGE]
  const template = readMessage(messages, key) ?? readMessage(fallbackMessages, key) ?? key

  return interpolate(template, params)
}

export function setLanguage(nextLanguage) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.some(language => language.code === nextLanguage)
    ? nextLanguage
    : DEFAULT_LANGUAGE

  currentLanguage.value = normalizedLanguage
  syncDocumentLanguage()

  if (typeof window !== 'undefined')
    window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
}

export function toggleLanguage() {
  setLanguage(getNextLanguage())
}

export function initLanguage() {
  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY)
    if (savedLanguage)
      setLanguage(savedLanguage)
    else
      syncDocumentLanguage()
  }
}

function readMessage(messages, key) {
  return key.split('.').reduce((current, part) => current?.[part], messages)
}

function interpolate(template, params) {
  return `${template}`.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '')
}

function syncDocumentLanguage() {
  if (typeof document === 'undefined')
    return

  const languageInfo = getLanguageInfo()
  document.documentElement.lang = languageInfo.htmlLang
  document.documentElement.dataset.language = languageInfo.code
}
