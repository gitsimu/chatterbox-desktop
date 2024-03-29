This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify


## react-color
https://casesandberg.github.io/react-color/   

## electron guide
https://kyuhyuk.kr/article/electron/2020/02/14/Electron-React   
https://gist.github.com/hymm/b621cf64a781cadb92db9312c0956e31   
https://finbits.io/blog/electron-create-react-app-electron-builder/   

## electron packaging
https://github.com/electron-userland/electron-builder#cli-usage   
https://suwoni-codelab.com/electron/2017/04/17/Electron-distribution/   
https://github.com/electron-userland/electron-builder/issues/2030 <- [ERROR] Application entry file "build/electron.js" in th...   
https://stackoverflow.com/questions/54591664/reactjs-neterr-file-not-found <- [ERROR] blank screen issue   

## react-app-rewired
https://www.npmjs.com/package/react-app-rewired   

## file drag n drop
https://tinydew4.github.io/electron-ko/docs/api/dialog/   
https://steemit.com/utopian-io/@pckurdu/file-drag-and-drop-module-in-electron-with-text-editing-example   

## auto update
https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6   
https://blog.naver.com/PostView.nhn?blogId=danaramm&logNo=221743906453&parentCategoryNo=&categoryNo=23&viewDate=&isShowPopularPosts=true&from=search   

## NSIS crashes on Windows 7
https://github.com/electron-userland/electron-builder/issues/2518

## Electron-dl (file download)
https://github.com/sindresorhus/electron-dl   
https://stackoverflow.com/questions/46102851/electron-download-a-file-to-a-specific-location   

## JavaScript convention
https://standardjs.com/rules-kokr.html   


## App build & deploy
    1. change version `package.json`
    2. `npm run react-build`
    3. `npm run deploy`
    4. go to repository on GitHub, and click the "Releases" tab
    5. click on "Edit", and then "Publish" to finalize the release

## Make install file
    1. change version `package.json`
    2. `npm run react-build`
    3. `npm run build`

## Test
    1. `npm run start`

## Windows notification
https://github.com/felixrieseberg/electron-windows-notifications
https://stackoverflow.com/questions/57005561/windows-10-toast-notification-with-scenario-set-to-incomingcall-messes-up-the