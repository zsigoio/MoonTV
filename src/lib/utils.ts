/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import he from 'he';
import Hls from 'hls.js';

// ==================== 代理类型定义 ====================

export type DoubanProxyType =
  | 'direct'
  | 'cors-proxy-zwei'
  | 'cmliussss-cdn-tencent'
  | 'cmliussss-cdn-ali'
  | 'cors-anywhere'
  | 'custom';

export type ImageProxyType =
  | 'server'
  | 'cmliussss-cdn-tencent'
  | 'cmliussss-cdn-ali'
  | 'custom';

export const DOUBAN_PROXY_PRESETS: Record<
  DoubanProxyType,
  { label: string; url: string }
> = {
  direct: { label: '服务端代理（直连豆瓣）', url: '' },
  'cors-proxy-zwei': {
    label: 'CORS 代理 (Zwei)',
    url: 'https://ciao-cors.is-an.org/',
  },
  'cmliussss-cdn-tencent': {
    label: 'CDN 加速 (腾讯云)',
    url: 'https://m.douban.cmliussss.net',
  },
  'cmliussss-cdn-ali': {
    label: 'CDN 加速 (阿里云)',
    url: 'https://m.douban.cmliussss.com',
  },
  'cors-anywhere': {
    label: '公共 CORS 代理',
    url: 'https://cors-anywhere.com/',
  },
  custom: { label: '自定义', url: '' },
};

export const IMAGE_PROXY_PRESETS: Record<
  ImageProxyType,
  { label: string; url: string }
> = {
  server: { label: '服务端代理', url: '/api/image-proxy?url=' },
  'cmliussss-cdn-tencent': {
    label: 'CDN (腾讯云)',
    url: 'img.doubanio.cmliussss.net',
  },
  'cmliussss-cdn-ali': {
    label: 'CDN (阿里云)',
    url: 'img.doubanio.cmliussss.com',
  },
  custom: { label: '自定义', url: '' },
};

// ==================== 获取当前的代理类型 ====================

export function getDoubanProxyTypeFromStorage(): DoubanProxyType {
  if (typeof window === 'undefined') return 'direct';
  const t = localStorage.getItem('doubanProxyType') as DoubanProxyType | null;
  if (t && t in DOUBAN_PROXY_PRESETS) return t;
  return 'direct';
}

function getImageProxyTypeFromStorage(): ImageProxyType {
  if (typeof window === 'undefined') return 'server';
  const t = localStorage.getItem('imageProxyType') as ImageProxyType | null;
  if (t && t in IMAGE_PROXY_PRESETS) return t;
  return 'server';
}

function getDoubanCustomUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('doubanProxyCustomUrl') || '';
}

function getImageCustomUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('imageProxyCustomUrl') || '';
}

// ==================== 兼容旧版本（纯 URL 模式） ====================

function isLegacyDoubanProxyEnabled(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem('enableDoubanProxy');
  if (val === null) return null;
  return JSON.parse(val) as boolean;
}

function isLegacyImageProxyEnabled(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem('enableImageProxy');
  if (val === null) return null;
  return JSON.parse(val) as boolean;
}

function getLegacyDoubanUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('doubanProxyUrl');
  return url?.trim() ? url.trim() : null;
}

function getLegacyImageUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('imageProxyUrl');
  return url?.trim() ? url.trim() : null;
}

// ==================== 豆瓣数据代理 ====================

export function getDoubanProxyUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 先读新版 type 配置
  const type = getDoubanProxyTypeFromStorage();
  if (type === 'direct') return null;
  if (type === 'custom') {
    const customUrl = getDoubanCustomUrl();
    if (customUrl) return customUrl;
  }
  const preset = DOUBAN_PROXY_PRESETS[type];
  if (preset?.url) return preset.url;

  // 兼容旧版
  const legacyEnabled = isLegacyDoubanProxyEnabled();
  if (legacyEnabled === false) return null;
  const legacyUrl = getLegacyDoubanUrl();
  if (legacyUrl) return legacyUrl;

  // 服务端默认值
  const serverUrl = (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY;
  return serverUrl?.trim() || null;
}

export function processDoubanUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  const proxyUrl = getDoubanProxyUrl();
  if (!proxyUrl) return originalUrl;

  return `${proxyUrl}${encodeURIComponent(originalUrl)}`;
}

// ==================== 豆瓣图片代理 ====================

const IMG_DOUBAN_RE = /img\d*\.doubanio\.com/g;

export function getImageProxyUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const type = getImageProxyTypeFromStorage();

  if (type === 'server') {
    return '/api/image-proxy?url=';
  }
  if (type === 'cmliussss-cdn-tencent' || type === 'cmliussss-cdn-ali') {
    return IMAGE_PROXY_PRESETS[type].url;
  }
  if (type === 'custom') {
    const customUrl = getImageCustomUrl();
    if (customUrl) return customUrl;
  }

  // 兼容旧版
  const legacyEnabled = isLegacyImageProxyEnabled();
  if (legacyEnabled === false) return null;
  const legacyUrl = getLegacyImageUrl();
  if (legacyUrl) return legacyUrl;

  // 服务端默认值
  const serverUrl = (window as any).RUNTIME_CONFIG?.IMAGE_PROXY;
  return serverUrl?.trim() || null;
}

