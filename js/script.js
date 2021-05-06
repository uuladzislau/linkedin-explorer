;(() => {
    console.log('loaded')

    const asyncTimeout = time => new Promise(resolve => setTimeout(resolve, time))

    const asyncInterval = async (callback, ms = 500, triesLeft = 25) =>
        new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                const result = await callback()

                if (!result && triesLeft <= 1) {
                    clearInterval(interval)
                    reject()
                }

                if (result) {
                    clearInterval(interval)
                    resolve(result)
                }

                triesLeft--
            }, ms)
        })

    class LinkedInExplorerPlugin {
        iframe = null
        links = []
        currentIndex = 0
        currentPage = ''
        pageNumber = 1
        openToWork = []
        blacklist = new Set()
        allowedCardTexts = new Set(['В поиске работы', 'Open to work'])

        setApp(iframe) {
            this.iframe = iframe
        }

        init() {
            this.createStyles()
            this.createButton()
            this.createBlacklistArea()
        }

        createButton() {
            try {
                document.getElementById(loader.panelId).removeChild(document.getElementById('ita-btn'))
            } catch (e) {}

            const button = document.createElement('button')

            button.id = 'ita-btn'
            button.classList.add('button')
            button.innerHTML = 'Add <span class="accent">:i</span>Tech<span class="accent">Art</span> people'
            button.addEventListener('click', () => this.findOpenToWorkEngineers())
            document.getElementById(loader.panelId).appendChild(button)
        }

        createBlacklistArea() {
            try {
                document.getElementById(loader.panelId).removeChild(document.getElementById('ita-blacklist'))
            } catch {}

            const blacklistArea = document.createElement('textarea')
            blacklistArea.style = 'background-color: white; display: block; width: 200px; height: 400px'
            blacklistArea.id = 'ita-blacklist'
            blacklistArea.addEventListener('input', e => {
                this.blacklist = new Set(
                    e.target.value
                        .split('\n')
                        .filter(Boolean)
                        .map(url => url.replace(/\/$/g, ''))
                )
            })
            blacklistArea.placeholder = 'Blacklist'
            document.getElementById(loader.panelId).appendChild(blacklistArea)
        }

        printResult() {
            const ul = document.createElement('ul')
            ul.style.position = 'fixed'
            ul.style.backgroundColor = '#ffffff'
            ul.style.padding = '2rem'
            ul.style.border = '2px solid black'
            ul.style.top = 0
            ul.style.right = 0
            ul.style.zIndex = 10000

            this.openToWork.forEach(open => {
                const li = document.createElement('li')
                console.log(open)
                li.innerHTML = open
                ul.appendChild(li)
            })

            document.body.appendChild(ul)
        }

        async nextPage() {
            // if (this.pageNumber === 1) return true
            console.log('Next page...')
            this.pageNumber++
            this.iframe.contentWindow.location.href = this.currentPage + `&page=` + this.pageNumber

            await asyncInterval(() => {
                this.iframe.contentWindow.scroll(0, this.iframe.contentWindow.document.body.scrollHeight)
                return this.iframe.contentWindow.document.querySelector('.artdeco-pagination.ember-view.pv5.ph2')
            })

            const newLinks = [
                ...this.iframe.contentWindow.document.querySelectorAll('.entity-result__title-text > .app-aware-link')
            ]

            if (!newLinks.length) {
                console.log(`No more pages are available`)
                return true
            }

            this.links = [...this.links, ...newLinks]
            console.log('New page user profiles: ', this.links)

            this.currentPage = this.iframe.contentWindow.location.href
            this.currentIndex = 0

            return false
        }

        async visitLinks() {
            const userLink = this.links[this.currentIndex]

            console.log(`visiting ${userLink.href}`)
            console.log(`Current index`, this.currentIndex)

            this.iframe.contentWindow.location.href = userLink.href

            await asyncInterval(() =>
                this.iframe.contentWindow.document.querySelector('.artdeco-card.ember-view.pv-top-card')
            )

            await asyncTimeout(1000)

            let openToWorkCard = this.iframe.contentWindow.document.querySelector(
                '.poc-opportunities-card__text-content'
            )

            const openToWorkHeading = openToWorkCard?.querySelector('.inline-show-more-text')

            if (openToWorkCard && this.allowedCardTexts.has(openToWorkHeading?.textContent.trim())) {
                console.log(`User ${userLink} is open to work`)
                this.openToWork.push(userLink.href)
            }

            if (this.currentIndex === this.links.length - 1) {
                console.log(this.openToWork)
                this.printResult()
                return
            }

            this.currentIndex++
            this.visitLinks()
        }

        async collectLinks() {
            const isEnd = await this.nextPage()

            await asyncTimeout(1000)

            if (isEnd) {
                this.filterLinks()
                this.visitLinks()

                return
            }

            this.collectLinks()
        }

        filterLinks() {
            this.links = this.links.filter(
                link => !link.href.startsWith('https://www.linkedin.com/search') && !this.blacklist.has(link.href)
            )
        }

        async findOpenToWorkEngineers() {
            console.log('Looking for open to work engineers...')

            const searchParams = new URLSearchParams(this.iframe.contentWindow.location.search)

            this.pageNumber = +searchParams.get('page') || 1
            this.currentPage = this.iframe.contentWindow.location.href
            this.links = [
                ...this.iframe.contentWindow.document.querySelectorAll('.entity-result__title-text > .app-aware-link')
            ]
            this.collectLinks()
        }

        createStyles() {
            try {
                document.getElementById(loader.panelId).removeChild(document.getElementById('ita-styles'))
            } catch {}

            const styles = `<style id="ita-styles">
                :root {
                    --background-color: #ffffff;
                    --primary-color: #000000;
                    --accent-color: #ff0025;

                    --border-radius: 10px;
                }

                .button {
                    display: block;
                    appearance: none;
                    background-color: var(--background-color);
                    font-weight: bold;
                    padding: 1em;
                    border: 1px solid var(--primary-color);
                    border-radius: var(--border-radius);
                    margin-bottom: 1rem;
                }
                
                .accent {
                    color: var(--accent-color);
                }
            </style>`

            document.getElementById(loader.panelId).insertAdjacentHTML('beforeend', styles)
        }
    }

    class Loader {
        iframeId = 'loader-inner-iframe-5079520'
        panelId = null
        contentWindow = null
        plugins = []

        init() {
            this.panelId = this.iframeId + '345345'
            this.createIframe()
            this.initPlugins()
        }

        createIframe() {
            try {
                document.body.removeChild(document.getElementById(this.iframeId))
            } catch (e) {}
            const iframe = document.createElement('iframe')
            iframe.src = document.location.href
            iframe.id = this.iframeId
            iframe.width = '100%'
            iframe.height = window.innerHeight

            document.body.innerHTML = ''
            document.body.appendChild(iframe)
            this.contentWindow = iframe.contentWindow

            this.createPanel()
        }

        createPanel() {
            try {
                document.body.removeChild(document.getElementById(this.panelId))
            } catch (e) {}

            const div = document.createElement('div')
            div.style = 'position: absolute; top: 5px; left: 20px; font-weight: bold;'
            div.id = this.panelId
            div.innerHTML = ''
            document.body.appendChild(div)
        }

        windowInit() {
            // Put code that you want to run after iframe is created
        }

        initPlugins() {
            this.plugins.forEach(plugin => {
                plugin.init()
            })
        }

        addPlugin(plugin) {
            this.plugins.push(plugin)
            plugin.setApp(this)
            return this
        }
    }

    const loader = new Loader()
    loader.addPlugin(new LinkedInExplorerPlugin())
    loader.init()
})()
