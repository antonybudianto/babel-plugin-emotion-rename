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
  const hasStyled = path.node.specifiers.filter(
    (s) => s.local.name === "styled"
  );
  const nonStyled = path.node.specifiers.filter(
    (s) => s.local.name !== "styled"
  );
  return { hasStyled, nonStyled };
}

const buildImport = templateBuilder(`
  import styled from '@emotion/styled';
`);

const buildImportEmotionReact = templateBuilder(`
  import { css as css2 } from '@emotion/react';
`);

const REP = [
  { replacement: "@emotion/css", original: "emotion" },
  { replacement: "@emotion/css", original: "react-emotion" },
];

export default function visitor({ types: t }) {
  const source = (value, original, replacement) =>
    t.stringLiteral(replace(value, original, replacement));
  let root;
  let imported = false;
  let listTags = [];
  let MAP_STYLED = {};
  let emotionReactImported = false;
  const importDeclaration = buildImport();
  const emotionReactImportDeclaration = buildImportEmotionReact();

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
          const res = listTags.filter((t) => MAP_STYLED[t.name]);
          res.forEach((t) => {
            t.path.node.declarations[0].init.tag.name = "css2";
          });
          if (!emotionReactImported && res.length) {
            root.unshiftContainer("body", emotionReactImportDeclaration);
            emotionReactImported = true;
          }
        },
      },
      VariableDeclaration(path) {
        // if (path.node.declarations[0].id.name === "abnormalCss") {
        //   console.log("vd1", path.node.declarations[0].id.name);
        //   console.log("vd2", path.node.declarations[0].init.tag.name);
        //   console.log("vd3", path.node.declarations[0]);
        // }
        if (
          !path.node.declarations.length ||
          !path.node.declarations[0].id ||
          !path.node.declarations[0].init.tag
        ) {
          return;
        }
        const varName = path.node.declarations[0].id.name;
        const tagName = path.node.declarations[0].init.tag.name;
        if (tagName === "css" && path.scope.bindings.styled) {
          /**
           * Looks for every variables that call emotion css usage.
           * Need to list all of them for now, since
           * it cannot check the template literal reference from this callback,
           * it needs Identifier callback for that
           */
          listTags.push({ name: varName, path });
          console.log("emotion/css!!!", varName);
        }
      },
      Identifier(path, parent) {
        const type = path.parent.type;
        const nodeName = path.node.name;
        // console.log(type, nodeName);

        /**
         * Look for template literal on styled with css embed
         */
        if (["TemplateLiteral"].indexOf(type) !== -1) {
          if (path.scope.bindings.styled) {
            console.log("foundOnTemplateLiteral!!!", nodeName);
            MAP_STYLED[nodeName] = true;
          }
        }
      },
      ImportDeclaration(path, state) {
        const { hasStyled, nonStyled } = getStyled(path);

        if (nonStyled.length) {
          path.node.specifiers = path.node.specifiers.filter(
            (s) => s.local.name !== "styled"
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

        if (hasStyled.length && !imported) {
          imported = true;
          root.unshiftContainer("body", importDeclaration);
        }

        REP.forEach(({ original, replacement }) => {
          const { value } = path.node.source;
          if (isModule(value, original)) {
            path.node.source = source(value, original, replacement);
          }
        });
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
