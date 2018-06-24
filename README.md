## 📦 Minipack-kr

*[minipack](https://github.com/ronami/minipack)을 한글로 번역한 문서입니다.*

> 자바스크립트 모듈 번들러를 만드는 간단한 예제입니다.

### 소개

프론트엔드 개발자들은 [Webpack](https://github.com/webpack/webpack), [Browserify](https://github.com/browserify/browserify), 그리고 [Parcel](https://github.com/parcel-bundler/parcel) 같은 툴과 함께 개발하는데 많은 시간을 쓰고 있습니다.

앞에서 언급한 툴의 동작방식을 이해하면, 코드를 작성할 때 더 좋은 결정을 할 수 있습니다. 또 우리의 코드가 어떤 과정을 통해 번들로 바뀌는지, 그 번들이 어떻게 만들어졌는지 이해하면 디버깅 하기 더 쉬울 것입니다.

이 프로젝트에서는 번들러가 어떻게 동작하는지에 대해 설명하겠습니다. 여기에는 심플하지만 정확한 번들러 구현 과정이 포함되어 있습니다. 또 코드와 함께 각각의 코드들이 어떤 역할을 하는지에 대한 주석도 달아뒀습니다.

### 멋지네요, 어디서부터 시작하면 되나요?

이 소스코드의 처음부분을 보세요: [src/minipack.js](src/minipack.js).

### 코드 실행 방법

먼저 의존성 파일들을 설치합니다:

```sh
$ npm install
```

그리고 우리의 스크립트를 실행시킵니다:

```sh
$ node src/minipack.js
```

### 추가 자료들

- [AST Explorer](https://astexplorer.net)
- [Babel REPL](https://babeljs.io/repl)
- [Babylon](https://github.com/babel/babel/tree/master/packages/babel-parser)
- [Babel Plugin Handbook](https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md)
- [Webpack: Modules](https://webpack.js.org/concepts/modules)

### 다른 언어로 읽을 수 있습니다.

- [English](https://github.com/ronami/minipack)
- [中文](https://github.com/chinanf-boy/minipack-explain)
