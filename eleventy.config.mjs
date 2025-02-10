import prettier from 'prettier';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';

const rootDir = 'tech-notebook/public';

export default async function (eleventyConfig) {
  // プラグインの追加
  eleventyConfig.addPlugin(syntaxHighlight);

  // デフォルトのレイアウト定義
  eleventyConfig.addGlobalData('layout', '../../../layout/default.njk');

  // 画像のコピー
  eleventyConfig.addPassthroughCopy(`./images`);
  eleventyConfig.addPassthroughCopy(`${rootDir}/images`);

  // [[WikiLink]]の変換
  eleventyConfig.addTransform('transform-wiki-link', async function (content) {
    return content.replace(/\[\[(.*?)\]\]/g, '<a href="/$1/">$1</a>');
  });

  // HTMLの整形
  eleventyConfig.addTransform('prettier', async (content, outputPath) => {
    if (outputPath?.endsWith('.html')) {
      return prettier.format(content, {
        parser: 'html',
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
      });
    }
    return content;
  });

  // タグリストの生成
  eleventyConfig.addCollection('tagList', function (collectionApi) {
    const tagList = new Set();
    collectionApi.getAll().map((item) => {
      if (item.data.tags) {
        item.data.tags.map((tag) => tagList.add(tag));
      }
    });

    return tagList;
  });

  return {
    dir: {
      input: rootDir,
    },
  };
}