export function processImageUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  if (typeof window === 'undefined') return originalUrl;

  const type = getImageProxyTypeFromStorage();

  // CDN 域名替换
  if (type === 'cmliussss-cdn-tencent' || type === 'cmliussss-cdn-ali') {
    const target = IMAGE_PROXY_PRESETS[type].url;
    return originalUrl.replace(IMG_DOUBAN_RE, target);
  }

  // 服务端代理或自定义：直接 prepend URL
  const proxyUrl = getImageProxyUrl();
  if (!proxyUrl) return originalUrl;

  return `${proxyUrl}${encodeURIComponent(originalUrl)}`;
}

export function cleanHtmlTags(text: string): string {
  if (!text) return '';

  const cleanedText = text
    .replace(/<[^>]+>/g, '\n') // 将 HTML 标签替换为换行
    .replace(/\n+/g, '\n') // 将多个连续换行合并为一个
    .replace(/[ \t]+/g, ' ') // 将多个连续空格和制表符合并为一个空格，但保留换行符
    .replace(/^\n+|\n+$/g, '') // 去掉首尾换行
    .trim(); // 去掉首尾空格

  // 使用 he 库解码 HTML 实体
  return he.decode(cleanedText);
}

/**
 * 从m3u8地址获取视频质量等级和网络信息
 * @param m3u8Url m3u8播放列表的URL
 * @returns Promise<{quality: string, loadSpeed: string, pingTime: number}> 视频质量等级和网络信息
 */
export async function getVideoResolutionFromM3u8(m3u8Url: string): Promise<{
  quality: string; // 如720p、1080p等
  loadSpeed: string; // 自动转换为KB/s或MB/s
  pingTime: number; // 网络延迟（毫秒）
}> {
  try {
    // 直接使用m3u8 URL作为视频源，避免CORS问题
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';

      // 测量网络延迟（ping时间） - 使用m3u8 URL而不是ts文件
      const pingStart = performance.now();
      let pingTime = 0;

      // 测量ping时间（使用m3u8 URL）
      fetch(m3u8Url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          pingTime = performance.now() - pingStart;
        })
        .catch(() => {
          pingTime = performance.now() - pingStart; // 记录到失败为止的时间
        });

      // 固定使用hls.js加载
      const hls = new Hls();

      // 设置超时处理
      const timeout = setTimeout(() => {
        hls.destroy();
        video.remove();
        reject(new Error('Timeout loading video metadata'));
      }, 4000);

      video.onerror = () => {
        clearTimeout(timeout);
        hls.destroy();
        video.remove();
        reject(new Error('Failed to load video metadata'));
      };

      let actualLoadSpeed = '未知';
      let hasSpeedCalculated = false;
      let hasMetadataLoaded = false;

      let fragmentStartTime = 0;

      // 检查是否可以返回结果
      const checkAndResolve = () => {
        if (
          hasMetadataLoaded &&
          (hasSpeedCalculated || actualLoadSpeed !== '未知')
        ) {
          clearTimeout(timeout);
          const width = video.videoWidth;
          if (width && width > 0) {
            hls.destroy();
            video.remove();

            // 根据视频宽度判断视频质量等级，使用经典分辨率的宽度作为分割点
            const quality =
              width >= 3840
                ? '4K' // 4K: 3840x2160
                : width >= 2560
                ? '2K' // 2K: 2560x1440
                : width >= 1920
                ? '1080p' // 1080p: 1920x1080
                : width >= 1280
                ? '720p' // 720p: 1280x720
                : width >= 854
                ? '480p'
                : 'SD'; // 480p: 854x480

            resolve({
              quality,
              loadSpeed: actualLoadSpeed,
              pingTime: Math.round(pingTime),
            });
          } else {
            // webkit 无法获取尺寸，直接返回
            resolve({
              quality: '未知',
              loadSpeed: actualLoadSpeed,
              pingTime: Math.round(pingTime),
            });
          }
        }
      };

      // 监听片段加载开始
      hls.on(Hls.Events.FRAG_LOADING, () => {
        fragmentStartTime = performance.now();
      });

      // 监听片段加载完成，只需首个分片即可计算速度
      hls.on(Hls.Events.FRAG_LOADED, (event: any, data: any) => {
        if (
          fragmentStartTime > 0 &&
          data &&
          data.payload &&
          !hasSpeedCalculated
        ) {
          const loadTime = performance.now() - fragmentStartTime;
          const size = data.payload.byteLength || 0;

          if (loadTime > 0 && size > 0) {
            const speedKBps = size / 1024 / (loadTime / 1000);

            // 立即计算速度，无需等待更多分片
            const avgSpeedKBps = speedKBps;

            if (avgSpeedKBps >= 1024) {
              actualLoadSpeed = `${(avgSpeedKBps / 1024).toFixed(1)} MB/s`;
            } else {
              actualLoadSpeed = `${avgSpeedKBps.toFixed(1)} KB/s`;
            }
            hasSpeedCalculated = true;
            checkAndResolve(); // 尝试返回结果
          }
        }
      });

      hls.loadSource(m3u8Url);
      hls.attachMedia(video);

      // 监听hls.js错误
      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        console.error('HLS错误:', data);
        if (data.fatal) {
          clearTimeout(timeout);
          hls.destroy();
          video.remove();
          reject(new Error(`HLS播放失败: ${data.type}`));
        }
      });

      // 监听视频元数据加载完成
      video.onloadedmetadata = () => {
        hasMetadataLoaded = true;
        checkAndResolve(); // 尝试返回结果
      };
    });
  } catch (error) {
    throw new Error(
      `Error getting video resolution: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
