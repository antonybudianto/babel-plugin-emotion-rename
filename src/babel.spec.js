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
  "replace only one css from react-emotion - cjs",
  `
const { css } = require("react-emotion");
`,
  `
const {
  css
} = require("@emotion/css");`
);

testGeneration(
  "replace only one css from emotion - cjs",
  `
const { css } = require("emotion");
`,
  `
const {
  css
} = require("@emotion/css");`
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

export const Cmp = styled.div\`
  \${BasicStyle}
  color: "pink";
\`;

const SuperStyle = function SuperStyle(props) {
  return css(props.size, "style");
};

export const Text = styled("div", {
  target: "evxom8o1",
})(SuperStyle, ";> span{outline:none;}");

`,
  `
import { css as css2 } from "@emotion/react";
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
export const Cmp = styled.div\`
  \${BasicStyle}
  color: "pink";
\`;
const SuperStyle = function SuperStyle(props) {
  return css2(props.size, "style");
};
export const Text = styled("div", {
  target: "evxom8o1"
})(SuperStyle, ";> span{outline:none;}");
`
);
