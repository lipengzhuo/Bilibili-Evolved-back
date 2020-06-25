interface BasicDanmakuData {
  content: string
  time: string
  type: string
  fontSize: string
  color: string
}
export class Danmaku {
  content: string
  time: string
  startTime: number
  type: DanmakuType
  fontSize: number
  color: number
  constructor({ content, time, type, fontSize, color }: BasicDanmakuData) {
    this.content = content
    this.time = time
    this.startTime = parseFloat(time)
    this.type = parseInt(type)
    this.fontSize = parseFloat(fontSize)
    this.color = parseInt(color)
  }
}
interface XmlDanmakuData extends BasicDanmakuData {
  timeStamp: string
  pool: string
  userHash: string
  rowId: string
  time: string
}
export class XmlDanmaku extends Danmaku {
  timeStamp: number
  pool: number
  userHash: string
  rowId: number
  pDataArray: Array<number | string>
  constructor({ content, time, type, fontSize, color, timeStamp, pool, userHash, rowId }: XmlDanmakuData) {
    super({ content, time, type, fontSize, color })
    this.timeStamp = parseInt(timeStamp)
    this.pool = parseInt(pool)
    this.userHash = userHash
    this.rowId = parseInt(rowId)
    this.pDataArray = [time, type, fontSize, color, timeStamp, pool, userHash, rowId]
  }
  text() {
    const pData = this.pDataArray.join(',')
    return `<d p="${pData}">${this.content}</d>`
  }
  static parse(element: Element) {
    const pData = element.getAttribute('p')!
    const [time, type, fontSize, color, timeStamp, pool, userHash, rowId] = pData.split(',')
    const content = element.innerHTML
    return new XmlDanmaku({ content, time, type, fontSize, color, timeStamp, pool, userHash, rowId })
  }
}
export class XmlDanmakuDocument {
  xml: string
  danmakus: XmlDanmaku[]
  constructor(xml: string) {
    this.xml = xml
    const document = new DOMParser().parseFromString(xml, 'application/xml').documentElement
    this.danmakus = [...document.querySelectorAll('d[p]')].map(it => XmlDanmaku.parse(it))
  }
}
interface AssDanmakuData extends BasicDanmakuData {
  typeTag: string
  colorTag: string
  endTime: string
}
interface FontStyles {
  [size: number]: string
}
interface Resolution {
  x: number
  y: number
}
export enum DanmakuType {
  Normal = 1,
  Normal2,
  Normal3,
  Bottom,
  Top,
  Reversed,
  Special,
  Special2
}
export class AssDanmaku extends Danmaku {
  typeTag: string
  colorTag: string
  endTime: string
  constructor({ content, time, type, fontSize, color, typeTag, colorTag, endTime }: AssDanmakuData) {
    super({ content, time, type, fontSize, color })
    this.typeTag = typeTag
    this.colorTag = colorTag
    this.endTime = endTime
  }
  text(fontStyles: FontStyles) {
    let style = fontStyles[this.fontSize]
    if (!style) {
      style = fontStyles[25]
    }
    const styleName = style.match(/Style:(.*?),/)![1].trim()
    return `Dialogue: 0,${this.time},${this.endTime},${styleName},,0,0,0,,{${this.typeTag}${this.colorTag}}${this.content}`
  }
}
export class AssDanmakuDocument {
  danmakus: AssDanmaku[]
  title: string
  fontStyles: FontStyles
  blockTypes: BlockTypes
  resolution: Resolution
  constructor(danmakus: AssDanmaku[], title: string, fontStyles: FontStyles, blockTypes: BlockTypes, resolution: Resolution) {
    this.danmakus = danmakus
    this.title = title
    this.fontStyles = fontStyles
    this.blockTypes = blockTypes
    this.resolution = resolution
  }
  generateAss() {
    const meta = `
[Script Info]
; Script generated by Bilibili Evolved Danmaku Converter
; https://github.com/the1812/Bilibili-Evolved/
Title: ${this.title}
ScriptType: v4.00+
PlayResX: ${this.resolution.x}
PlayResY: ${this.resolution.y}
Timer: 10.0000
WrapStyle: 2
ScaledBorderAndShadow: no

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${Object.values(this.fontStyles).join('\n')}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                `.trim()
    return meta + '\n' + this.danmakus
      .map(it => it.text(this.fontStyles))
      .filter(it => it !== '').join('\n')
  }
}

