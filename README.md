![](https://github.com/matrx-transformation/matrx/workflows/Cypress%20tests/badge.svg)

[![Deploy status](https://dev.azure.com/matrx-transformation/MatrX/_apis/build/status/matrx%20-%201%20-%20CI)](https://dev.azure.com/matrx-transformation/MatrX/_build/latest?definitionId=2)

[![Coverage Status](https://coveralls.io/repos/github/matrx-transformation/matrx/badge.svg?branch=master)](https://coveralls.io/github/matrx-transformation/matrx?branch=master)

# `@matrx/matrx`

This is the repository for the [MatrX](https://matrx.co) product.

## License

All of the components found in the packages folder are open sourced under the MIT license but this main project is not open source licensed... eventhough the source is currently "open". Right now, it's current purpose is to provide end-to-end testing for the open sourced components. Feel free to look at the code in this main project as an example for how to use the open sourced components and of course, we'd love for you to use the open sourced components. Please contact us if you wish to use this parent project for commercial purposes.

## Notes for development

### Using external components

When using Svelte components installed from npm, such as [@sveltejs/svelte-virtual-list](https://github.com/sveltejs/svelte-virtual-list), Svelte needs the original component source (rather than any precompiled JavaScript that ships with the component). This allows the component to be rendered server-side, and also keeps your client-side app smaller.

Because of that, it's essential that the bundler doesn't treat the package as an *external dependency*. You can either modify the `external` option under `server` in [rollup.config.js](rollup.config.js) or the `externals` option in [webpack.config.js](webpack.config.js), or simply install the package to `devDependencies` rather than `dependencies`, which will cause it to get bundled (and therefore compiled) with your app:

```bash
npm install -D @sveltejs/svelte-virtual-list
```

