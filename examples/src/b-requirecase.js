"use strict";

/**
 * Pre-transpiled use-case...
 */

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.styGrid = exports.styColumn = void 0;

/**
 * should be "@emotion/css"
 */
var _emotion = require("emotion");

const styGrid = (colGutter) =>
  /*#__PURE__*/ (0, _emotion.css)(
    "display:flex;align-items:flex-start;margin-left:-",
    colGutter,
    "px;width:auto;"
  );

exports.styGrid = styGrid;

const styColumn = ({ colGutter, colWidth }) =>
  /*#__PURE__*/ (0, _emotion.css)(
    "width:",
    colWidth,
    "%;display:inline-block;padding-left:",
    colGutter,
    "px;background-clip:padding-box;> div{margin-bottom:",
    colGutter,
    "px;}"
  );

exports.styColumn = styColumn;
//# sourceMappingURL=styles.js.map
