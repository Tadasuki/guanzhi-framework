"""Create same-origin WOFF2 web subsets; original font sources remain private."""
from pathlib import Path
from collections import Counter
from fontTools.ttLib import TTFont
from fontTools import subset
import hashlib,json,copy
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'.local/font-check'
OUT=ROOT/'dist/assets/fonts'
OUT.mkdir(parents=True,exist_ok=True)
corpus=(SOURCE/'corpus.txt').read_text()
common='''知跃 STUDY SPACE 学习空间 首页 大纲 真题库 模拟库 题收藏 错题集 资料库 云助手 关于设置 让注意力，回到知识本身。LESS, BUT DEEPER. 以教材为本 从一页书，到一张知识地图。以教材为起点，以章节为脉络。让零散的知识连接起来，让学习回归内容本身。探索学习大纲 浏览资料 每一份理解，都有迹可循 学习，从这里开始 选择一条路径，进入你的学习空间。沿着教材目录，串起章节与考题。建立知识脉络 回到历年真题，看知识如何被提问。读懂考查方式 围绕教材练习，让理解更进一步。巩固所学知识 参考教材与学习资料，在这里归档。找到学习依据 不离开教材，也不止于翻页。目录是线索，章节是节点，题目在知识中找到自己的位置。纯粹的学习空间 循着章节，读懂知识。'''
headline='''知跃 从一页书，到一张知识地图。学习大纲 真题库 模拟库 题收藏 错题集 资料库 云助手 关于与设置 开始一份练习 答题结果 单题练习 筛选练习 346体育综合723体育学专业基础综合 模拟卷押题卷 体育心理 参考教材'''
base=set(range(32,127))|set(map(ord,'，。、“”‘’：；！？（）《》·—…＋＝×÷√→←％℃'))
core=base|set(map(ord,common))
counts=Counter(map(ord,corpus+common*10))
all_chars=set(counts)
# Cover common Chinese words in newly generated subject explanations too.
for a in range(0xa1,0xf8):
 for b in range(0xa1,0xff):
  try:all_chars.add(ord(bytes([a,b]).decode('gb2312')))
  except (UnicodeDecodeError,TypeError):pass
all_chars|=base
manifest={'fonts':[],'cssBytes':0}
css=[]
def ranges(points):
 points=sorted(points);out=[];i=0
 while i<len(points):
  start=end=points[i];i+=1
  while i<len(points) and points[i]==end+1:end=points[i];i+=1
  out.append(f'U+{start:X}' if start==end else f'U+{start:X}-{end:X}')
 return ','.join(out)
def family_name(font,name):
 # Give OFL derivatives distinct primary names, retaining copyright/license records.
 for rec in font['name'].names:
  if rec.nameID in (1,4,6,16,17):
   value='Regular' if rec.nameID==17 else name.replace(' ','') if rec.nameID==6 else name
   rec.string=value.encode(rec.getEncoding(),errors='replace')
for file,family,weight,primary in [
 ('OPPOSans4.ttf','OPPO Sans 4.0','100 700',core),
 ('sourceHan.ttf','ZhiYue Headline','250 900',base|set(map(ord,headline))),
 ('lxgw.woff2','ZhiYue Reading Serif','400',core),
]:
 original=TTFont(SOURCE/file,lazy=False)
 supported=set(original.getBestCmap());wanted=all_chars&supported
 if family=='ZhiYue Headline':wanted=(base|set(map(ord,headline+common)))&supported
 first=primary&wanted
 rest=sorted(wanted-first,key=lambda cp:(-counts[cp],cp))
 groups=[first]+[set(rest[i:i+512]) for i in range(0,len(rest),512)]
 profile={'family':family,'originalBytes':(SOURCE/file).stat().st_size,'glyphs':len(wanted),'files':[]}
 for index,chars in enumerate(groups):
  if not chars:continue
  font=copy.deepcopy(original)
  options=subset.Options();options.flavor='woff2';options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];options.recalc_timestamp=False;options.layout_features=['*']
  subsetter=subset.Subsetter(options=options);subsetter.populate(unicodes=chars);subsetter.subset(font)
  if family!='OPPO Sans 4.0':family_name(font,family)
  font.flavor='woff2'
  slug={'OPPO Sans 4.0':'oppo4','ZhiYue Headline':'headline','ZhiYue Reading Serif':'reading'}[family]
  temp=OUT/f'{slug}-{index}.woff2';font.save(temp,reorderTables=False)
  data=temp.read_bytes();name=f'{slug}-{index}.{hashlib.sha256(data).hexdigest()[:12]}.woff2';temp.rename(OUT/name)
  css.append(f"@font-face{{font-family:'{family}';src:url('./assets/fonts/{name}') format('woff2');font-weight:{weight};font-style:normal;font-display:swap;unicode-range:{ranges(chars)}}}")
  profile['files'].append({'file':name,'bytes':len(data),'characters':len(chars),'core':index==0})
  print(f'{slug} {index+1}/{len(groups)}: {len(data)} bytes',flush=True)
 original.close();manifest['fonts'].append(profile)
styles='\n'.join(css)+'\n'
(ROOT/'dist/fonts-web.css').write_text(styles)
manifest['cssBytes']=len(styles.encode())
(ROOT/'dist/assets/fonts/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'totalFontBytes':sum(f['bytes'] for p in manifest['fonts'] for f in p['files']),'coreFontBytes':sum(f['bytes'] for p in manifest['fonts'] for f in p['files'] if f['core']),'cssBytes':manifest['cssBytes']}),flush=True)
