/* eslint-disable */

// import { cx } from "@emotion/css";
// import styled from "@emotion/styled";
// import { css } from "@emotion/react";

import styled, { css, cx } from "react-emotion";

/**
 * Should be kept as is!!!!
 */
const calonPure = css("background: gray;");

/**
 * Inside anonymous fn also should be css2!
 */
const calonSyt = css("background: pink;");
const Base = function Base(props) {
  return css(props.size, "style", calonSyt);
};

/**
 * All should output css2!!!
 */
const calon7Syt = css("background: blue;");
const calon9Syt = css("background: pink;", calon7Syt);
const calon3Syt = css("background: pink;", calon9Syt);
const calon2Syt = css("background: blue;");
export const DummyStyled = styled("div", {
  target: "evxom8o1",
})(Base, calon2Syt, calon3Syt, ";> span{outline:none;}");
