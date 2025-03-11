import prettier from 'prettier';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';

const rootDir = 'tech-notebook/public';

export default async function (eleventyConfig) {
  // RSSフィードの生成
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    collection: {
      name: 'all',
      limit: 20,
    },
    metadata: {
      language: 'ja',
      title: 'Hiroaki SuzukiのWeb技術ノート',
      subtitle: 'Hiroaki SuzukiのWeb技術ノート',
      base: 'https://hiroaki-suzuki.github.io',
      author: {
        name: 'Hiroaki SUzuki',
      },
    },
  });

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
    const tagCounts = {};

    // 各アイテムのタグを走査してカウント
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // キー（タグ名）でソート
    const sortedTags = Object.keys(tagCounts).sort();

    // ソート済みのタグ毎に { tag, count } のオブジェクトを作成して配列で返す
    return sortedTags.map((tag) => ({
      label: tag.replace('_', ' '),
      link: tag,
      count: tagCounts[tag],
    }));
  });

  return {
    dir: {
      input: rootDir,
    },
  };
}
