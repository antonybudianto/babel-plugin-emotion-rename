/* eslint-disable */

import { useState } from "react";

// import { cx } from "@emotion/css";
// import styled from "@emotion/styled";
// import { css } from "@emotion/react";

import styled, { css, cx } from "react-emotion";

import Main from "@/components/Main";
import {
  mainCx,
  titleCx,
  descriptionCx,
  codeCx,
  btnPrimary,
  btnSecondaryCx,
} from "./styles";
import Coba from "./Coba";

const calonPure = css("background: gray;");

const calon2Syt = css("background: gray;");

const calonSyt = css("background: gray;");

const sty2 = css`
  color: pink;
`;

const sty3 = css`
  ${sty2};
  background-color: pink;
`;

const Styled2 = styled.div`
  ${sty3};
`;

const Base = function Base(props) {
  return css(props.size, "style", calonSyt);
};

export const DummyStyled = styled("div", {
  target: "evxom8o1",
})(Base, calon2Syt, ";> span{outline:none;}");
