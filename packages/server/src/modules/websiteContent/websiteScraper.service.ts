import { WebsiteContentModel } from './websiteContent.model.js';
import { ClientModel } from '../client/client.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { RagService } from '../chat/ragService.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedContent {
  title: string;
  content: string;
  contentType: 'heading' | 'paragraph' | 'menu_item' | 'pricing' | 'contact' | 'service' | 'gallery' | 'hours' | 'policy' | 'other';
  category: string;
  section: string;
  pagePath: string;
  priority: number;
}

interface PageChunk {
  title: string;
  content: string;
  category: string;
  section: string;
  pagePath: string;
  priority: number;
  chunkIndex: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHUNK_TARGET_WORDS = 400;
const CHUNK_MAX_WORDS = 500;
const MAX_PAGES = 25;
const JINA_TIMEOUT_MS = 15000;
const FETCH_TIMEOUT_MS = 15000;

// ─── Scraper ─────────────────────────────────────────────────────────────────

export class WebsiteScraperService {
  static async syncWebsite(clientId: string): Promise<{ success: boolean; pagesScraped: number; itemsExtracted: number; error?: string }> {
    const failedUrls: string[] = [];
    const logs: string[] = [];

    try {
      const clientObjIds: mongoose.Types.ObjectId[] = [];
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        clientObjIds.push(new mongoose.Types.ObjectId(clientId));
      }
      const client = await ClientModel.findOne({
        $or: [
          { _id: { $in: clientObjIds } },
          { clientId: clientId.trim().toLowerCase() }
        ]
      }).lean();

      if (!client) {
        return { success: false, pagesScraped: 0, itemsExtracted: 0, error: 'Client not found' };
      }

      const websiteUrl = client.website;
      if (!websiteUrl) {
        return { success: false, pagesScraped: 0, itemsExtracted: 0, error: 'No website URL configured for this client' };
      }

      const resolvedId = client._id as mongoose.Types.ObjectId;
      logs.push(`Starting crawl for ${client.companyName || client.name}`);

      // Mark all existing website content as deleted (soft delete)
      await WebsiteContentModel.updateMany(
        { clientId: resolvedId },
        { $set: { isDeleted: true } }
      );

      // Also clear old RAG knowledge chunks from previous crawl
      await KnowledgeModel.updateMany(
        { clientId: resolvedId, tags: 'website_sync', isDeleted: false },
        { $set: { isDeleted: true, isActive: false } }
      );

      const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      logs.push(`Discovering pages from ${normalizedUrl}`);
      const pagesToScrape = await this.discoverPages(normalizedUrl);
      logs.push(`Found ${pagesToScrape.length} pages to scrape`);

      const allItems: ExtractedContent[] = [];

      for (const pageUrl of pagesToScrape) {
        try {
          logs.push(`Scraping ${pageUrl}`);
          const items = await this.scrapePage(pageUrl, normalizedUrl);
          allItems.push(...items);
          logs.push(`Extracted ${items.length} items from ${pageUrl}`);
        } catch (err) {
          failedUrls.push(pageUrl);
          logs.push(`Failed to scrape ${pageUrl}: ${(err as Error).message}`);
          logger.warn(`[WebsiteScraper] Failed to scrape ${pageUrl}:`, err);
        }
      }

      if (allItems.length > 0) {
        const docs = allItems.map(item => ({
          clientId: resolvedId,
          url: item.title.startsWith('http') ? item.title : `${normalizedUrl}${item.pagePath}`,
          title: item.title,
          content: item.content,
          contentType: item.contentType,
          category: item.category,
          section: item.section,
          pagePath: item.pagePath,
          language: 'en' as const,
          priority: item.priority,
          isActive: true,
          isDeleted: false,
          lastSyncedAt: new Date(),
        }));

        await WebsiteContentModel.insertMany(docs);
        logs.push(`Stored ${docs.length} items in database`);
      }

      // Build semantic knowledge chunks + embeddings from the scraped content
      const chunkCount = await this.buildRAGKnowledge(resolvedId, allItems, client.companyName || client.name, normalizedUrl);
      logs.push(`Built ${chunkCount} RAG knowledge chunks with embeddings`);

      // Update crawl metadata
      const successCount = pagesToScrape.length - failedUrls.length;
      await WebsiteContentModel.updateMany(
        { clientId: resolvedId },
        {
          $set: {
            'crawlMetadata.lastCrawlAt': new Date(),
            'crawlMetadata.crawlStatus': failedUrls.length > pagesToScrape.length / 2 ? 'failed' : 'success',
            'crawlMetadata.pagesFound': pagesToScrape.length,
            'crawlMetadata.pagesScraped': successCount,
            'crawlMetadata.itemsExtracted': allItems.length,
            'crawlMetadata.failedUrls': failedUrls,
            'crawlMetadata.crawlLogs': logs,
          },
        }
      );

      logger.info(`[WebsiteScraper] Synced ${allItems.length} items + ${chunkCount} RAG chunks from ${successCount}/${pagesToScrape.length} pages for client ${clientId}`);

      if (allItems.length === 0) {
        return {
          success: false,
          pagesScraped: successCount,
          itemsExtracted: 0,
          error: 'No readable content could be extracted from website URL',
        };
      }

      return {
        success: true,
        pagesScraped: successCount,
        itemsExtracted: allItems.length,
      };
    } catch (error) {
      logger.error('[WebsiteScraper] Sync failed:', error);
      let errMsg = (error as Error).message;
      if (errMsg.includes('fetch failed') || errMsg.includes('ENOTFOUND') || errMsg.includes('ETIMEDOUT')) {
        errMsg = `Unable to reach website URL. Please verify that the website is live, public, and accessible.`;
      }
      try {
        const clientObjIds: mongoose.Types.ObjectId[] = [];
        if (mongoose.Types.ObjectId.isValid(clientId)) {
          clientObjIds.push(new mongoose.Types.ObjectId(clientId));
        }
        await WebsiteContentModel.updateMany(
          { clientId: { $in: clientObjIds } },
          {
            $set: {
              'crawlMetadata.lastCrawlAt': new Date(),
              'crawlMetadata.crawlStatus': 'failed',
              'crawlMetadata.failedUrls': failedUrls,
              'crawlMetadata.crawlLogs': [...logs, `ERROR: ${errMsg}`],
            },
          }
        );
      } catch { /* ignore cleanup error */ }

      return { success: false, pagesScraped: 0, itemsExtracted: 0, error: errMsg };
    }
  }

