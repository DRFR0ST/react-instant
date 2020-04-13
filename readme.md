react-instant
=============

 Instantly run a React application localy

[![Version](https://img.shields.io/npm/v/react-instant.svg?style=for-the-badge)](https://npmjs.org/package/react-instant)
[![Downloads/week](https://img.shields.io/npm/dw/react-instant.svg?style=for-the-badge)](https://npmjs.org/package/react-instant)
[![License](https://img.shields.io/npm/l/react-instant.svg?style=for-the-badge)](https://github.com/DRFR0ST/react-instant/blob/master/package.json)
![GitHub Release Date](https://img.shields.io/github/release-date/DRFR0ST/react-instant?style=for-the-badge)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-instant?style=for-the-badge)](https://npmjs.org/package/react-instant)

<!-- toc -->
# Features
🤖 - Automated setup *(runs all the required commands for you)*

✨ - Less useless dirt on your drive *(saves the project temporarily)*

# Install
#### npm
```npm install -g react-instant```
#### yarn
```yarn global add react-instant```

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

```react-instant Misieq01/notemaster -b dev```

### verbose
Verbose log output.

```react-instant --verbose```

# Requirements
The programs listed below are required to run this app correctly.

- [`git`](https://git-scm.com)
- [`yarn`](https://yarnpkg.com/lang/en/)
- [`serve`](https://www.npmjs.com/package/serve)

# Tips
- If you want to preview a github repository project, use a shorthand by providing only a github and repo name. eg. `react-instant Misieq01/notemaster`

# Caveats
- The provided project's `package.json` has to contain a `build` command (like the one generated by create-react-app)

# Contributors
Thanks to all contributors for making this a better tool and spreading the love to all your lazy (as me) friends!

### Testers
[@xomod](https://github.com/xomod)
