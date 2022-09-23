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
  "dont replace require without binding",
  `
  var _emotion = _interopRequireWildcard(require("emotion"));
  `,
  `
  var _emotion = _interopRequireWildcard(require("emotion"));
`
);
