import templateBuilder from "@babel/template";

function isModule(value, original) {
  const pattern = new RegExp(`^(${original}|${original}/.*)$`);
  return pattern.test(value);
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
  let root;
  let filterTags = [];
  let MAP_STYLED_VARS = {};
  let MAP_CSS_LIST = {};
  const emotionStyledImportDeclaration = buildImport();
  const emotionReactImportDeclaration = buildImportEmotionReact();

  function insertEmotionReact() {
    root.unshiftContainer("body", emotionReactImportDeclaration);
  }

  function insertEmotionStyled() {
    root.unshiftContainer("body", emotionStyledImportDeclaration);
  }

  return {
    visitor: {
      Program: {
        enter(path) {
          root = path;
        },
        exit() {
          /**
           * Only rename all css which are embedded to styled component
           * This will swap the css import from emotion/css to emotion/react
           */
          const cssListKeys = Object.keys(MAP_CSS_LIST);
          // console.log(">>", cssListKeys, MAP_STYLED_VARS);
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
          if (filterTags.length) {
            insertEmotionReact();
          }

          /**
           * Cleanups
           */
          MAP_CSS_LIST = {};
          MAP_STYLED_VARS = {};
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
        const cssVarName = path?.parent.id?.name;

        /**
         * Handle transpiled version of emotion css call...
         */
        if (
          path.scope.block.body?.body[0]?.argument?.callee?.name ===
          CSS_LOCAL_NAME
        ) {
          MAP_CSS_LIST[cssVarName] = { path };
        }

        /**
         * Handle normal css call with template expression
         */
        if (
          path.scope.block.body?.body[0]?.argument?.type ===
            "TaggedTemplateExpression" &&
          path.scope.block.body?.body[0]?.argument?.tag?.name === CSS_LOCAL_NAME
        ) {
          MAP_CSS_LIST[cssVarName] = { path };
        }
      },
      TaggedTemplateExpression(path) {
        if (path.node.tag.object?.name === STYLED_LOCAL_NAME) {
          path.node.quasi.expressions
            .map((exp) => exp.name)
            .forEach((expName) => {
              /**
               * Collects all template variables as candidates.
               */
              MAP_STYLED_VARS[expName] = 1;
            });
        }
      },
      ImportDeclaration(path) {
        const importPackageName = path.node.source.value;
        if (importPackageName === "emotion") {
          path.node.source = t.stringLiteral("@emotion/css");
        } else if (importPackageName === "react-emotion") {
          const cssLocalName = path.node.specifiers.find(
            (s) => s.imported?.name === "css"
          )?.local?.name;
          const styledDefaultNode = path.node.specifiers.find(
            (s) => s.type === "ImportDefaultSpecifier"
          );
          const styledLocalName = styledDefaultNode?.local?.name;

          /**
           * Anticipate custom local import name
           * e.g import { css as csx } or import styledz from...
           */
          CSS_LOCAL_NAME = cssLocalName || "css";
          STYLED_LOCAL_NAME = styledLocalName || "styled";

          const { hasStyled, nonStyled } = getStyled(path);
          if (nonStyled.length) {
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

          path.node.source = t.stringLiteral("@emotion/css");
        } else if (importPackageName === "@emotion/styled") {
          const styledDefaultNode = path.node.specifiers.find(
            (s) => s.type === "ImportDefaultSpecifier"
          );
          if (!styledDefaultNode) {
            /**
             * Only happen on integration, default is empty!
             * need to insert default import manually
             */
            path.node.specifiers.push({
              type: "ImportDefaultSpecifier",
              local: { type: "Identifier", name: STYLED_LOCAL_NAME },
            });
          } else if (styledDefaultNode.local) {
            styledDefaultNode.local.name = STYLED_LOCAL_NAME;
          }
        }
      },
      CallExpression(path) {
        /**
         * Collect all styled's arguments with form of styled(a, b, c, ...)
         */
        if (
          path.node.callee.name === STYLED_LOCAL_NAME &&
          path.node.arguments &&
          path.node.arguments.length
        ) {
          path.parent.arguments
            .filter((a) => a.type === "Identifier")
            .map((a) => a.name)
            .forEach((expName) => {
              MAP_STYLED_VARS[expName] = 1;
            });
          return;
        }

        REP.forEach(({ original }) => {
          const { node } = path;
          if (
            node.callee.name === "require" &&
            node.arguments &&
            node.arguments.length === 1 &&
            t.isStringLiteral(node.arguments[0]) &&
            isModule(node.arguments[0].value, original)
          ) {
            /**
             * @TODO
             * handle commonjs require('emotion')...
             */
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
