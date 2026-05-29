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
      friends: '友链',
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
      introBeforeSchool: '，',
      introAfterSchool: '，目前关注全栈开发、AI 工具、个人产品实践与长期写作。',
      intro1: 'Hi，我是这个博客的作者，目前关注全栈开发、AI 工具、个人产品实践与长期写作。',
      intro2: '这个博客用来记录我的技术学习、项目实践、摄影作品和一些阶段性的想法。这里会有正经的技术文章，也会有不太正经的日常碎碎念。',
      intro3: '我对计算机、数学、物理、人工智能和金融都很感兴趣。技术之外，我也喜欢音乐、运动、电影、旅行、摄影和阅读。希望自己一直保持好奇心，成为一个有趣、有智慧，也能持续创造东西的人。',
      channelsLabel: '我的频道：',
      profileLinkLabel: '个人主页',
      routePrefix: '你可以从',
      routeAnd: '和',
      routeSuffix: '进入各频道。',
      dream: '希望这个博客能成为一个持续沉淀想法、记录实践和连接朋友的地方。',
      skillsTitle: 'My Skills',
      findMe: '你可以在以下地方找到我',
      douyin: '抖音',
      bilibili: '哔哩哔哩',
      emailLabel: '我的邮箱:',
      or: '或',
      businessWechat: '商务合作请加微信:',
      aiGateway: '我的AI中转站:',
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
    friends: {
      pageTitle: '朋友们',
      intro: '这里展示已经通过审核的朋友站点，也欢迎你提交自己的博客。审核通过后，你的头像或 Logo 会出现在这片友链星云里。',
      listErrorTitle: '友链暂时不可用',
      listErrorDescription: '接口失败时仍保留申请入口。你可以稍后重新加载。',
      emptyTitle: '还没有通过审核的友链',
      emptyDescription: '第一批朋友还在路上，你也可以先提交申请。',
      openSite: '访问站点',
      tabsLabel: '友链页面切换',
      circlesTab: '友链',
      applyTab: '友链申请',
      welcomeApply: '欢迎申请加入友链',
      applyButton: '申请友链',
      applyBack: '返回友链',
      applyPageTitle: '申请友链',
      applyPageIntro: '提交你的博客信息，审核通过后头像或 Logo 会进入友链头像墙。',
      applyTitle: '申请友链',
      applyDescription: '请提交稳定可访问的博客地址和 PNG 头像 / Logo 链接。',
      siteName: '站点名称',
      siteUrl: '站点地址',
      logoUrl: '头像或 Logo',
      description: '一句简介',
      contactEmail: '联系邮箱',
      contactNote: '申请备注',
      optional: '可选',
      submit: '提交申请',
      submitting: '提交中...',
      submittedTitle: '申请已提交',
      submittedDescription: '站点管理员会在后台审核，通过后它会出现在上方的圆圈里。',
      submitFailed: '提交失败，请检查填写内容后重试。',
      siteNamePlaceholder: '例如：我的朋友博客',
      siteUrlPlaceholder: 'https://example.com',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      descriptionPlaceholder: '一句话介绍你的博客',
      contactEmailPlaceholder: 'you@example.com',
      contactNotePlaceholder: '可补充你的称呼、交换链接位置等',
      count: '{count} 个站点已展示',
      pendingHint: '所有申请默认进入待审核队列，不会立刻公开展示。',
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
      friends: 'Friends',
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
      introBeforeSchool: ', a software engineering student at ',
      introAfterSchool: '. I currently focus on full-stack development, AI tooling, personal product practice, and long-form writing.',
      intro1: 'Hi, I am the author of this blog. I currently focus on full-stack development, AI tooling, personal product practice, and long-form writing.',
      intro2: 'This blog records my technical learning, project practice, photography, and thoughts from different stages. You will find serious technical notes here, along with some less serious daily fragments.',
      intro3: 'I am interested in computer science, mathematics, physics, artificial intelligence, and finance. Outside technology, I also enjoy music, sports, films, travel, photography, and reading. I hope to stay curious and keep becoming someone interesting, thoughtful, and able to create.',
      channelsLabel: 'My channels:',
      profileLinkLabel: 'personal homepage',
      routePrefix: 'You can enter each channel from',
      routeAnd: 'and',
      routeSuffix: '.',
      dream: 'I hope this blog becomes a durable place to keep ideas, document practice, and connect with friends.',
      skillsTitle: 'My Skills',
      findMe: 'You can find me here',
      douyin: 'Douyin',
      bilibili: 'Bilibili',
      emailLabel: 'Email:',
      or: 'or',
      businessWechat: 'Business inquiries on WeChat:',
      aiGateway: 'My AI relay service:',
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
    friends: {
      pageTitle: 'Friends',
      intro: 'Approved friend links gather here. Submit your blog and, after review, your avatar or logo will join this circle cloud.',
      listErrorTitle: 'Friend links are temporarily unavailable',
      listErrorDescription: 'The application entry stays available when the API request fails. Try reloading later.',
      emptyTitle: 'No approved friend links yet',
      emptyDescription: 'The first friends are still on the way. You can submit yours first.',
      openSite: 'Open site',
      tabsLabel: 'Friend link page switcher',
      circlesTab: 'Friend Links',
      applyTab: 'Friend Link Apply',
      welcomeApply: 'Submit your site to join the friend links',
      applyButton: 'Apply for a link',
      applyBack: 'Back to friends',
      applyPageTitle: 'Apply for a link',
      applyPageIntro: 'Submit your blog information. Once approved, the avatar or logo will join the friend link cloud.',
      applyTitle: 'Apply for a link',
      applyDescription: 'Submit a stable blog URL and a PNG avatar or logo link.',
      siteName: 'Site name',
      siteUrl: 'Site URL',
      logoUrl: 'Avatar or logo',
      description: 'Short bio',
      contactEmail: 'Email',
      contactNote: 'Note',
      optional: 'Optional',
      submit: 'Submit',
      submitting: 'Submitting...',
      submittedTitle: 'Application submitted',
      submittedDescription: 'A site administrator will review it in the admin panel. Once approved, it will appear in the circles above.',
      submitFailed: 'Submission failed. Check the fields and try again.',
      siteNamePlaceholder: 'Example: A Friend Blog',
      siteUrlPlaceholder: 'https://example.com',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      descriptionPlaceholder: 'Introduce your blog in one sentence',
      contactEmailPlaceholder: 'you@example.com',
      contactNotePlaceholder: 'Add your name or link exchange note',
      count: '{count} sites displayed',
      pendingHint: 'Applications enter the review queue by default and are not published immediately.',
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
