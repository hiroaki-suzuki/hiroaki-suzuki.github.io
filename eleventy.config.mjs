import prettier from 'prettier';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import { DateTime } from 'luxon';
import pluginSitemap from '@quasibit/eleventy-plugin-sitemap';

const CONFIG = {
  rootDir: 'tech-notebook/public',
  defaultLayout: '../../../layout/default.njk',
  site: {
    language: 'ja',
    title: 'Hiroaki SuzukiのWeb技術ノート',
    subtitle: 'Hiroaki SuzukiのWeb技術ノート',
    base: 'https://hiroaki-suzuki.github.io',
    author: 'Hiroaki Suzuki',
  },
  rss: {
    limit: 20,
  },
  prettier: {
    parser: 'html',
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
  },
};

function setUpSitemap(eleventyConfig) {
  // Sitemap プラグイン
  eleventyConfig.addPlugin(pluginSitemap, {
    sitemap: {
      hostname: CONFIG.site.base,
    },
  });
}

// RSS フィード設定
function setupRSSFeed(eleventyConfig) {
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    collection: {
      name: 'all',
      limit: CONFIG.rss.limit,
    },
    metadata: {
      language: CONFIG.site.language,
      title: CONFIG.site.title,
      subtitle: CONFIG.site.subtitle,
      base: CONFIG.site.base,
      author: {
        name: CONFIG.site.author,
      },
    },
  });
}

// 静的ファイルのコピー設定
function setupPassthroughCopy(eleventyConfig) {
  const assets = ['./images', `${CONFIG.rootDir}/images`, './libs', './js'];
  assets.forEach((asset) => {
    eleventyConfig.addPassthroughCopy(asset);
  });
}

// コンテンツ変換設定
function setupContentTransforms(eleventyConfig, globalLinkMap) {
  // WikiLink変換
  eleventyConfig.addTransform('transform-wiki-link', async function (content) {
    return content.replace(/\[\[(.*?)\]\]/g, (match, linkText) => {
      // リンクマップから対応するURLを検索
      const targetUrl = globalLinkMap[linkText];
      if (targetUrl) {
        return `<a href="${targetUrl}">${linkText}</a>`;
      }

      // マップにない場合は従来通り
      return `<a href="/${linkText}/">${linkText}</a>`;
    });
  });

  // 外部リンク変換
  eleventyConfig.addTransform('transform-external-link', async function (content) {
    return content.replace(/<a href="http/g, '<a target="_blank" href="http');
  });

  // 画像パス修正
  eleventyConfig.addTransform('transform-image-path', async function (content) {
    return content.replace(/src="images/g, 'src="/images');
  });

  // テーブルスクロール対応
  eleventyConfig.addTransform('transform-table-scroll', async function (content) {
    const withScrollWrapper = content.replace(/<table>/g, '<div class="table-scroll"><table>');
    return withScrollWrapper.replace(/<\/table>/g, '</table></div>');
  });

  // HTML整形
  eleventyConfig.addTransform('prettier', async (content, outputPath) => {
    if (outputPath?.endsWith('.html')) {
      return prettier.format(content, CONFIG.prettier);
    }
    return content;
  });
}

// コレクション設定
function setupCollections(eleventyConfig, globalLinkMap) {
  // タイトル→permalinkマッピングコレクション
  eleventyConfig.addCollection('linkMap', function (collectionApi) {
    const linkMap = {};

    collectionApi.getAll().forEach((item) => {
      // ファイル名からタイトルを抽出（拡張子除去）
      const fileName = item.inputPath.split('/').pop().replace('.md', '');

      // permalinkを取得、なければエラー
      if (!item.data.permalink) {
        throw new Error(`permalink が設定されていません: ${fileName}`);
      }

      let targetUrl = `/${item.data.permalink}`;
      if (!targetUrl.endsWith('/')) targetUrl += '/';

      // ファイル名とタイトルの両方をキーとして登録
      linkMap[fileName] = targetUrl;
      if (item.data.title && item.data.title !== fileName) {
        linkMap[item.data.title] = targetUrl;
      }

      // グローバルリンクマップにも追加
      globalLinkMap[fileName] = targetUrl;
      if (item.data.title && item.data.title !== fileName) {
        globalLinkMap[item.data.title] = targetUrl;
      }
    });

    return linkMap;
  });

  eleventyConfig.addCollection('postsByDate', function (collectionApi) {
    return collectionApi
      .getAll()
      .filter((item) => {
        // ホームページとタグページを除外
        return !item.inputPath.includes('ホーム.md') && !item.inputPath.includes('tags.njk');
      })
      .sort((a, b) => {
        // 更新日降順（新しい順）
        const dateA = a.data.updated || a.data.created || a.date;
        const dateB = b.data.updated || b.data.created || b.date;
        return new Date(dateB) - new Date(dateA);
      });
  });

  eleventyConfig.addCollection('tagList', function (collectionApi) {
    const tagCounts = {};

    // タグ使用回数の集計
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // タグのソートと整形
    return Object.keys(tagCounts)
      .sort()
      .map((tag) => ({
        label: tag.replace('_', ' '),
        link: tag,
        count: tagCounts[tag],
      }));
  });
}

// フィルター設定
function setupFilters(eleventyConfig) {
  eleventyConfig.addNunjucksFilter('dateFormat', function (dateValue, format = 'yyyy-MM-dd HH:mm') {
    if (!dateValue) return '';

    let dt;

    if (typeof dateValue === 'string') {
      dt = DateTime.fromISO(dateValue);
      if (!dt.isValid) {
        dt = DateTime.fromFormat(dateValue, 'yyyy-MM-dd');
      }
    } else if (dateValue instanceof Date) {
      dt = DateTime.fromISO(dateValue.toISOString(), {
        zone: 'Asia/Tokyo',
        setZone: true,
      });
    } else if (dateValue?.toFormat) {
      dt = dateValue;
    } else {
      dt = DateTime.fromJSDate(new Date(dateValue));
    }

    return dt.isValid ? dt.toFormat(format) : String(dateValue);
  });

  eleventyConfig.addNunjucksFilter('striptags', function (content) {
    if (typeof content !== 'string') return '';
    // HTMLタグを除去し、HTMLエンティティをデコード、WikiLinkの括弧のみ除去
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/\[\[([^\]]*)\]\]/g, '$1')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  });

  eleventyConfig.addNunjucksFilter('truncate', function (content, length = 50) {
    if (typeof content !== 'string') return '';
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  });

  eleventyConfig.addLiquidFilter('striptags', function (content) {
    if (typeof content !== 'string') return '';
    // HTMLタグを除去し、HTMLエンティティをデコード、WikiLinkの括弧のみ除去
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/\[\[([^\]]*)\]\]/g, '$1')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  });

  eleventyConfig.addLiquidFilter('truncate', function (content, length = 50) {
    if (typeof content !== 'string') return '';
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  });
}

// メイン設定関数
export default async function (eleventyConfig) {
  // リンクマップをグローバル変数として設定
  let globalLinkMap = {};

  // グローバルデータ設定
  eleventyConfig.addGlobalData('layout', CONFIG.defaultLayout);

  // 各機能の設定
  setUpSitemap(eleventyConfig);
  setupRSSFeed(eleventyConfig);
  setupPassthroughCopy(eleventyConfig);
  setupContentTransforms(eleventyConfig, globalLinkMap);
  setupCollections(eleventyConfig, globalLinkMap);
  setupFilters(eleventyConfig);

  return {
    dir: {
      input: CONFIG.rootDir,
    },
  };
}
