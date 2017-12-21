# mst-drama
> an event or situation, especially an unexpected one, in which there is worry or excitement and usually a lot of **action**

[![Build Status](https://travis-ci.org/geut/mst-drama.svg?branch=master)](https://travis-ci.org/geut/mst-drama)
[![Stability: Experimental](https://masterminds.github.io/stability/experimental.svg)](https://masterminds.github.io/stability/experimental.html)

## Contents

* [Introduction](##introduction)
* [Installation](##installation)

## Introduction

Drama is a set of functions that help you to work with [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree)
and their **actions**.

At the moment there are only 2 functions:

#### connectReduxDevtools(remotedev: object, store: object, options: { trackYield: false })

connectReduxDevtools works similar to the original connect from MST but also tracks each `yield` in your async actions so
you can see in the redux devtool how the state mutates in each step.

```javascript
...
import { connectReduxDevtools } from '@geut/mst-drama';
...
connectReduxDevtools(require('remotedev'), store);
```

![connect-redux-devtool](https://github.com/geut/mst-drama/raw/master/example/connect-redux-devtool.gif)

#### flowMap(actions: object)

flowMap iterates over an object of actions and converts each generator function found in a flow async action.

```javascript
...
import { flowMap } from '@geut/mst-drama';

const Todo = types.model({
        title: types.string
    })
    .actions(self => flowMap({
        setTitle(newTitle) {
            self.title = newTitle
        },
        *asyncSetTitle(newTitle) {
            yield delay(2000);
            self.title = newTitle;
        }
    }))

```

## Installation

* NPM: `npm install @geut/mst-drama`
* Yarn: `yarn add @geut/mst-drama`
