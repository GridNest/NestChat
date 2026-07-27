import { WebsiteContentModel } from './websiteContent.model.js';
import { ClientModel } from '../client/client.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';

interface ExtractedContent {
  title: string;
  content: string;
  contentType: 'heading' | 'paragraph' | 'menu_item' | 'pricing' | 'contact' | 'service' | 'gallery' | 'hours' | 'policy' | 'other';
  category: string;
  section: string;
  pagePath: string;
  priority: number;
}

export class WebsiteScraperService {
  static async syncWebsite(clientId: string): Promise<{ success: boolean; pagesScraped: number; itemsExtracted: number; error?: string }> {
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

      await WebsiteContentModel.updateMany(
        { clientId: resolvedId },
        { $set: { isDeleted: true } }
      );

      const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      const pagesToScrape = await this.discoverPages(normalizedUrl);
      const allItems: ExtractedContent[] = [];

      for (const pageUrl of pagesToScrape) {
        try {
          const items = await this.scrapePage(pageUrl, normalizedUrl);
          allItems.push(...items);
        } catch (err) {
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
      }

      await this.syncToKnowledgeBase(resolvedId, allItems, client.companyName || client.name);

      logger.info(`[WebsiteScraper] Synced ${allItems.length} items from ${pagesToScrape.length} pages for client ${clientId}`);

      return {
        success: true,
        pagesScraped: pagesToScrape.length,
        itemsExtracted: allItems.length,
      };
    } catch (error) {
      logger.error('[WebsiteScraper] Sync failed:', error);
      return { success: false, pagesScraped: 0, itemsExtracted: 0, error: (error as Error).message };
    }
  }

  private static async discoverPages(baseUrl: string): Promise<string[]> {
    const pages = new Set<string>();
    pages.add(baseUrl);

    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) return [baseUrl];

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
            if (pages.size < 20) {
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

    return Array.from(pages);
  }

  private static async scrapePage(pageUrl: string, baseUrl: string): Promise<ExtractedContent[]> {
    const items: ExtractedContent[] = [];

    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(15000),
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
    this.extractContactInfo(html, items, pagePath);

    return items;
  }

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
      if (text.length < 5 || this.isNavigationText(text)) continue;

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
      const slug = `web-${category}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`;

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
    }
  }

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
    return this.categorizePage(pagePath);
  }

  private static categorizeParagraph(text: string, pagePath: string): string {
    return this.categorizeHeading(text, pagePath);
  }

  private static isNavigationText(text: string): boolean {
    const navKeywords = ['home', 'menu', 'about us', 'contact us', 'services', 'gallery',
      'login', 'sign up', 'register', 'search', 'cart', 'wishlist', 'profile',
      'logout', 'blog', 'news', 'careers', 'faq', 'terms', 'privacy',
      'skip to content', 'toggle navigation', 'open menu', 'close'];
    return navKeywords.some(k => text.toLowerCase().trim() === k);
  }

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
