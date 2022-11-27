# babel-plugin-emotion-rename [![npm][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/babel-plugin-emotion-rename.svg?style=flat
[npm-url]: https://npmjs.org/package/babel-plugin-emotion-rename

> Automatically rename legacy emotion imports to new supported emotion versions

## How it works

- Scan all imports, try to rename legacy import from `emotion` / `react-emotion` to `@emotion/css`
- If it used styled, add additional new import `@emotion/styled`
- If the emotion.css is used within styled, swap with css method from `@emotion/react`

### Compatibility:

- Legacy v9 to v11
- Some things may not be working, please checkout with caution!

## Install

```
$ npm install --save-dev babel-plugin-emotion-rename
```

## babelrc

```js
{
  "plugins": ["babel-plugin-emotion-rename"]
}
```

## Codemod

- Codemod CLI coming soon, so that we can drop runtime transpilation step.

## License

MIT
