react-instant
=============
 Instantly run a React application on your local device.

[![Version](https://img.shields.io/npm/v/react-instant.svg?style=for-the-badge)](https://npmjs.org/package/react-instant)
[![Downloads/week](https://img.shields.io/npm/dw/react-instant.svg?style=for-the-badge)](https://npmjs.org/package/react-instant)
[![License](https://img.shields.io/npm/l/react-instant.svg?style=for-the-badge)](https://github.com/DRFR0ST/react-instant/blob/master/package.json)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-instant?style=for-the-badge)](https://npmjs.org/package/react-instant)
[![donate](https://img.shields.io/badge/paypal-donate-ff69b4?style=for-the-badge&logo=paypal)](https://www.paypal.com/paypalme/drfrost420/4,20)

<!-- toc -->
# Features
🤖 - Automated setup *(runs all the boring commands for you)*

✨ - Less useless dirt on your drive *(saves the project temporarily)*

👶 - Super easy to use *(even your grandma will get it)*

# Install
## npm
```npm install -g react-instant```
## yarn
```yarn global add react-instant```

---

### If you think this package is also trash, just go with npx:
`npx react-instant ...`

# Usage
Setup a preview of a selected React application.
```react-instant <GIT_URL>```

eg.
`react-instant https://github.com/DRFR0ST/karutek.git`

after the setup you can preview the project in your browser under `http://127.0.0.1:5000/`
<!-- usage -->
# Flags
### port (-p)
Override default port.

```react-instant https://github.com/DRFR0ST/karutek.git -p 5050```

### version (-v)
Displays the current version.

```react-instant -v```

### save (-s)
Save the project permanenty in a local directory.

```react-instant Misieq01/notemaster -s ./notemaster/```

### branch (-b)
Switches branch after clone.

```react-instant Misieq01/notemaster -b=dev```

### verbose
Verbose log output.

```react-instant --verbose```

### buildScript 
Script name executed on build. Default: "build"

```react-instant DRFR0ST/marko-eling-portfolio --buildScript compose```

### envPath
Path to an .env file, that should be copied into the project.

```react-instant DRFR0ST/circles-web --envPath /some/cool/path/.myEnvFile```

### omitServe
Mainly used for testing. It skips the serving process and exits after build.
Is not useful unless used with --save flag.

```react-instant DRFR0ST/physiomedica-website --omitServe```

# Requirements
The programs listed below are required to run this app correctly.

- [`git`](https://git-scm.com)
- [`yarn`](https://yarnpkg.com/lang/en/)
- [`serve`](https://www.npmjs.com/package/serve)

# Tips
- If you want to preview a github repository project, use a shorthand by providing only a github and repo name. eg. `react-instant Misieq01/notemaster`

# Caveats
- The provided project's `package.json` has to contain a `build` command (like the one generated by create-react-app). You can change the script name by using `buildScript` flag.
- When using `envPath` flag, make sure to name your selected file `.env`, otherwise it will not be copied correctly. (See [#10](https://github.com/DRFR0ST/react-instant/issues/10))

# Contributors
Thanks to all contributors for making this a better tool and spreading the love to all your lazy (as me) friends!

### Testers
[@xomod](https://github.com/xomod)
