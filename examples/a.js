import styled, { css } from "react-emotion";

const normalCss = css`
  color: #fff;
`;
const abnormalCss = css`
  color: #000;
`;
const azt = 5;
const Cmp = styled.div`
  ${abnormalCss}
  width: ${azt};
  color: "pink";
`;