  // ─── Page Discovery ─────────────────────────────────────────────────────────

  private static async discoverPages(baseUrl: string): Promise<string[]> {
    const pages = new Set<string>();
    pages.add(baseUrl);

    // Try sitemap first for better coverage
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap`,
      `${baseUrl}/wp-sitemap.xml`,
    ];

    let foundSitemap = false;
    for (const sitemapUrl of sitemapUrls) {
      try {
        const sitemapResp = await fetch(sitemapUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'NestChatBot/1.0' },
        });
        if (sitemapResp.ok) {
          const sitemapText = await sitemapResp.text();
          const urlRegex = /<loc[^>]*>([^<]+)<\/loc>/gi;
          let locMatch;
          const baseHost = new URL(baseUrl).hostname;
          while ((locMatch = urlRegex.exec(sitemapText)) !== null) {
            try {
              const locUrl = new URL(locMatch[1]);
              if (locUrl.hostname === baseHost) {
                const cleanUrl = locUrl.origin + locUrl.pathname.replace(/\/$/, '');
                if (pages.size < MAX_PAGES) pages.add(cleanUrl);
              }
            } catch { /* skip */ }
          }
          if (pages.size > 1) {
            foundSitemap = true;
            break;
          }
        }
      } catch { /* sitemap not found */ }
    }

    // If sitemap didn't give enough pages, crawl home page links
    if (!foundSitemap || pages.size < 3) {
      try {
        const response = await fetch(baseUrl, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        if (!response.ok) return Array.from(pages).slice(0, MAX_PAGES);

        const html = await response.text();
        const baseHost = new URL(baseUrl).hostname;
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
          let href = match[1].split('#')[0].split('?')[0];
          if (!href || href === '/' || href.startsWith('#') || href.startsWith('javascript:')) continue;

          try {
            const fullUrl = new URL(href, baseUrl);
            if (fullUrl.hostname === baseHost && !fullUrl.pathname.match(/\.(pdf|zip|png|jpg|jpeg|gif|svg|css|js|xml|json|ico|webp)$/i)) {
              const cleanUrl = fullUrl.origin + fullUrl.pathname.replace(/\/$/, '');
              if (pages.size < MAX_PAGES) {
                pages.add(cleanUrl);
              }
            }
          } catch {
            // Invalid URL, skip
          }
        }
      } catch (err) {
        logger.warn(`[WebsiteScraper] Failed to discover pages from ${baseUrl}:`, err);
      }
    }

    return Array.from(pages).slice(0, MAX_PAGES);
  }

  // ─── Page Scraping ──────────────────────────────────────────────────────────

  private static async scrapePage(pageUrl: string, baseUrl: string): Promise<ExtractedContent[]> {
    const items: ExtractedContent[] = [];

    // Try Jina Reader first (handles JS-rendered React/Next.js/Vue pages)
    const jinaContent = await this.fetchViaJinaReader(pageUrl);
    if (jinaContent) {
      const parsed = this.parseJinaMarkdown(jinaContent, pageUrl);
      if (parsed.length > 0) {
        return parsed;
      }
    }

    // Fallback: direct fetch + HTML parsing
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) return items;

    const html = await response.text();
    const pagePath = new URL(pageUrl).pathname;

    this.extractMetaContent(html, items, pagePath);
    this.extractHeadings(html, items, pagePath);
    this.extractParagraphs(html, items, pagePath);
    this.extractListItems(html, items, pagePath);
    this.extractTables(html, items, pagePath);
    this.extractCardsAndSections(html, items, pagePath);
    this.extractStructuredData(html, items, pagePath);
    this.extractContactInfo(html, items, pagePath);

    return items;
  }

  /**
   * Fetch page content via Jina AI Reader (https://r.jina.ai/).
   * Returns clean Markdown text — handles React, Next.js, Vue, SPA pages.
   */
  private static async fetchViaJinaReader(pageUrl: string): Promise<string | null> {
    try {
      const jinaUrl = `https://r.jina.ai/${pageUrl}`;
      const response = await fetch(jinaUrl, {
        signal: AbortSignal.timeout(JINA_TIMEOUT_MS),
        headers: {
          'Accept': 'text/plain,text/markdown',
          'X-Return-Format': 'markdown',
          'X-Timeout': '12',
          'X-Remove-Selector': 'nav,header,footer,.cookie-banner,.navbar,.nav-menu,.cookie-notice,#cookie,#nav,#header,#footer',
        },
      });

      if (!response.ok) return null;

      const text = await response.text();
      if (!text || text.length < 100) return null;

      return text;
    } catch {
      return null;
    }
  }

  /**
   * Parse Jina Markdown output into structured ExtractedContent items.
   * Applies aggressive cleaning to strip navigation, CTAs, and repeated boilerplate.
   */
  private static parseJinaMarkdown(markdown: string, pageUrl: string): ExtractedContent[] {
    const pagePath = new URL(pageUrl).pathname;
    const items: ExtractedContent[] = [];

    // Clean Jina-specific metadata headers
    const cleaned = markdown
      // Remove Jina metadata lines (Title:, URL:, Published Time:, etc.)
      .replace(/^(Title|URL|Published Time|Description|Keywords|Source):.*$/gm, '')
      // Remove markdown image syntax
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove markdown link syntax but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove HTML-style tags
      .replace(/<[^>]+>/g, ' ')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Collapse excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    // Split into paragraphs/sections by double newlines
    const sections = cleaned.split(/\n{2,}/);

    for (const rawSection of sections) {
      const text = rawSection.trim();
      if (!text || text.length < 15) continue;

      // Skip navigation boilerplate
      if (this.isNavigationText(text)) continue;

      // Skip pure CTA lines
      if (this.isCTAText(text)) continue;

      // Skip lines that are just heading markers with no content
      if (/^#{1,6}\s*$/.test(text)) continue;

      // Detect section level (headings)
      const headingMatch = text.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        const headingText = headingMatch[2].trim();
        if (headingText.length < 3 || this.isNavigationText(headingText)) continue;

        const level = headingMatch[1].length;
        const category = this.categorizeHeading(headingText, pagePath);

        items.push({
          title: headingText,
          content: headingText,
          contentType: 'heading',
          category,
          section: `h${level}`,
          pagePath,
          priority: 10 - level,
        });
        continue;
      }

      // Paragraphs / body text
      const lineText = text.replace(/^#+\s*/, '').trim();
      if (lineText.length < 20) continue;

      const category = this.categorizeParagraph(lineText, pagePath);
      let contentType: ExtractedContent['contentType'] = 'paragraph';
      let priority = 3;

      const lower = lineText.toLowerCase();
      if (lower.match(/\$|₹|€|£|\brs\b|\bprice\b|\bcost\b|\bfee\b|\brate\b/)) {
        contentType = 'pricing';
        category === 'general' && (contentType = 'pricing');
        priority = 8;
      } else if (lower.match(/\bphone\b|\bemail\b|\baddress\b|\bcontact\b/)) {
        contentType = 'contact';
        priority = 9;
      } else if (lower.match(/\bhour\b|\btiming\b|\bopen\b|\bclosed\b/)) {
        contentType = 'hours';
        priority = 8;
      } else if (lower.match(/\bservice\b|\boffer\b|\bprovide\b|\bsolution\b/)) {
        contentType = 'service';
        priority = 7;
      }

      items.push({
        title: lineText.substring(0, 60),
        content: lineText,
        contentType,
        category,
        section: 'paragraph',
        pagePath,
        priority,
      });
    }

    return items;
  }

  // ─── RAG Knowledge Builder ─────────────────────────────────────────────────

  /**
   * Build semantic knowledge chunks from scraped content and store embeddings.
   * Each chunk is ~400 words. Embeddings are generated via Groq.
   */
  private static async buildRAGKnowledge(
    clientId: mongoose.Types.ObjectId,
    items: ExtractedContent[],
    companyName: string,
    baseUrl: string
  ): Promise<number> {
    // Group items by page path for coherent chunking
    const pageGroups = new Map<string, ExtractedContent[]>();
    for (const item of items) {
      const key = item.pagePath || '/';
      if (!pageGroups.has(key)) pageGroups.set(key, []);
      pageGroups.get(key)!.push(item);
    }

    let chunkCount = 0;

    for (const [pagePath, pageItems] of pageGroups.entries()) {
      // Filter to meaningful content only (skip image alts, CTA buttons, headings < 5 words)
      const meaningful = pageItems.filter(item => {
        if (item.contentType === 'gallery') return false; // image alts not useful
        if (item.content.length < 20) return false;
        if (this.isCTAText(item.content)) return false;
        return true;
      });

      if (meaningful.length === 0) continue;

      // Sort by priority (highest first)
      meaningful.sort((a, b) => b.priority - a.priority);

      // Build raw page text
      const pageText = meaningful.map(i => i.content).join('\n\n');

      // Split into semantic chunks (~400 words)
      const chunks = this.splitIntoChunks(pageText, CHUNK_TARGET_WORDS, CHUNK_MAX_WORDS);

      // Determine page-level category
      const pageCategory = this.categorizePage(pagePath);

      for (let idx = 0; idx < chunks.length; idx++) {
        const chunkText = chunks[idx].trim();
        if (!chunkText || chunkText.length < 30) continue;

        const chunkTitle = `${companyName} — ${pageCategory} (chunk ${idx + 1})`;
        const slug = `rag-${pageCategory}-${this.hashText(chunkText).slice(0, 12)}`;

        // Skip if this exact chunk already exists
        const existing = await KnowledgeModel.findOne({
          clientId,
          slug,
          isDeleted: false,
        }).lean();

        if (existing) continue;

        // Generate embedding
        let embedding: number[] | undefined;
        try {
          const emb = await RagService.generateEmbedding(chunkText);
          if (emb) embedding = emb;
        } catch (embErr) {
          logger.warn(`[WebsiteScraper] Embedding failed for chunk ${idx} on ${pagePath}:`, embErr);
        }

        // Store chunk as a knowledge record
        try {
          await KnowledgeModel.create({
            clientId,
            pageName: `${companyName} Website — ${pageCategory}`,
            slug,
            title: chunkTitle,
            content: chunkText,
            tags: [pageCategory, 'website_sync', 'rag_chunk'],
            category: pageCategory,
            language: 'en' as const,
            priority: 5,
            isActive: true,
            isDeleted: false,
            ...(embedding ? { embedding } : {}),
            chunkIndex: idx,
          });
          chunkCount++;
        } catch (err: any) {
          // Ignore duplicate key errors (E11000)
          if (!err.message?.includes('E11000')) {
            logger.warn(`[WebsiteScraper] Chunk insert error on ${pagePath}[${idx}]:`, err.message);
          }
        }
      }
    }

    logger.info(`[WebsiteScraper] RAG: created ${chunkCount} knowledge chunks`);
    return chunkCount;
  }

  /**
   * Split text into semantic chunks of approximately targetWords words.
   * Splits at paragraph boundaries to preserve sentence coherence.
   */
  private static splitIntoChunks(text: string, targetWords: number, maxWords: number): string[] {
    const paragraphs = text.split(/\n{2,}/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const para of paragraphs) {
      const paraWords = para.trim().split(/\s+/).length;
      if (paraWords === 0) continue;

      if (currentWordCount + paraWords > maxWords && currentChunk.length > 0) {
        // Flush current chunk
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentWordCount = 0;
      }

      currentChunk.push(para.trim());
      currentWordCount += paraWords;

      // If chunk is at target size, flush
      if (currentWordCount >= targetWords) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentWordCount = 0;
      }
    }

    // Flush remaining
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }

    return chunks.filter(c => c.trim().length > 0);
  }

  /**
   * Simple hash function for deduplication (djb2 variant).
   */
  private static hashText(text: string): string {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
  }

  // ─── Legacy KB Sync (preserved for backward-compat) ────────────────────────

  private static async syncToKnowledgeBase(
    clientId: mongoose.Types.ObjectId,
    items: ExtractedContent[],
    companyName: string
  ): Promise<void> {
    const importantItems = items.filter(i =>
      ['menu_item', 'pricing', 'contact', 'hours', 'service', 'policy'].includes(i.contentType) &&
      i.content.length > 5
    );

    const seen = new Set<string>();

    for (const item of importantItems) {
      const key = item.content.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const category = item.category || 'general';
      const slug = `web-${category}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)}-${Math.random().toString(36).substring(2, 6)}`;

      try {
        const existing = await KnowledgeModel.findOne({
          clientId,
          slug,
          isDeleted: false,
        });

        if (!existing) {
          await KnowledgeModel.create({
            clientId,
            pageName: `${companyName} Website`,
            slug,
            title: item.title,
            content: item.content,
            tags: [item.contentType, item.category, 'website_sync'].filter(Boolean),
            category,
            language: 'en' as const,
            priority: item.priority,
            isActive: true,
            isDeleted: false,
          });
        }
      } catch (err) {
        logger.warn(`[WebsiteScraper] Skipping duplicate Knowledge entry for slug ${slug}`);
      }
    }
  }

  // ─── HTML Extraction Helpers ─────────────────────────────────────────────────

  private static extractMetaContent(html: string, items: ExtractedContent[], pagePath: string): void {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i);

    if (titleMatch) {
      items.push({
        title: titleMatch[1].trim(),
        content: titleMatch[1].trim(),
        contentType: 'heading',
        category: this.categorizePage(pagePath),
        section: 'page_title',
        pagePath,
        priority: 10,
      });
    }

    if (descMatch) {
      items.push({
        title: 'Page Description',
        content: descMatch[1].trim(),
        contentType: 'paragraph',
        category: 'general',
        section: 'meta_description',
        pagePath,
        priority: 5,
      });
    }
  }

  private static extractHeadings(html: string, items: ExtractedContent[], pagePath: string): void {
    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const text = this.stripHtml(match[2]).trim();
      if (text.length < 3 || this.isNavigationText(text)) continue;

      const category = this.categorizeHeading(text, pagePath);
      items.push({
        title: text,
        content: text,
        contentType: 'heading',
        category,
        section: `h${level}`,
        pagePath,
        priority: 10 - level,
      });
    }
  }

  private static extractParagraphs(html: string, items: ExtractedContent[], pagePath: string): void {
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;

    while ((match = paragraphRegex.exec(html)) !== null) {
      const text = this.stripHtml(match[1]).trim();
      if (text.length < 20 || this.isNavigationText(text) || text.match(/^\s*$/)) continue;
      if (this.isCTAText(text)) continue;

      const category = this.categorizeParagraph(text, pagePath);
      items.push({
        title: text.substring(0, 60),
        content: text,
        contentType: 'paragraph',
        category,
        section: 'paragraph',
        pagePath,
        priority: 3,
      });
    }
  }

  private static extractListItems(html: string, items: ExtractedContent[], pagePath: string): void {
    const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = listRegex.exec(html)) !== null) {
      const text = this.stripHtml(match[1]).trim();
      if (text.length < 5 || this.isNavigationText(text) || this.isCTAText(text)) continue;

      let contentType: ExtractedContent['contentType'] = 'paragraph';
      let category = this.categorizePage(pagePath);
      let priority = 2;

      const lower = text.toLowerCase();
      if (lower.match(/\$|₹|€|£|\brs\b|\bprice\b|\bcost\b|\bfee\b/)) {
        contentType = 'pricing';
        category = 'pricing';
        priority = 8;
      } else if (lower.match(/\bmenu\b|\bbiryani\b|\bcurry\b|\bpizza\b|\bburger\b|\bdish\b|\bappetizer\b|\bmain course\b|\bdessert\b|\bdrink\b|\bbreakfast\b|\blunch\b|\bdinner\b/)) {
        contentType = 'menu_item';
        category = 'menu';
        priority = 9;
      }

      items.push({
        title: text.substring(0, 60),
        content: text,
        contentType,
        category,
        section: 'list_item',
        pagePath,
        priority,
      });
    }
  }

  private static extractTables(html: string, items: ExtractedContent[], pagePath: string): void {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];

      const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      const headers: string[] = [];
      let hMatch;
      while ((hMatch = headerRegex.exec(tableHtml)) !== null) {
        headers.push(this.stripHtml(hMatch[1]).trim());
      }

      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const rows: string[] = [];
      let rMatch;
      while ((rMatch = rowRegex.exec(tableHtml)) !== null) {
        const cells = rMatch[1].replace(/<t[hd][^>]*>/gi, ' | ').replace(/<\/t[hd]>/gi, '');
        const rowText = this.stripHtml(cells).trim();
        if (rowText.length > 5) rows.push(rowText);
      }

      if (rows.length > 0) {
        const headerStr = headers.length > 0 ? `Headers: ${headers.join(', ')}\n` : '';
        const content = `${headerStr}${rows.join('\n')}`;

        let contentType: ExtractedContent['contentType'] = 'paragraph';
        let category = this.categorizePage(pagePath);
        let priority = 6;

        const lowerContent = content.toLowerCase();
        if (lowerContent.match(/\$|₹|€|£|price|cost|fee|rate/)) {
          contentType = 'pricing';
          category = 'pricing';
          priority = 9;
        } else if (lowerContent.match(/menu|dish|food|item|beverage/)) {
          contentType = 'menu_item';
          category = 'menu';
          priority = 9;
        } else if (lowerContent.match(/hour|open|close|timing/)) {
          contentType = 'hours';
          category = 'hours';
          priority = 8;
        }

        items.push({
          title: headers.length > 0 ? `Table: ${headers.join(', ')}` : `Table Data (${pagePath})`,
          content: `[TABLE DATA]\n${content}`,
          contentType,
          category,
          section: 'table',
          pagePath,
          priority,
        });
      }
    }
  }

  private static extractCardsAndSections(html: string, items: ExtractedContent[], pagePath: string): void {
    const cardPatterns = [
      /<div[^>]*class="[^"]*(?:card|menu-item|product|service|feature|pricing-table|package|item)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
      /<section[^>]*>([\s\S]*?)<\/section>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
    ];

    for (const pattern of cardPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.stripHtml(match[1]).trim();
        if (text.length < 15 || text.length > 2000 || this.isNavigationText(text) || this.isCTAText(text)) continue;

        let contentType: ExtractedContent['contentType'] = 'paragraph';
        let category = this.categorizePage(pagePath);
        let priority = 5;

        const lower = text.toLowerCase();
        if (lower.match(/\$|₹|€|£|price|cost|fee/)) {
          contentType = 'pricing';
          category = 'pricing';
          priority = 8;
        } else if (lower.match(/menu|dish|food|item|beverage|order|breakfast|lunch|dinner|dessert/)) {
          contentType = 'menu_item';
          category = 'menu';
          priority = 8;
        } else if (lower.match(/service|offer|provide|solution/)) {
          contentType = 'service';
          category = 'service';
          priority = 7;
        } else if (lower.match(/hour|timing|open|close/)) {
          contentType = 'hours';
          category = 'hours';
          priority = 8;
        }

        if (!items.some(i => i.content === text)) {
          items.push({
            title: text.substring(0, 60),
            content: text,
            contentType,
            category,
            section: 'card_section',
            pagePath,
            priority,
          });
        }
      }
    }
  }

  private static extractStructuredData(html: string, items: ExtractedContent[], pagePath: string): void {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1].trim());
        const extracted = this.flattenStructuredData(data, '');
        if (extracted) {
          items.push({
            title: 'Structured Business Data',
            content: extracted,
            contentType: 'other',
            category: 'business_info',
            section: 'structured_data',
            pagePath,
            priority: 10,
          });
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }
  }

  private static flattenStructuredData(data: any, prefix: string): string | null {
    if (!data || typeof data !== 'object') return null;

    const parts: string[] = [];

    if (data['@type']) parts.push(`Type: ${data['@type']}`);
    if (data.name) parts.push(`Name: ${data.name}`);
    if (data.description) parts.push(`Description: ${data.description}`);
    if (data.telephone) parts.push(`Phone: ${data.telephone}`);
    if (data.email) parts.push(`Email: ${data.email}`);
    if (data.url) parts.push(`URL: ${data.url}`);
    if (data.address) {
      const addr = data.address;
      if (typeof addr === 'object') {
        const addrParts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry].filter(Boolean);
        if (addrParts.length > 0) parts.push(`Address: ${addrParts.join(', ')}`);
      } else {
        parts.push(`Address: ${addr}`);
      }
    }
    if (data.openingHoursSpecification || data.openingHours) {
      const hours = data.openingHoursSpecification || data.openingHours;
      if (Array.isArray(hours)) {
        hours.forEach((h: any) => {
          if (typeof h === 'string') parts.push(`Hours: ${h}`);
          else if (h.dayOfWeek && h.opens && h.closes) {
            parts.push(`Hours: ${h.dayOfWeek} ${h.opens}-${h.closes}`);
          }
        });
      } else if (typeof hours === 'string') {
        parts.push(`Hours: ${hours}`);
      }
    }
    if (data.priceRange) parts.push(`Price Range: ${data.priceRange}`);
    if (data.servesCuisine) parts.push(`Cuisine: ${data.servesCuisine}`);
    if (data.menu) parts.push(`Menu: ${typeof data.menu === 'string' ? data.menu : JSON.stringify(data.menu)}`);
    if (data.aggregateRating) {
      const ar = data.aggregateRating;
      if (ar.ratingValue) parts.push(`Rating: ${ar.ratingValue}/5`);
      if (ar.reviewCount) parts.push(`Reviews: ${ar.reviewCount}`);
    }

    return parts.length > 0 ? `[STRUCTURED DATA] ${parts.join(' | ')}` : null;
  }

  private static extractContactInfo(html: string, items: ExtractedContent[], pagePath: string): void {
    const text = this.stripHtml(html);

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const hoursRegex = /(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[-\s,to&]*(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?[^.]*(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?[-\s]*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/gi;

    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    const hours = text.match(hoursRegex);

    if (emails) {
      const uniqueEmails = [...new Set(emails)];
      uniqueEmails.forEach(email => {
        if (!email.includes('example') && !email.includes('domain.com')) {
          items.push({
            title: 'Contact Email',
            content: email,
            contentType: 'contact',
            category: 'contact',
            section: 'email',
            pagePath,
            priority: 10,
          });
        }
      });
    }

    if (phones) {
      const uniquePhones = [...new Set(phones)];
      uniquePhones.forEach(phone => {
        const clean = phone.replace(/[^\d+]/g, '');
        if (clean.length >= 10 && !clean.match(/^1{10}/)) {
          items.push({
            title: 'Contact Phone',
            content: phone.trim(),
            contentType: 'contact',
            category: 'contact',
            section: 'phone',
            pagePath,
            priority: 10,
          });
        }
      });
    }

    if (hours) {
      const uniqueHours = [...new Set(hours.map(h => h.trim()))];
      uniqueHours.forEach(h => {
        items.push({
          title: 'Business Hours',
          content: h,
          contentType: 'hours',
          category: 'hours',
          section: 'business_hours',
          pagePath,
          priority: 9,
        });
      });
    }
  }

  // ─── Categorization Helpers ─────────────────────────────────────────────────

  private static categorizePage(pagePath: string): string {
    const path = pagePath.toLowerCase();
    if (path.includes('menu')) return 'menu';
    if (path.includes('pric') || path.includes('rate') || path.includes('cost')) return 'pricing';
    if (path.includes('contact')) return 'contact';
    if (path.includes('about')) return 'about';
    if (path.includes('service')) return 'service';
    if (path.includes('gallery') || path.includes('photo')) return 'gallery';
    if (path.includes('faq')) return 'faq';
    if (path.includes('policy') || path.includes('term') || path.includes('privacy')) return 'policy';
    if (path.includes('reservation') || path.includes('booking') || path.includes('appointment')) return 'booking';
    if (path.includes('blog') || path.includes('news')) return 'blog';
    if (path.includes('product')) return 'products';
    return 'general';
  }

  private static categorizeHeading(text: string, pagePath: string): string {
    const lower = text.toLowerCase();
    if (lower.match(/\bmenu\b|\bdishes\b|\bfood\b|\bbreakfast\b|\blunch\b|\bdinner\b|\bdessert\b|\bbeverage\b/)) return 'menu';
    if (lower.match(/\bprice\b|\bcost\b|\brate\b|\bfee\b|\bpricing\b/)) return 'pricing';
    if (lower.match(/\bcontact\b|\bphone\b|\bemail\b|\blocation\b|\baddress\b/)) return 'contact';
    if (lower.match(/\bhour\b|\btiming\b|\bopen\b|\bclosed\b/)) return 'hours';
    if (lower.match(/\bservice\b/)) return 'service';
    if (lower.match(/\bgallery\b|\bphoto\b/)) return 'gallery';
    if (lower.match(/\babout\b/)) return 'about';
    if (lower.match(/\bpolicy\b|\bterm\b|\bprivacy\b/)) return 'policy';
    if (lower.match(/\breservation\b|\bbook\b|\bappointment\b/)) return 'booking';
    if (lower.match(/\bproduct\b|\bitem\b/)) return 'products';
    return this.categorizePage(pagePath);
  }

  private static categorizeParagraph(text: string, pagePath: string): string {
    return this.categorizeHeading(text, pagePath);
  }

  // ─── Content Quality Filters ────────────────────────────────────────────────

  private static isNavigationText(text: string): boolean {
    const lower = text.toLowerCase().trim();

    // Single navigation keywords
    const navKeywords = [
      'home', 'menu', 'about', 'about us', 'contact', 'contact us', 'services',
      'gallery', 'login', 'sign up', 'register', 'search', 'cart', 'wishlist',
      'profile', 'logout', 'blog', 'news', 'careers', 'faq', 'terms', 'privacy',
      'skip to content', 'toggle navigation', 'open menu', 'close', 'our menu',
      'testimonials', 'portfolio', 'get started', 'back to top', 'scroll up',
    ];
    if (navKeywords.some(k => lower === k)) return true;

    // Concatenated nav bar lists e.g. "Home Menu Gallery About Testimonials Contact"
    const navCount = ['home', 'menu', 'gallery', 'about', 'contact', 'services', 'blog']
      .filter(w => lower.includes(w)).length;
    if (navCount >= 3 && lower.length < 100) return true;

    // Known boilerplate phrases
    const boilerplate = [
      'culinary artistry', 'michelin-inspired', 'crafted with passion',
      'powered by', 'all rights reserved', '© copyright',
      'cookie policy', 'accept all cookies', 'we use cookies',
    ];
    if (boilerplate.some(b => lower.includes(b))) return true;

    return false;
  }

  private static isCTAText(text: string): boolean {
    const lower = text.toLowerCase().trim();

    // Pure CTA phrases that add no knowledge value
    const ctaPhrases = [
      'read more', 'learn more', 'click here', 'book now', 'order now',
      'get started', 'sign up now', 'contact us', 'call us', 'get a quote',
      'find out more', 'see more', 'view all', 'show more', 'load more',
      'buy now', 'shop now', 'subscribe', 'download now', 'try free',
      'explore menu', 'view menu', 'see menu', 'check menu',
    ];

    // Exact match or very short (< 5 words) CTA
    if (ctaPhrases.includes(lower)) return true;

    // Multi-word CTA check for short strings
    if (lower.split(/\s+/).length <= 4) {
      return ctaPhrases.some(cta => lower.includes(cta));
    }

    return false;
  }

  // ─── HTML Utilities ─────────────────────────────────────────────────────────

  private static stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
