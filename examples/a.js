// import styled from "react-emotion";
// import { css } from "emotion";

import styledz, { css } from "react-emotion";
// import { css } from "@emotion/react";

export const normalCss = css`
  color: #fff;
`;

const BasicStyle = (props) => css`
  color: #000;
`;

var SuperStyle = function SuperStyle(props) {
  return css(focusStyle, _ref21);
};

export var Text = styledz("div", {
  target: "evxom8o1",
})(SuperStyle, ";> span{outline:none;}");

export const Cmp = styledz.div`
  ${BasicStyle}
  color: "pink";
`;
