/**
 * 모듈 번들러들은 작은 코드 조각들을 웹 브라우저에서 실행될 수 있는 크고 복잡한 파일로 컴파일합니다.
 * 이 작은 조각들은 단지 자바스크립트 파일들일 뿐이며, 이들 사이의 종속성은 모듈 시스템에 의해 표현됩니다
 * (https://webpack.js.org/concepts/modules).
 *
 * 모듈 번들러들은 entry file 이라는 개념을 가지고 있습니다. 브라우저에 스크립트 태그를 몇개 추가하여
 * 실행하는 대신, 번들 담당자에게 응용 프로그램의 메인 파일이 무엇인지 알려 줍니다. 이 파일이 어플리케이션을
 * 실헹하는 진입점이 됩니다.
 *
 * 번들러는 entry file의 의존성을 분석합니다. 그리고 그 다음 파일의 의존성을 파악합니다.
 * 이 작업은 애플리케이션의 모든 모듈과 각 모듈이 서로 어떻게 의존하는지 파악할 때까지 반복됩니다.
 *
 * 이러한 프로젝트에 대한 이해를 종속성 그래프라 부릅니다.
 *
 * 이 예제에서는 종속성 그래프를 만들고 이 그래프를 사용하여 모든 모듈들을 하나의 번들로 패키징 합니다.
 * 그럼 시작해 보겠습니다 :)
 *
 * 참고: 이 예제는 매우 단순화되어 있습니다. 순환 참조, 캐싱 모듈, 파싱 최적화 등에 대한 내용은 생략
 * 하여 가능한가 단순하게 만들었습니다.
 */

const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const {transformFromAst} = require('babel-core');

let ID = 0;


// 우선 file path를 받는 함수를 생성하고
// 파일을 내용을 읽고, 종속성을 추출합니다.
function createAsset(filename) {

  // 파일의 내용을 문자열로 읽습니다.
  const content = fs.readFileSync(filename, 'utf-8');

  // 이제 이 파일이 어떤 파일에 종속되는지 알아보겠습니다. 우리는 import 문자열을 보고 의존성을
  // 파악할 수 있습니다 하지만, 이것은 단순한 접근법이어서, 대신에 자바스크립트 파서를 사용하겠습니다.

  // 자바스크립트 파서들은 자바스크립트 코드를 읽고 이해할 수 있도록 도와주는 툴입니다.
  // 파서는 AST(abstract syntax tree)라는 좀더 추상화된 모델을 생성합니다.
  //
  // AST에 대해 이해하려면 AST Explorer(https://astexplorer.net)을 꼭 보기를 강력하게 추천합니다.
  // AST가 어떻게 이루어져 있는지 확인할 수 있습니다.
  //
  // AST는 우리의 코드에 대해 많 정보를 가지고 있습니다. 우리는 쿼리를 이용하여
  // 우리의 코드가 하려는 일에 대해 이해할 수 있습니다.
  const ast = babylon.parse(content, {
    sourceType: 'module',
  });

  // 이 배열은 현재 모듈의 의존성을 상대 경로로 가지고 있을 것입니다.
  const dependencies = [];

  // 우리는 AST 순회를 통해 각각의 모듈들이 어떤 의존성을 가지고 있는지 이해하려 합니다.
  // 이것을 통해 AST안에서 모든 import keyword 선언을 파악할 수 있습니다.
  traverse(ast, {
    // ECMAScript 모듈들은 정적이므로 매우 파악하기 쉽습니다.이는 변수를 가져올 수 없거나 조건부로
    // 다른 모듈을 가져올 수 없음을 의미합니다. import 구분믈 볼 때 마다 카운팅을 하고 의존성을 가지고
    // 있는 것으로 간주 할 수 있습니다.
    ImportDeclaration: ({node}) => {
      // import 구문마다 dependencies 배열에 값을 추가합니다.
      dependencies.push(node.source.value);
    },
  });

  // 또한 간단한 카운터를 이용하여 이 모듈에 고유 식별자를 할당합니다.
  const id = ID++;

  // 우리는 일부 브라우저에서만 지원하는 ECMAScript module들이나 기능들을 사용할 가능성도 있습니다.
  // 우리가 만드는 번들이 모든 브라우저에서 돌아가도록 Babel을 이용해서 transpile할 수 있습니다
  // (https://babeljs.io 참고).
  //
  // `presets` 옵션은 Babel이 어떻게 우리 코드를 바꿀지에 대해 결정합니다. 우리는 `babel-preset-env`
  // 를 이용하여 대부분의 브라우저에서 우리의 코드를 사용할 수 있도록 바꾸도록 하겠습니다.
  const {code} = transformFromAst(ast, null, {
    presets: ['env'],
  });

  // 이 모듈에 대한 정보를 return 합니다.
  return {
    id,
    filename,
    dependencies,
    code,
  };
}

