# Implementation notes

## Design parity

Localized pages are generated from the current English build rather than from independent templates. This preserves the page shell, CSS classes, image sources, forms and scripts. The package stylesheet is deliberately narrow: it styles only the language dropdown and the localized information block. It does not redefine the body, header, cards, site colours, typography or images.

## Language dropdown

The dropdown is inserted at runtime into the first available header action area, navigation or header. It is keyboard accessible, closes with Escape, uses the current equivalent route and works on mobile. Legacy language-list elements and text links named “All languages”, “Todos los idiomas” or “Todos os idiomas” are hidden to ensure one control in all interfaces.

## Tool detail content

`translations/tool-content.json` contains two complete records per tool. Each localized record includes:

- localized title, category and meta description;
- introduction and three usage steps;
- method or formula;
- worked example;
- three mistakes/limitations;
- four FAQs;
- related-tool links.

If the English page exposes an existing detail container (`data-tool-details`, `.tool-details`, `.seo-content` or `.tool-explanation`), it is replaced by the localized detail block. Otherwise the localized block is appended to the page's main content. The calculator area is not replaced.

## Route and SEO behavior

For every English page generated in the output, the post-build step creates equivalent `/es/` and `/pt-br/` pages. It adds canonical and alternate-language links to all three versions and writes `sitemap-multilingual.xml`.

## Scope boundary

Because the private repository was not provided with this request, the package is an integration update rather than a replacement repository. It is designed to run against the actual current build so that current images, design and calculator logic are preserved exactly.
