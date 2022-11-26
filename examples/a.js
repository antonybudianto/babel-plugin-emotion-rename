import React from "react";
import styled, { css } from "react-emotion";

const normalCss = css`
  color: #fff;
`;
const BasicStyle = function BasicStyleCmp(props) {
  return css`
    color: #000;
  `;
};
const azt = 5;
const Cmp = styled.div`
  ${BasicStyle}
  width: ${azt};
  color: "pink";
`;