interface TrackItem {
  start: number
  end: number
  trackNumber: number
}
interface HorizontalTrackItem extends TrackItem {
  width: number
  visible: number
}
type Track = TrackItem[]
type TagStack = { tags: string }[]
interface TagData {
  targetTrack: Track
  initTrackNumber: number
  nextTrackNumber: number
  willOverlay: (trackItem: TrackItem, trackNumber: number, width: number) => boolean
  getTrackItem: (trackNumber: number, width: number, visibleTime: number) => TrackItem
  getTag: (info: { trackNumber: number, x: number, y: number }) => string
}
export class DanmakuStack {
  static readonly danmakuType = {
    [DanmakuType.Normal]: 'normal',
    [DanmakuType.Normal2]: 'normal',
    [DanmakuType.Normal3]: 'normal',
    [DanmakuType.Bottom]: 'bottom',
    [DanmakuType.Top]: 'top',
    [DanmakuType.Reversed]: 'reversed',
    [DanmakuType.Special]: 'special',
    [DanmakuType.Special2]: 'special'
  }
  static readonly margin = 4
  static readonly nextDanmakuDelay = 0.05

  horizontalStack: TagStack
  horizontalTrack: Track
  verticalStack: TagStack
  verticalTrack: Track
  resolution: Resolution
  duration: Duration
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  fontSizes: FontStyles
  bottomMarginPercent: number
  danmakuHeight: number
  trackHeight: number
  trackCount: number
  constructor(font: string, resolution: Resolution, duration: Duration, bottomMarginPercent: number) {
    this.horizontalStack = []
    this.horizontalTrack = []
    this.verticalStack = []
    this.verticalTrack = []
    this.resolution = resolution
    this.duration = duration
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')!
    // XML字体大小到实际大小的表
    this.fontSizes = {
      30: `64px ${font}`,
      25: `52px ${font}`,
      18: `36px ${font}`,
      45: `90px ${font}`,
    }

    this.bottomMarginPercent = bottomMarginPercent
    this.generateTracks()
  }
  generateTracks() {
    const height = 52
    this.danmakuHeight = height
    this.trackHeight = DanmakuStack.margin * 2 + height
    this.trackCount = parseInt(fixed(this.resolution.y * (1 - this.bottomMarginPercent) / this.trackHeight, 0))
  }
  getTextSize(danmaku: Danmaku) {
    this.context.font = this.fontSizes[danmaku.fontSize]
    const metrics = this.context.measureText(danmaku.content)
    const x = metrics.width / 2
    return [x, this.danmakuHeight / 2]
  }

