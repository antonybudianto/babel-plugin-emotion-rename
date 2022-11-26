import templateBuilder from "@babel/template";

/* eslint-disable no-param-reassign */
function isModule(value, original) {
  const pattern = new RegExp(`^(${original}|${original}/.*)$`);
  return pattern.test(value);
}

function replace(value, original, replacement) {
  const pattern = new RegExp(`^${original}`);
  return value.replace(pattern, replacement);
}

function getStyled(path) {
  if (!path.node.source.value === "react-emotion") {
    return {
      hasStyled: [],
      nonStyled: [],
    };
  }

  const hasStyled = path.node.specifiers.filter(
    (s) => s.type === "ImportDefaultSpecifier"
  );
  const nonStyled = path.node.specifiers.filter(
    (s) => s.type !== "ImportDefaultSpecifier"
  );
  return { hasStyled, nonStyled };
}

const buildImport = templateBuilder(`
  import styled from '@emotion/styled';
`);

const buildImportEmotionReact = templateBuilder(`
  import { css as css2 } from '@emotion/react';
`);

let CSS_LOCAL_NAME = "css";
let STYLED_LOCAL_NAME = "styled";

const REP = [
  { replacement: "@emotion/css", original: "emotion" },
  { replacement: "@emotion/css", original: "react-emotion" },
];

export default function visitor({ types: t }) {
  const source = (value, original, replacement) =>
    t.stringLiteral(replace(value, original, replacement));
  let root;
  let emotionStyledImported = false;
  let emotionReactImported = false;
  let filterTags = [];
  let MAP_STYLED_VARS = {};
  let MAP_CSS_LIST = {};
  // let cssList = [];
  const emotionStyledImportDeclaration = buildImport();
  const emotionReactImportDeclaration = buildImportEmotionReact();

  function insertEmotionReact() {
    root.unshiftContainer("body", emotionReactImportDeclaration);
    emotionReactImported = true;
  }

  function insertEmotionStyled() {
    root.unshiftContainer("body", emotionStyledImportDeclaration);
    emotionStyledImported = true;
  }

  return {
    visitor: {
      Program: {
        enter(path) {
          root = path;
        },
        exit(path) {
          /**
           * Only rename all css which are embedded to styled component
           * This will swap the css import from emotion/css to emotion/react
           */
          const cssListKeys = Object.keys(MAP_CSS_LIST);
          const cssList = cssListKeys.map((key) => {
            return {
              name: key,
              path: MAP_CSS_LIST[key].path,
            };
          });
          filterTags = cssList.filter((c) => MAP_STYLED_VARS[c.name] === 1);
          filterTags.forEach((t) => {
            if (t.path.scope.block.body.body[0]?.argument.tag) {
              t.path.scope.block.body.body[0].argument.tag.name = "css2";
            }
            if (t.path.scope.block.body.body[0]?.argument.callee) {
              t.path.scope.block.body.body[0].argument.callee.name = "css2";
            }
          });
          // console.log(filterTags);
          // console.log(">>>123", filterTags, MAP_STYLED_VARS);
          if (filterTags.length) {
            insertEmotionReact();
          }
        },
      },
      ArrowFunctionExpression(path) {
        /**
         * Collects all emotion `css` calls
         */
        if (
          path.node.body?.type === "TaggedTemplateExpression" &&
          path.node.body?.tag?.name === CSS_LOCAL_NAME
        ) {
          const cssVarName = path?.parent.id?.name;
          MAP_CSS_LIST[cssVarName] = { path };
        }
      },
      FunctionExpression(path) {
        /**
         * Collects all emotion `css` calls
         */
        if (
          path.scope.block.body?.body[0]?.argument?.type ===
            "TaggedTemplateExpression" &&
          path.scope.block.body?.body[0]?.argument?.tag?.name === CSS_LOCAL_NAME
        ) {
          const cssVarName = path?.parent.id?.name;
          MAP_CSS_LIST[cssVarName] = { path };
        }
      },
      TaggedTemplateExpression(path) {
        if (path.node.tag.object?.name === STYLED_LOCAL_NAME) {
          const templateVars = path.node.quasi.expressions
            .map((exp) => exp.name)
            .forEach((expName) => {
              /**
               * Collects all template variables as candidates.
               */
              MAP_STYLED_VARS[expName] = 1;
            });
        }
      },
      ImportDeclaration(path, state) {
        const isReactEmotionImport = path.node.source.value === "react-emotion";
        if (isReactEmotionImport) {
          const cssLocalName = path.node.specifiers.find(
            (s) => s.imported?.name === "css"
          )?.local?.name;
          const styledDefaultNode = path.node.specifiers.find(
            (s) => s.type === "ImportDefaultSpecifier"
          );
          const styledLocalName = styledDefaultNode.local?.name;

          /**
           * Anticipate custom local import name
           * e.g import { css as csx } or import styledz from...
           */
          CSS_LOCAL_NAME = cssLocalName || "css";
          STYLED_LOCAL_NAME = styledLocalName || "styled";

          const { hasStyled, nonStyled } = getStyled(path);
          if (nonStyled.length && isReactEmotionImport) {
            path.node.specifiers = path.node.specifiers.filter(
              (s) => s.type !== "ImportDefaultSpecifier"
            );
          }

          /**
           * if there is only exactly one default import styled
           * e.g. import styled from 'emotion/react-emotion'
           */
          if (!nonStyled.length && hasStyled.length) {
            path.node.source = t.stringLiteral("@emotion/styled");
            return;
          }

          if (hasStyled.length) {
            insertEmotionStyled();
          }

          REP.forEach(({ original, replacement }) => {
            const { value } = path.node.source;
            if (isModule(value, original)) {
              path.node.source = source(value, original, replacement);
            }
          });
        } else if (path.node.source.value === "@emotion/styled") {
          const styledDefaultNode = path.node.specifiers.find(
            (s) => s.type === "ImportDefaultSpecifier"
          );
          styledDefaultNode.local.name = STYLED_LOCAL_NAME;
        }
      },
      CallExpression(path, state) {
        REP.forEach(({ original, replacement }) => {
          const { node } = path;
          if (
            node.callee.name === "require" &&
            node.arguments &&
            node.arguments.length === 1 &&
            t.isStringLiteral(node.arguments[0]) &&
            isModule(node.arguments[0].value, original)
          ) {
            if (
              path.scope.bindings.styled &&
              /(react-)?emotion/.test(node.arguments[0].value)
            ) {
              path.node.arguments = [t.stringLiteral("@emotion/styled")];
              return;
            }

            // path.node.arguments = [
            //   source(node.arguments[0].value, original, replacement),
            // ];
          }
        });
      },
    },
  };
}