// 이제 단일 모듈의 종속성을 추출할 수 있으므로, entry file의 의존성을 추출하는 것부터 시작하겠습니다.
// 이 작업은 애플리케이션의 모든 모듈과 각 모듈이 서로 어떻게 의존하는지를 파악할 때까지 계속 진행할 것입니다.
// 이 작업을 의존성 그래프라 부릅니다.
function createGraph(entry) {
  // entry file부터 분석을 시작합니다.
  const mainAsset = createAsset(entry);

  // queue를 사용해서 모든 asset의 의존성을 분석하도록 하겠습니다. 이 작업을 위해
  // entry asset을 가지고 있는 배열을 정의합니다.
  const queue = [mainAsset];

  // 여기서 queue의 반복을 위해 `for ...of` 반복문을 사용합니다. 처음에는 queue가 asset을 하나만
  // 가지고 있지만 작업이 반복되는 동안에 새로운 asset들을 queue에 추가합니다. 이 반복문은 queue가
  // 비어질 때 까지 계속됩니다.
  for (const asset of queue) {

    // 모든 asset들은 의존성이 있는 모듈에 대한 상대경로들을 리스트로 가지고 있습니다. 우리는 그 리스트를
    // 순회하면서 `createAsset()`함수로 분석하고, 아래 객체를 통하여 모듈들의 의존성을 추척할 것입니다.
    asset.mapping = {};

    // 이것은 이 모듈이 있는 디렉토리입니다.
    const dirname = path.dirname(asset.filename);

    // 종속성에 대한 상대 경로 리스트를 순회합니다.
    asset.dependencies.forEach(relativePath => {
      // `createAsset()` 함수는 절대 경로가 필요합니다. dependencies 배열은 상대 경로를 가지고
      // 있는 배열입니다. 이러한 경로들은 모듈이 import된 file에 따라 상대적입니다. 따라서 부모 asset의
      // 경로를 이용해서 상대 경로를 절대경로로 바꿔야 합니다.
      const absolutePath = path.join(dirname, relativePath);

      // asset의 내용울 분석하고, 내용을 읽고, 의존성을 추출합니다.
      const child = createAsset(absolutePath);

      // `asset`의 의존성은 `child`에게 달려있습니다. 우리는 `mapping` 객체에 relativePath와 child.id를
      // 이용해서 관계를 표현할 수 있습니다.
      asset.mapping[relativePath] = child.id;

      // 마지막으로 child asset을 queue에 추가하여 구문 분석이 반복되도록 합니다.
      queue.push(child);
    });
  }

  // 이 시점에서 queue는 애플리케이션의 모든 모듈이 포함된 배열입니다. 이것이 우리가 그래프를 표현하는 방법입니다.
  return queue;
}

// 다음으로, 그래프를 이용하여 브라우저에서 실행할 수 있는 번들을 반환하는 함수를 정의합니다.
//
// 우리의 번들은 self-invoking(자신을 부를수 있는)함수를 가지고 있습니다.
//
// (function() {})()
//
// 이 함수는 하나의 인자만 받을 수 있습니다: 모둔 모듈의 정보를 가지고 있는 그래프.
function bundle(graph) {
  let modules = '';

  // 이 함수를 구성하기 전에 매개 변수로 전달할 객체를 만들겠습니다. 반드시 알아둬야할 것은 우리가 만드는
  // 스트링은 2개의 중괄호({})로 감싸져 있어야 한다는 것입니다. 우리는 다음과 같은 포멧으로 추가할
  // 것입니다: `key: value,`.
  graph.forEach(mod => {

    // 그래프안에 있는 모든 모듈들은 entry를 객체로 가지고 있습니다. 우리는 module의 id를
    // 값에 대한 키로 사용합니.(각 모듈마다 2개의 값이 있습니다.)
    //
    // 찻번째 값은 함수로 감싼 각 모듈의 코드입니다. 그 이유는 모듈의 scope를 지정해야 하기 때문입니다.
    // 한 모듈에서 변수를 정의하면 다른 모듈이나 글로벌 scope에 영향을 주지 않아야 합니다.
    //
    // transpiled된 모듈들은 CommonJS 모듈 시스템을 사용합니다:
    // 해당 모듈 시스템은 `require`, `module`, 그리고 `exports`를 통해 모듈화 합니다.
    // 이 키워드들은 일반적으로 브라우저에서 사용할수 없으므로, 우리의 함수를 이용하여 주입해야 합니다.
    //
    // 두번째 값은 모듈간의 의존성 매핑을 stringify하는 것입니다. 다음과 같은 객체입니다.
    // { './relative/path': 1 }.
    //
    // transplied된 우리의 모듈들이 상대경로와 합께 `require()`를 호출하기 때문입니다. 이 함수를 호출하면
    // 그래프에서 이 모듈의 상대 경로에 해당하는 모듈을 확인할 수 있습니다.
    modules += `${mod.id}: [
      function (require, module, exports) { ${mod.code} },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

  // 마지막으로 self-invoking 함수의 body를 만듭니다.
  //
  // `require()` 함수를 만들며 시작하겠습니다: 모듈 id를 받아 앞서 만든 모듈 오브젝트에서 `module`을
  // 찾습니다. function wrapper와 맵핑 객체를 얻기위해 two-value 객체를 이용합니다.
  //
  // 모듈의 코드는 모듈의 id들 대신 상대경로와 함께 `reuiqre()`함수를 호출합니다. 우리가 만든 require 함수는
  // id들을 받습니다. 또한 두개의 모듈은 동일한 상대 경로를 요구할 수 있지만, 실제론 두개의 다른 모듈들을
  // 의미하게 됩니다.
  //
  // 이 문제를 처리하기 위해서, `require` 함수가 사용할 수 있는 함수를 개발합니다.
  // 구체적으로, 모듈의 맵핑 객체를 이용해서 id를 이용해 상대 경로를 반환하는 방법을 사용합니다.
  // 매핑 객체는 특정 모듈에 대한 상대 경로와 모듈 id간의 매핑입니다.
  //
  // 마지막으로, CommonJS 스타일로 모듈을 요청 할 때, `exports` 객체로 바꾸어야 합니다. 이 코드에 의해 변경된
  // `exports` 객체는 `require()`로 반환됩니다.
  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports : {} };

        fn(localRequire, module, module.exports);

        return module.exports;
      }

      require(0);
    })({${modules}})
  `;

  // 결과를 반환합니다. 만세! :)
  return result;
}

const graph = createGraph('./example/entry.js');
const result = bundle(graph);

console.log(result);
