import templateBuilder from "@babel/template";
import type { Path, Tag } from "./types";

function isModule(value, original) {
  const pattern = new RegExp(`^(${original}|${original}/.*)$`);
  return pattern.test(value);
}

function getStyled(path: Path) {
  if (
    path.node.source.value !== "react-emotion" &&
    path.node.source.value !== "emotion"
  ) {
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
  import styled from "@emotion/styled";
`);

const buildImportEmotionReact = templateBuilder(`
  import { css as css2 } from "@emotion/react";
`);

let CSS_LOCAL_NAME = "css";
let STYLED_LOCAL_NAME = "styled";

const REP = [
  { replacement: "@emotion/css", original: "emotion" },
  { replacement: "@emotion/css", original: "react-emotion" },
];

export default function visitor({ types: t }) {
  let root;
  let filterTags: Tag[] = [];
  let MAP_STYLED_VARS = {};
  let MAP_CSS_LIST = {};
  let ALL_STYLED_NAMES = {};
  let ALL_CSS_NAMES = {};
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
          // console.log(`
          //   ${JSON.stringify(ALL_STYLED_NAMES, null, 2)}
          //   =====
          //   ${JSON.stringify(ALL_CSS_NAMES, null, 2)}
          // `);

          const traverseCss = (cssName) => {
            if (!ALL_CSS_NAMES[cssName]) {
              return;
            }
            let cssArgs = Object.keys(ALL_CSS_NAMES[cssName]);
            if (!cssArgs.length) {
              return;
            }

            /**
             * if css var is within an anon function
             */
            if (MAP_CSS_LIST[cssName]) {
              if (MAP_CSS_LIST[cssName].path.node?.tag) {
                MAP_CSS_LIST[cssName].path.node.tag.name = "css2";
              }
            }
            cssArgs.forEach((arg) => {
              if (ALL_CSS_NAMES[cssName][arg] === 1) {
                MAP_STYLED_VARS[arg] = 1;
                traverseCss(arg);
              }
            });
          };

          /**
           * Iterate all styled and recursively rename css import
           */
          const styledKeys = Object.keys(ALL_STYLED_NAMES);
          styledKeys.map((k) => {
            const idsKeys = Object.keys(ALL_STYLED_NAMES[k]);
            idsKeys.forEach((id) => {
              traverseCss(id);
            });
          });

          const cssList = cssListKeys.map((key) => {
            return {
              name: key,
              path: MAP_CSS_LIST[key].path,
              _type: MAP_CSS_LIST[key]._type,
            };
          });
          filterTags = cssList.filter((c) => MAP_STYLED_VARS[c.name] === 1);
          filterTags.forEach((t) => {
            if (t._type === "callee") {
              t.path.node.callee.name = "css2";
              return;
            }
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

          // console.log(">>", MAP_STYLED_VARS);
          /**
           * Cleanups
           */
          MAP_CSS_LIST = {};
          MAP_STYLED_VARS = {};
          ALL_STYLED_NAMES = {};
          ALL_CSS_NAMES = {};
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
        if (path.node?.tag?.name === CSS_LOCAL_NAME) {
          const taggedCssVarName =
            path?.parentPath?.scope?.path?.container?.id?.name;
          if (!taggedCssVarName) {
            return;
          }
          const taggedVars = path.node.quasi.expressions
            .filter((exp) => exp.type === "Identifier")
            .map((exp) => exp.name);
          const taggedMap = taggedVars.reduce((a, c) => ({ ...a, [c]: 1 }), {});

          MAP_CSS_LIST[taggedCssVarName] = { path, _type: "tte" };
          ALL_CSS_NAMES[taggedCssVarName] = taggedMap;
        } else if (path.node.tag.object?.name === STYLED_LOCAL_NAME) {
          const taggedStyledVars = path.node.quasi.expressions
            .filter((exp) => exp.type === "Identifier")
            .map((exp) => exp.name);
          const taggedStyledIdsMap = taggedStyledVars.reduce(
            (a, c) => ({ ...a, [c]: 1 }),
            {}
          );
          const taggedStyledName = path?.parentPath?.node?.id?.name;
          if (taggedStyledName) {
            ALL_STYLED_NAMES[taggedStyledName] = taggedStyledIdsMap;
          }

          taggedStyledVars.forEach((expName) => {
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
        } else if (
          importPackageName === "react-emotion" ||
          importPackageName == "emotion"
        ) {
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
          const styledVarName = path?.parentPath?.parent?.id?.name;
          const styledIdsList = path.parent.arguments
            .filter((a) => a.type === "Identifier")
            .map((a) => a.name);
          const styledIdsMap = styledIdsList.reduce(
            (a, c) => ({ ...a, [c]: 1 }),
            {}
          );
          if (styledVarName) {
            ALL_STYLED_NAMES[styledVarName] = styledIdsMap;
          }
          styledIdsList.forEach((expName) => {
            MAP_STYLED_VARS[expName] = 1;
          });
          return;
        }

        if (
          path.node.callee.name === CSS_LOCAL_NAME &&
          path.node.arguments &&
          path.node.arguments.length
        ) {
          const cssIdsList = path.node.arguments
            .filter((a) => a.type === "Identifier")
            .map((a) => a.name);
          const cssIdsMap = cssIdsList.reduce((a, c) => ({ ...a, [c]: 1 }), {});
          const fnName = path?.parentPath?.scope?.block?.id?.name;
          if (path.parent.type === "ReturnStatement" && fnName) {
            ALL_CSS_NAMES[fnName] = cssIdsMap;
            return;
          }
          const cssVarName = path.parent?.id?.name;
          if (cssVarName) {
            ALL_CSS_NAMES[cssVarName] = cssIdsMap;
          }
          if (path.parent?.id?.type === "Identifier") {
            MAP_CSS_LIST[path.parent?.id?.name] = { _type: "callee", path };
          }
          return;
        }

        /**
         * Handle rename require('emotion') -> require('@emotion/css')
         */
        const { node } = path;
        const isRequire =
          node.callee.name === "require" &&
          node.arguments &&
          node.arguments.length === 1 &&
          t.isStringLiteral(node.arguments[0]);
        REP.forEach(({ original }) => {
          if (isRequire && isModule(node.arguments[0].value, original)) {
            path.node.arguments = [t.stringLiteral("@emotion/css")];
          }
        });
      },
    },
  };
}
