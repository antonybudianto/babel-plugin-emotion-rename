// import styled from "react-emotion";
// import { css } from "emotion";

import styled, { css } from "react-emotion";

export const normalCss = css`
  color: #fff;
`;

const BasicStyle = (props) => css`
  color: #000;
`;

export const Cmp = styled.div`
  ${BasicStyle}
  color: "pink";
`;
