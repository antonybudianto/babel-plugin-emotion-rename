import * as babel from "@babel/core";
import assert from "assert-simple-tap";
import plugin from "./index";

const testGeneration = (message, code, expectedCode) => {
  const transformedCode = babel.transform(code, {
    babelrc: false,
    plugins: [[plugin, {}]],
  }).code;
  assert.equal(transformedCode.trim(), expectedCode.trim(), message);
};

testGeneration(
  "replace basic imports",
  `
import styled, { css } from "react-emotion";
`,
  `
import styled from "@emotion/styled";
import { css } from "@emotion/css";
`
);

testGeneration(
  "replace complex multiple imports",
  `
import styled, { css, keyframes } from "react-emotion";
`,
  `
import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/css";
`
);

testGeneration(
  "replace only one styled from react-emotion",
  `
import styled from "react-emotion";
`,
  `
import styled from "@emotion/styled";
`
);

testGeneration(
  "replace only one styled from emotion",
  `
import styled from "react-emotion";
`,
  `
import styled from "@emotion/styled";
`
);

testGeneration(
  "replace only one styled from emotion - cjs",
  `
const styled = require("react-emotion");
`,
  `
const styled = require("@emotion/styled");
`
);

testGeneration(
  "replace css import to emotion/react if used on styled - case1",
  `
import styled, { css } from "react-emotion";
const normalCss = css\`
  color: #fff; 
\`;

const BasicStyle = function BasicStyleCmp(props) {
  return css\`
    color: #000;
  \`;
};

const azt = 5;
const Cmp = styled.div\`
  \${BasicStyle}
  width: \${azt};
  color: 'pink';
\`;
`,
  `
import { css as css2 } from '@emotion/react';
import styled from "@emotion/styled";
import { css } from "@emotion/css";
const normalCss = css\`
  color: #fff; 
\`;

const BasicStyle = function BasicStyleCmp(props) {
  return css2\`
    color: #000;
  \`;
};

const azt = 5;
const Cmp = styled.div\`
  \${BasicStyle}
  width: \${azt};
  color: 'pink';
\`;
`
);

testGeneration(
  "dont replace require without binding",
  `
  var _emotion = _interopRequireWildcard(require("emotion"));
  `,
  `
  var _emotion = _interopRequireWildcard(require("emotion"));
`
);
