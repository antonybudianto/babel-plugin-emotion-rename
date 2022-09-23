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

const REP = [
  { replacement: "@emotion/css", original: "emotion" },
  { replacement: "@emotion/css", original: "react-emotion" },
];

export default function visitor({ types: t }) {
  const source = (value, original, replacement) =>
    t.stringLiteral(replace(value, original, replacement));
  let root;
  let imported = false;
  const importDeclaration = buildImport();

  return {
    visitor: {
      Program(path) {
        root = path;
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
