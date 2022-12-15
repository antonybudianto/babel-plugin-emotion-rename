/* eslint-disable */

// import { cx } from "@emotion/css";
// import styled from "@emotion/styled";
// import { css } from "@emotion/react";

import styled, { css, cx } from "react-emotion";

/**
 * Should be kept as is!!!!
 */
const calonPure = css`
  background: gray;
`;

/**
 * should still be `css`
 */
const BasePure = (props) => {
  return css`
    width: ${props.size};
  `;
};

/**
 * Inside anonymous fn also should be css2!
 */
const calonSyt = css`
  background: pink;
`;

const Base = (props) => {
  return css`
    ${calonSyt};
    width: ${props.size};
  `;
};

/**
 * All should output css2!!!
 */
const calon7Syt = css`
  background: blue;
`;
const calon9Syt = css`
  ${calon7Syt};
  background: pink;
`;
const calon3Syt = css`
  ${calon9Syt};
  background: blue;
`;
const calon2Syt = css`
  background: blue;
`;
export const DummyStyled = styled.div`
  ${Base};
  ${calon2Syt};
  ${calon3Syt};
  color: "pink";
`;
