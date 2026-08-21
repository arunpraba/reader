export function readableText(background: string) {
  const channels = [1, 3, 5]
    .map(
      (index) => Number.parseInt(background.slice(index, index + 2), 16) / 255,
    )
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05
    ? "#ffffff"
    : "#171717";
}
