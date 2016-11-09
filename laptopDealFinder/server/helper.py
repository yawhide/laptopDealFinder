from collections import defaultdict

def shouldFilterBySpecs(laptop):
  hasModel = laptop.get('Model') or laptop.get('Series')
  hasCpu = laptop.get('CPU') or laptop.get('CPU Type') or laptop.get('CPU Speed')
  hasGpu = laptop.get('Graphics Card') or laptop.get('Video Memory') or laptop.get('GPU/VPU')
  hasRam = laptop.get('Memory Spec') or laptop.get('Memory Speed') or laptop.get('Memory')
  hasStorage = laptop.get('HDD') or laptop.get('HDD RPM') or laptop.get('Storage') or laptop.get('HDD Spec')
  hasDisplay = laptop.get('Screen Size') or laptop.get('Resolution') or laptop.get('Display Type') or laptop.get('Screen')
  return hasModel and hasGpu and (hasCpu or hasRam or hasStorage or hasDisplay)

def filterBySpecList(laptops):
  return [laptop for laptop in laptops if shouldFilterBySpecs(laptop)]

def extractGPUFromDocument(doc):
  gpus = [
    '670',
    '750m',
    '755m',
    '765m',
    '770m',
    '780m',
    '790m',
    '840m',
    '845m',
    '850m',
    '855m',
    '860m',
    '865m',
    '870m',
    '880m',
    '940m',
    '940mx',
    '950m',
    '955m',
    '960m',
    '965m',
    '970m',
    '980m',
    '980',
    'hd 6770m',
    'hd 8750m',
    'hd 8970m',
    'quadro m1000m',
    'quadro m600m',
    'r9 m290x',
    'r9 m375',
    '1060',
    '1070',
    '1080'
  ]
  if doc.get('Graphics Card'):
    formattedStr = (doc.get('Graphics Card') + doc.get('Video Memory')).lower()
  elif doc.get('CPU/VPU'):
    formattedStr = doc.get('GPU/VPU').lower()
  else:
    return ''

  for gpu in gpus:
    if gpu in formattedStr:
      return gpu
  return ''

def groupByGPU(docs):
  d = defaultdict(list)
  for doc in docs:
    key = extractGPUFromDocument(doc)
    if key:
      d[key].append(doc)
  return dict(d)
