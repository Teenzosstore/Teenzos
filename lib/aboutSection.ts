export type AboutSectionSettings = {
  image_url: string
  eyebrow: string
  headline_top: string
  headline_bottom: string
  paragraph_one: string
  paragraph_two: string
  badge_value: string
  badge_label: string
  stat_one_value: string
  stat_one_label: string
  stat_two_value: string
  stat_two_label: string
  stat_three_value: string
  stat_three_label: string
}

export const DEFAULT_ABOUT_SECTION: AboutSectionSettings = {
  image_url: '/hero-parts.png',
  eyebrow: 'Our Story',
  headline_top: 'Crafted in Ahmedabad,',
  headline_bottom: 'made for the new gen.',
  paragraph_one:
    "Teenzosstore started with a bold vision — streetwear that lets you wear your vibe without compromises. Heavyweight fabric built for the hustle, cyber bunny graphics, and oversized fits that turn heads. Every piece is crafted, printed and packed with care in Ahmedabad.",
  paragraph_two:
    "No shortcuts. Just drops we are proud to put our name on, shipped to every corner of India.",
  badge_value: '3+',
  badge_label: 'Years on the streets',
  stat_one_value: '120+',
  stat_one_label: 'Drops delivered',
  stat_two_value: '24',
  stat_two_label: 'States shipped to',
  stat_three_value: '5,000+',
  stat_three_label: 'Flexers styled',
}
