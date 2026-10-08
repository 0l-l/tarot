// =====================================================================
// All on-screen text in English and Traditional Chinese.
// To change any wording, edit it here. Both the page (index.html)
// and the server (server.js) read this one file.
// =====================================================================

(function (root) {
  const TEXT = {
    en: {
      htmlLang: "en",
      switchLabel: "中文",                 // shown on the button that switches TO the other language
      pageTitle: "Tarot Reading",
      tagline: "Ask · Draw · Reflect",
      placeholder: "What do you want to ask?",
      draw: "Draw Cards",
      positions: ["Past", "Present", "Future"],
      upright: "Upright",
      reversed: "Reversed",
      loading: "Reading the cards...",
      footer: "For entertainment only.",
      share: "Share this reading",
      shareTitle: "My tarot reading",
      copied: "Link copied! Paste it to a friend.",
      copyManual: "Copy this link to share your reading:",
      sharedLabel: "A reading shared with you",
      drawOwn: "Draw your own",
      tryAgain: "Try again",
      errors: {
        emptyQuestion: "Please type a question first.",
        tooLong: "Please keep your question under 300 characters.",
        deckLoading: "The deck is still loading. Try again in a second.",
        deckFailed: "Couldn't load the deck. Please refresh the page.",
        slow: "This is taking longer than usual. Please try again.",
        offline: "You seem to be offline. Check your internet connection and try again.",
        unreachable: "Couldn't reach the server. Please try again in a moment.",
        badLink: "This share link looks broken or incomplete. Ask your friend to send it again.",
        // These match the "code" the server sends back:
        timeout: "The spirits are taking too long to answer. Please try again in a moment.",
        busy: "Many people are seeking answers right now. Please wait a few seconds and try again.",
        rateLimited: "You've drawn a lot of readings in a short time. Take a breath and try again in a few minutes.",
        dailyLimit: "Today's readings are all used up. Please come back tomorrow.",
        invalid: "Something was wrong with that request. Please try again.",
        generic: "The cards are cloudy right now. Please try again."
      }
    },

    "zh-Hant": {
      htmlLang: "zh-Hant",
      switchLabel: "EN",
      pageTitle: "塔羅占卜",
      tagline: "提問 · 抽牌 · 沉思",
      placeholder: "你想問什麼？",
      draw: "抽牌",
      positions: ["過去", "現在", "未來"],
      upright: "正位",
      reversed: "逆位",
      loading: "正在解讀牌面……",
      footer: "僅供娛樂參考。",
      share: "分享這次占卜",
      shareTitle: "我的塔羅占卜",
      copied: "已複製連結！貼給朋友吧。",
      copyManual: "複製這個連結來分享你的占卜：",
      sharedLabel: "朋友分享給你的占卜",
      drawOwn: "我也要抽牌",
      tryAgain: "再試一次",
      errors: {
        emptyQuestion: "請先輸入你的問題。",
        tooLong: "問題請控制在 300 字以內。",
        deckLoading: "牌組還在載入中，請稍等一下再試。",
        deckFailed: "無法載入牌組，請重新整理頁面。",
        slow: "這次花的時間比平常久，請再試一次。",
        offline: "你似乎離線了，請檢查網路連線後再試一次。",
        unreachable: "暫時無法連線到伺服器，請稍後再試。",
        badLink: "這個分享連結好像壞掉或不完整，請朋友再傳一次。",
        timeout: "牌面的訊息來得有點慢，請稍後再試一次。",
        busy: "現在有很多人在尋求解答，請等幾秒後再試。",
        rateLimited: "你在短時間內抽了很多次牌，先休息一下，幾分鐘後再試吧。",
        dailyLimit: "今天的占卜次數已經用完了，明天再來吧。",
        invalid: "請求有點問題，請再試一次。",
        generic: "牌面暫時有些模糊，請再試一次。"
      }
    }
  };

  // ---------- Card names in Traditional Chinese ----------
  // Major Arcana, by number (0 = The Fool ... 21 = The World).
  const MAJOR_ZH = [
    "愚者", "魔術師", "女祭司", "皇后", "皇帝", "教皇", "戀人", "戰車",
    "力量", "隱者", "命運之輪", "正義", "吊人", "死神", "節制", "惡魔",
    "高塔", "星星", "月亮", "太陽", "審判", "世界"
  ];
  const SUIT_ZH = { wands: "權杖", cups: "聖杯", swords: "寶劍", pentacles: "錢幣" };
  // Minor Arcana ranks, by number (1 = Ace ... 14 = King).
  const RANK_ZH = [null, "王牌", "二", "三", "四", "五", "六", "七", "八", "九", "十", "侍者", "騎士", "皇后", "國王"];
  const COURT_ZH = { 11: "侍者", 12: "騎士", 13: "皇后", 14: "國王" };

  // Card name in the chosen language. `card` is a card object from cards.json.
  function cardName(card, lang) {
    if (lang !== "zh-Hant") return card.name;
    if (card.type === "major") return MAJOR_ZH[card.value_int];
    return SUIT_ZH[card.suit] + RANK_ZH[card.value_int]; // e.g. 聖杯皇后, 權杖王牌, 寶劍三
  }

  const LANGS = Object.keys(TEXT);
  const exportsObj = { TEXT, LANGS, cardName, COURT_ZH };

  // Works in both places: Node (server.js uses require) and the browser (window.I18N).
  if (typeof module !== "undefined" && module.exports) module.exports = exportsObj;
  else root.I18N = exportsObj;
})(typeof window !== "undefined" ? window : globalThis);
