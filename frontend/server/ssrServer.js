import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { HelmetProvider } from 'react-helmet-async';

const require = createRequire(import.meta.url);

require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: 'commonjs',
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  ignore: [/node_modules/],
  cache: false,
});

const { default: AppShell } = require('../src/AppShell.jsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, 'build');
const templatePath = path.join(buildDir, 'index.html');
const port = Number(process.env.PORT || 4173);

const app = express();

app.use(express.static(buildDir, { index: false }));

app.get('*', async (req, res, next) => {
  try {
    const template = await fs.readFile(templatePath, 'utf8');
    const helmetContext = {};

    const appHtml = renderToString(
      React.createElement(
        HelmetProvider,
        { context: helmetContext },
        React.createElement(StaticRouter, { location: req.originalUrl }, React.createElement(AppShell)),
      ),
    );

    const { helmet } = helmetContext;

    const html = template
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
      .replace(
        '</head>',
        `${helmet?.title?.toString() ?? ''}${helmet?.meta?.toString() ?? ''}${helmet?.link?.toString() ?? ''}</head>`,
      );

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`SSR server listening on http://localhost:${port}`);
});
