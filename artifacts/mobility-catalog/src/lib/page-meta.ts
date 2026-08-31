import { useEffect } from 'react';

const BRAND = 'مفاز Mafaz Mobility';

/**
 * Sets the document title and meta description for a route. The site is a
 * single page app, so without this every route shares the one title baked into
 * index.html — which is what a browser tab, a bookmark, and a link shared on
 * WhatsApp all display.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BRAND;
    if (!description) return;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [title, description]);
}
