// import styled from "react-emotion";
// import { css } from "emotion";

// @ts-expect-error example only, don't install for real here
import styledz, { css } from "react-emotion";

export const normalCss = css`
  color: #fff;
`;

const BasicStyle = (props) => css`
  color: #000;
  font-size: ${props.fontSize};
`;

export const Cmp = styledz.div`
  ${BasicStyle}
  color: "pink";
`;

const SuperStyle = function SuperStyle(props) {
  return css(props.size, "style");
};

export const Text = styledz("div", {
  target: "evxom8o1",
})(SuperStyle, ";> span{outline:none;}");