  getTags(danmaku: Danmaku, { targetTrack, initTrackNumber, nextTrackNumber, willOverlay, getTrackItem, getTag }: TagData) {
    const [x, y] = this.getTextSize(danmaku)
    const width = x * 2
    /*
      x = this.resolution.x = 屏幕宽度
      d = this.duration(danmaku) = 当前弹幕总持续时长(从出现到完全消失)
      w = width = 当前弹幕的宽度
      delay = DanmakuStack.nextDanmakuDelay = 相邻弹幕间最小的时间间隔

      当前弹幕的速度 v = (x + w) / d
      完全进入屏幕所需时间 = visibleTime = delay + w / v = delay + wd / (x + w)
    */
    const visibleTime = this.duration(danmaku) * width / (this.resolution.x + width) + DanmakuStack.nextDanmakuDelay
    let trackNumber = initTrackNumber
    let overlayDanmaku = null
    // 寻找前面已发送的弹幕中可能重叠的
    do {
      overlayDanmaku = targetTrack.find(it => willOverlay(it, trackNumber, width))
      trackNumber += nextTrackNumber
    }
    while (overlayDanmaku && trackNumber <= this.trackCount && trackNumber >= 0)

    // 如果弹幕过多, 此条就不显示了
    if (trackNumber > this.trackCount || trackNumber < 0) {
      return `\\pos(0,-999)`
    }
    trackNumber -= nextTrackNumber // 减回最后的自增
    targetTrack.push(getTrackItem(trackNumber, width, visibleTime))
    return getTag({ trackNumber, x, y })
  }
  getHorizontalTags(danmaku: Danmaku) {
    return this.getTags(danmaku, {
      targetTrack: this.horizontalTrack,
      initTrackNumber: 0,
      nextTrackNumber: 1,
      willOverlay: (it: HorizontalTrackItem, trackNumber, width) => {
        if (it.trackNumber !== trackNumber) { // 不同轨道当然不会重叠
          return false
        }
        if (it.width < width) { // 弹幕比前面的弹幕长, 必须等前面弹幕走完
          /*
            x = this.resolution.x = 屏幕宽度
            d = this.duration(danmaku) = 当前弹幕总持续时长(从出现到完全消失)
            w = width = 当前弹幕的宽度
            end = it.end = 前面的弹幕结束时间点
            start = danmaku.startTime = 当前弹幕的开始时间点

            当前弹幕的速度 v = (x + w) / d
            当前弹幕碰到左侧边缘需要的时间 ▲t = x / v = dx / (x + w)
            当前弹幕碰到左侧边缘的时间点 t = ▲t + start

            如果会重叠, 则当前弹幕碰到左边缘时, 前面的弹幕还未结束
            即 t <= end
            也就是 start + dx / (x + w) <= end 或 dx / (x + w) <= end - start
          */
          return this.duration(danmaku) * this.resolution.x / (this.resolution.x + width) <= it.end - danmaku.startTime
        } else { // 前面弹幕完全进入屏幕的时间点晚于当前弹幕的开始时间, 就一定会重叠
          return it.visible > danmaku.startTime
        }
      },
      getTrackItem: (trackNumber, width, visibleTime) => {
        return {
          width: width,
          start: danmaku.startTime,
          visible: danmaku.startTime + visibleTime,
          end: danmaku.startTime + this.duration(danmaku),
          trackNumber
        } as HorizontalTrackItem
      },
      getTag: ({ trackNumber, x, y }) => {
        return `\\move(${this.resolution.x + x},${trackNumber * this.trackHeight + DanmakuStack.margin + y},${-x},${trackNumber * this.trackHeight + DanmakuStack.margin + y},0,${this.duration(danmaku) * 1000})`
      }
    })
  }
  getVerticalTags(danmaku: Danmaku) {
    const isTop = DanmakuStack.danmakuType[danmaku.type] === 'top'
    return this.getTags(danmaku, {
      targetTrack: this.verticalTrack,
      initTrackNumber: isTop ? 0 : this.trackCount - 1,
      nextTrackNumber: isTop ? 1 : -1,
      willOverlay: (it, trackNumber) => {
        if (it.trackNumber !== trackNumber) {
          return false
        }
        return it.end > danmaku.startTime
      },
      getTrackItem: (trackNumber) => {
        return {
          start: danmaku.startTime,
          end: danmaku.startTime + this.duration(danmaku),
          trackNumber
        }
      },
      getTag: ({ trackNumber, y }) => {
        if (isTop) {
          return `\\pos(${this.resolution.x / 2},${trackNumber * this.trackHeight + DanmakuStack.margin + y})`
        } else {
          return `\\pos(${this.resolution.x / 2},${this.resolution.y - DanmakuStack.margin - y - (this.trackCount - 1 - trackNumber) * this.trackHeight})`
        }
      }
    })
  }
  push(danmaku: Danmaku) {
    let tags: string = ''
    let stack: { tags: string }[] = []
    switch (DanmakuStack.danmakuType[danmaku.type]) {
      case 'normal':
      case 'reversed': // 反向先鸽了, 直接当正向了
        {
          tags = this.getHorizontalTags(danmaku)
          stack = this.horizontalStack
          break
        }
      case 'top':
      case 'bottom':
        {
          tags = this.getVerticalTags(danmaku)
          stack = this.verticalStack
          break
        }
      case 'special': // 高级弹幕也鸽了先
      default:
        {
          return {
            tags: `\\pos(0,-999)`
          }
        }
    }
    const info = {
      tags
    }
    stack.push(info)
    return info
  }
}
type Duration = (danmaku: Danmaku) => number
type BlockTypes = (DanmakuType | 'color')[]
export interface DanmakuConverterConfig {
  title: string
  font: string
  alpha: number
  bold: boolean
  duration: Duration
  blockTypes: BlockTypes
  resolution: Resolution
  bottomMarginPercent: number
  blockFilter?: (danmaku: XmlDanmaku) => boolean
}
export class DanmakuConverter {
  static white = 16777215 // Dec color of white danmaku
  title: string
  font: string
  alpha: string
  duration: Duration
  blockTypes: BlockTypes
  blockFilter: (danmaku: XmlDanmaku) => boolean
  resolution: Resolution
  bold: boolean
  danmakuStack: DanmakuStack
  constructor({ title, font, alpha, duration, blockTypes, blockFilter, resolution, bottomMarginPercent, bold }: DanmakuConverterConfig) {
    this.title = title
    this.font = font
    this.alpha = Math.round(alpha * 255).toString(16).toUpperCase().padStart(2, '0')
    this.duration = duration
    this.blockTypes = blockTypes
    this.blockFilter = blockFilter || (() => true)
    this.resolution = resolution
    this.bold = bold
    this.danmakuStack = new DanmakuStack(font, resolution, duration, bottomMarginPercent)
  }
  get fontStyles() {
    return {
      36: `Style: Larger,${this.font},72,&H${this.alpha}FFFFFF,&H${this.alpha}FFFFFF,&H${this.alpha}000000,&H${this.alpha}000000,${this.bold ? '1' : '0'},0,0,0,100,100,0,0,1,1.2,0,5,0,0,0,0`,
      30: `Style: Large,${this.font},64,&H${this.alpha}FFFFFF,&H${this.alpha}FFFFFF,&H${this.alpha}000000,&H${this.alpha}000000,${this.bold ? '1' : '0'},0,0,0,100,100,0,0,1,1.2,0,5,0,0,0,0`,
      25: `Style: Medium,${this.font},52,&H${this.alpha}FFFFFF,&H${this.alpha}FFFFFF,&H${this.alpha}000000,&H${this.alpha}000000,${this.bold ? '1' : '0'},0,0,0,100,100,0,0,1,1.2,0,5,0,0,0,0`,
      18: `Style: Small,${this.font},36,&H${this.alpha}FFFFFF,&H${this.alpha}FFFFFF,&H${this.alpha}000000,&H${this.alpha}000000,${this.bold ? '1' : '0'},0,0,0,100,100,0,0,1,1.2,0,5,0,0,0,0`,
      45: `Style: ExtraLarge,${this.font},90,&H${this.alpha}FFFFFF,&H${this.alpha}FFFFFF,&H${this.alpha}000000,&H${this.alpha}000000,${this.bold ? '1' : '0'},0,0,0,100,100,0,0,1,1.2,0,5,0,0,0,0`,
    }
  }
  convertToAssDocument(xml: string) {
    const xmlDanmakuDocument = new XmlDanmakuDocument(xml)
    const assDanmakus = []
    for (const xmlDanmaku of xmlDanmakuDocument.danmakus.sort((a, b) => a.startTime - b.startTime)) {
      // 跳过设置为屏蔽的弹幕类型
      if (this.blockTypes.indexOf(xmlDanmaku.type) !== -1 ||
        this.blockTypes.indexOf('color') !== -1 && xmlDanmaku.color !== DanmakuConverter.white) {
        continue
      }
      // 应用传入的过滤器
      if (!this.blockFilter(xmlDanmaku)) {
        continue
      }
      const [startTime, endTime] = this.convertTime(xmlDanmaku.startTime, this.duration(xmlDanmaku))
      assDanmakus.push(new AssDanmaku({
        content: this.convertText(xmlDanmaku.content),
        time: startTime,
        endTime: endTime,
        type: xmlDanmaku.type.valueOf().toString(),
        fontSize: xmlDanmaku.fontSize.toString(),
        color: xmlDanmaku.color.toString(),
        typeTag: this.convertType(xmlDanmaku),
        colorTag: this.convertColor(xmlDanmaku.color)
      }))
    }
    return new AssDanmakuDocument(
      assDanmakus,
      this.title,
      this.fontStyles,
      this.blockTypes,
      this.resolution
    )
  }
  convertText(text: string) {
    const map = {
      '{': '｛',
      '}': '｝',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'"
    }
    for (const [key, value] of Object.entries(map)) {
      text = text.replace(new RegExp(key, 'g'), value)
    }
    return text
  }
  convertType(danmaku: Danmaku) {
    return this.danmakuStack.push(danmaku).tags
  }
  convertColor(decColor: number) {
    if (decColor === DanmakuConverter.white) {
      return ''
    }
    const hex = decColor.toString(16)
    const red = hex.substring(0, 2)
    const green = hex.substring(2, 4)
    const blue = hex.substring(4, 6)
    return `\\c&H${blue}${green}${red}&`
  }
  convertTime(startTime: number, duration: number) {
    function round(number: number) {
      const [integer, decimal = '00'] = String(number).split('.')
      return `${integer.padStart(2, '0')}.${decimal.substr(0, 2).padEnd(2, '0')}`
    }
    function secondsToTime(seconds: number) {
      let hours = 0
      let minutes = 0
      while (seconds >= 60) {
        seconds -= 60
        minutes++
      }
      while (minutes >= 60) {
        minutes -= 60
        hours++
      }
      return `${hours}:${String(minutes).padStart(2, '0')}:${round(seconds)}`
    }
    return [secondsToTime(startTime), secondsToTime(startTime + duration)]
  }
}
export default {
  export: {
    AssDanmaku,
    AssDanmakuDocument,
    Danmaku,
    DanmakuConverter,
    DanmakuStack,
    DanmakuType,
    XmlDanmaku,
    XmlDanmakuDocument,
  }
}
