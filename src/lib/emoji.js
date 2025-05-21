const emojis = [
  "🥶",
  "🙄",
  "😳",
  "😒",
  "🥰",
  "😎",
  "🫣",
  "😍",
  "😨",
  "😁",
  "😂",
  "👀",
  "👿",
  "🤖",
  "😮",
  "🔥",
  "✨",
  "🤖",
  "🌟",
  "🌞",
  "🎉",
  "🎊",
  "😺",
];

function getRandomEmoji() {
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

export { getRandomEmoji };
export default {
  getRandomEmoji,
};
