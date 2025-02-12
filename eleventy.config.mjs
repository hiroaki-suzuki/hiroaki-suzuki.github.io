import prettier from 'prettier';

const rootDir = 'tech-notebook/public';

export default async function (eleventyConfig) {
  // デフォルトのレイアウト定義
  eleventyConfig.addGlobalData('layout', '../../../layout/default.njk');

  // 画像のコピー
  eleventyConfig.addPassthroughCopy(`./images`);
  eleventyConfig.addPassthroughCopy(`${rootDir}/images`);

  // ライブラリのコピー
  eleventyConfig.addPassthroughCopy(`./libs`);

  // JavaScriptのコピー
  eleventyConfig.addPassthroughCopy(`./js`);

  // [[WikiLink]]の変換
  eleventyConfig.addTransform('transform-wiki-link', async function (content) {
    return content.replace(/\[\[(.*?)\]\]/g, '<a href="/$1/">$1</a>');
  });
  // 外部リンクを別タブで開くように変換
  eleventyConfig.addTransform('transform-external-link', async function (content) {
    return content.replace(/<a href="http/g, '<a target="_blank" href="http');
  });
  // 画像のパスを修正
  eleventyConfig.addTransform('transform-image-path', async function (content) {
    return content.replace(/src="images/g, 'src="/images');
  });
  // テーブルのスクロールのための親要素を追加
  eleventyConfig.addTransform('transform-table-scroll', async function (content) {
    const replacedContent = content.replace(/<table>/g, '<div class="table-scroll"><table>');
    return replacedContent.replace(/<\/table>/g, '</table></div>');
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
