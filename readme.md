# babel-plugin-emotion-rename [![npm][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/babel-plugin-emotion-rename.svg?style=flat
[npm-url]: https://npmjs.org/package/babel-plugin-emotion-rename

> Automatically rename legacy emotion imports to new supported emotion versions

[Demo repository with Webpack+Babel+React+Emotion11](https://github.com/antonybudianto/demo-emotion)

## How it works

- Scan all imports, try to rename legacy import from `emotion` / `react-emotion` to `@emotion/css`
- If it used styled, add additional new import `@emotion/styled`
- If the emotion.css is used within styled, swap with css method from `@emotion/react`

### Compatibility:

- Legacy v9 to v11
- Some things may not be working, please checkout with caution!
- If you're using SSR, It's very recommended to also implement `@emotion/css` SSR integration as well for smoother migration

### Known issues:

- If you import a variable from another file, and that variable is used within styled/css tagged template literal, then it's currently impossible to statically analyze and rename the import

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
