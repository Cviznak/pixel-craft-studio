import type { PaletteColor, CraftType } from '../types/craft';

export const DEFAULT_AMAZON_TAG = 'pixelcraft05a-20';

export function getActiveAffiliateTag(): string {
  try {
    const custom = localStorage.getItem('amazon_affiliate_tag');
    if (custom !== null && custom.trim().length > 0) {
      return custom.trim();
    }
  } catch {
    // Ignore storage issues in SSR / private browsing
  }
  return DEFAULT_AMAZON_TAG;
}

export function setCustomAffiliateTag(tag: string): void {
  try {
    if (!tag || tag.trim() === DEFAULT_AMAZON_TAG) {
      localStorage.removeItem('amazon_affiliate_tag');
    } else {
      localStorage.setItem('amazon_affiliate_tag', tag.trim());
    }
  } catch {
    // Ignore
  }
}

export function buildAmazonColorSearchUrl(color: PaletteColor, craftType: CraftType = 'perler'): string {
  let query = '';
  if (craftType === 'crochet') {
    query = `${color.name || ''} crochet yarn skein`.trim();
  } else if (craftType === 'perler') {
    query = `perler beads ${color.name || color.code || ''}`.trim();
  } else if (craftType === 'cross-stitch') {
    const codeOnly = color.code ? color.code.replace('DMC', '').replace('~', '').trim() : '';
    query = `dmc ${codeOnly || color.name || ''} embroidery floss`.trim();
  } else if (craftType === 'diamond') {
    query = `diamond painting drills ${color.code || color.name || ''}`.trim();
  } else {
    query = `pixel craft supplies ${color.name || ''}`.trim();
  }

  const tag = getActiveAffiliateTag();
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

export function buildAmazonSuppliesUrl(craftType: CraftType = 'perler'): string {
  let query = 'perler beads bucket 10000 with pegboards';
  if (craftType === 'crochet') {
    query = 'crochet yarn pack with ergonomic hooks set';
  } else if (craftType === 'cross-stitch') {
    query = 'dmc embroidery floss kit with 14 count aida cloth';
  } else if (craftType === 'diamond') {
    query = 'diamond painting tools kit with tray';
  } else if (craftType === 'pixel') {
    query = 'pixel craft art supplies grid';
  }

  const tag = getActiveAffiliateTag();
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}
