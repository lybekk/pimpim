module.exports = {
    publicPath: '',
    "transpileDependencies": [
        "vuetify"
    ],
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "artifactName": "${productName}_desktop.${ext}"
            }
        }
    },
    pwa: {
        name: 'offPIM - Offline-first Personal Information Management',
        themeColor: '#e5e9f0', // Toolbar color
        msTileColor: '#e5e9f0',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'teal',
        manifestOptions: {
            name: 'offPIM - Offline-first Personal Information Management',
            short_name: "offPIM",
            description: 'A tool trying to offer a wayt to organize your information and present it in a practical way.',
            display: 'standalone',
            background_color: '#e5e9f0', // Usen on splash screen
            share_target: { /* Work in progress */
                action: "/#/new/task",
                method: "GET",
                params: {
                  title: "Share to offPIM",
                  text: "text",
                  url: "/#/new/task",
                }
              },
              shortcuts: [ 
                {
                  name: "Add task",
                  short_name: "Add task",
                  description: "Add a task",
                  url: "/#/new/task",
                  icons: [{ "src": "/img/icons/android-chrome-192x192.png", "sizes": "192x192" }]
                }
              ],
        },
    },
    productionSourceMap: false,
    css: {
        extract: false
    }
}
