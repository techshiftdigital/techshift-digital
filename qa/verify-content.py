#!/usr/bin/env python3
import json, pathlib, sys
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'translations/tool-content.json').read_text())
errors=[]
if len(data['tools'])!=50: errors.append(f"Expected 50 tools, got {len(data['tools'])}")
slugs=[x['slug'] for x in data['tools']]
if len(set(slugs))!=50: errors.append('Duplicate slugs')
for loc in ('es','pt-br'):
 titles=[x[loc]['title'] for x in data['tools']]
 metas=[x[loc]['metaDescription'] for x in data['tools']]
 if len(set(titles))!=50: errors.append(f'{loc}: localized titles are not unique')
 if len(set(metas))!=50: errors.append(f'{loc}: meta descriptions are not unique')
for tool in data['tools']:
 for loc in ('es','pt-br'):
  x=tool.get(loc,{})
  for key in ('title','metaDescription','intro','howTitle','how','methodTitle','method','exampleTitle','example','mistakesTitle','mistakes','faqTitle','faqs','relatedTitle'):
   if not x.get(key): errors.append(f"{tool['slug']} {loc}: missing {key}")
  if len(x.get('metaDescription',''))>160: errors.append(f"{tool['slug']} {loc}: meta description exceeds 160 characters")
  if len(x.get('faqs',[]))!=4: errors.append(f"{tool['slug']} {loc}: expected 4 FAQs")
 if len(tool.get('related',[]))<3: errors.append(f"{tool['slug']}: fewer than 3 related tools")
 if tool['slug'] in tool.get('related',[]): errors.append(f"{tool['slug']}: related list contains itself")
 if any(x not in slugs for x in tool.get('related',[])): errors.append(f"{tool['slug']}: related list contains an unknown slug")
print('PASS: 50 tools, 100 detailed localizations, 400 FAQs, formulas/examples and related links validated.' if not errors else '\n'.join(errors))
sys.exit(bool(errors))
